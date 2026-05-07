import { NestFactory } from '@nestjs/core';
import { createHash } from 'crypto';
import pLimit from 'p-limit';
import Parser from 'rss-parser';
import { AppModule } from '@/app.module.js';
import { EmbeddingService } from '@/embedding/embedding.service.js';
import { VectorsService } from '@/vectors/vectors.service.js';
import { chunkText } from './chunker.js';
import { stablePointUuid } from './ids.js';
import { RSS_SOURCES, sourceDomain } from './sources.js';

type FeedItem = {
    title?: string;
    link?: string;
    pubDate?: string;
    content?: string;
    contentSnippet?: string;
};

function sha256Hex(input: string) {
    return createHash('sha256').update(input, 'utf8').digest('hex');
}

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

async function withRetry<T>(fn: () => Promise<T>, label: string, attempts = 3): Promise<T> {
    let last: unknown;
    for (let i = 0; i < attempts; i++) {
        try {
            return await fn();
        } catch (e) {
            last = e;
            const wait = 400 * (i + 1);
            // eslint-disable-next-line no-console
            console.warn(`${label} failed (attempt ${i + 1}/${attempts}), retry in ${wait}ms`, e);
            await sleep(wait);
        }
    }
    throw last;
}

function expiredAtFromPubDate(pubDate: string | undefined, days = 30): string | undefined {
    if (!pubDate) return undefined;
    const t = Date.parse(pubDate);
    if (Number.isNaN(t)) return undefined;
    return new Date(t + days * 86400000).toISOString();
}

type PendingChunk = {
    id: string;
    text: string;
    hashContent: string;
    payload: Record<string, unknown>;
};

async function main() {
    const rssConcurrency = Number(process.env.INGEST_RSS_CONCURRENCY ?? '4');
    const embedBatchSize = Number(process.env.INGEST_EMBED_BATCH ?? '128');
    const upsertBatchSize = Number(process.env.INGEST_UPSERT_BATCH ?? '64');
    const upsertParallel = Number(process.env.INGEST_UPSERT_PARALLEL ?? '3');

    const app = await NestFactory.createApplicationContext(AppModule, { logger: ['log', 'error', 'warn'] });
    const embedding = app.get(EmbeddingService);
    const vectors = app.get(VectorsService);

    const parser = new Parser();
    const limit = pLimit(Math.max(1, rssConcurrency));

    const feedTasks = RSS_SOURCES.map((src) =>
        limit(async () => {
            const feed = await withRetry(() => parser.parseURL(src.url), `RSS ${src.name}`);
            return { src, feed };
        }),
    );

    const feeds = await Promise.all(feedTasks);

    const pending: PendingChunk[] = [];

    for (const { src, feed } of feeds) {
        const items = (feed.items ?? []) as FeedItem[];
        const domain = sourceDomain(src);

        for (const item of items) {
            const url = (item.link ?? '').trim();
            if (!url) continue;

            const raw = item.contentSnippet ?? item.content ?? '';
            const chunks = chunkText(raw);
            if (!chunks.length) continue;

            const expiredAt = expiredAtFromPubDate(item.pubDate);

            for (let i = 0; i < chunks.length; i++) {
                const text = chunks[i];
                const hashContent = sha256Hex(text);
                const logicalKey = `${src.name}|${url}|${i}`;
                const id = stablePointUuid(logicalKey);
                const chunkId = logicalKey;

                pending.push({
                    id,
                    text,
                    hashContent,
                    payload: {
                        source: src.name,
                        url,
                        title: item.title ?? '',
                        publishedAt: item.pubDate ?? '',
                        chunkId,
                        chunkIndex: i,
                        text,
                        hash_content: hashContent,
                        category: src.category,
                        domain,
                        credibilityWeight: src.credibilityWeight,
                        ...(expiredAt ? { expiredAt } : {}),
                    },
                });
            }
        }
    }

    if (!pending.length) {
        // eslint-disable-next-line no-console
        console.log('No chunks to ingest.');
        await app.close();
        return;
    }

    const existing = await vectors.retrieveByIds(pending.map((p) => p.id));
    const idToHash = new Map<string, string>();
    for (const pt of existing) {
        const id = typeof pt.id === 'string' ? pt.id : String(pt.id);
        const pl = pt.payload as Record<string, unknown> | null | undefined;
        const h = pl?.hash_content;
        if (typeof h === 'string') idToHash.set(id, h);
    }

    const toEmbed = pending.filter((p) => idToHash.get(p.id) !== p.hashContent);

    // eslint-disable-next-line no-console
    console.log(
        `Ingest: ${pending.length} chunk slots, ${toEmbed.length} need embed (${pending.length - toEmbed.length} unchanged skip)`,
    );

    const points: Array<{ id: string; vector: number[]; payload: Record<string, unknown> }> = [];

    for (let i = 0; i < toEmbed.length; i += embedBatchSize) {
        const slice = toEmbed.slice(i, i + embedBatchSize);
        const texts = slice.map((s) => s.text);
        const vecs = await embedding.embed(texts);
        for (let j = 0; j < slice.length; j++) {
            points.push({
                id: slice[j].id,
                vector: vecs[j],
                payload: slice[j].payload,
            });
        }
        // eslint-disable-next-line no-console
        console.log(`Embedded ${Math.min(i + embedBatchSize, toEmbed.length)}/${toEmbed.length}`);
    }

    const upsertBatches: (typeof points)[] = [];
    for (let i = 0; i < points.length; i += upsertBatchSize) {
        upsertBatches.push(points.slice(i, i + upsertBatchSize));
    }
    const upsertLimit = pLimit(Math.max(1, upsertParallel));
    let upserted = 0;
    await Promise.all(
        upsertBatches.map((batch) =>
            upsertLimit(async () => {
                await vectors.upsert(batch);
                upserted += batch.length;
                // eslint-disable-next-line no-console
                console.log(`Upserted ${upserted}/${points.length}`);
            }),
        ),
    );

    await app.close();
}

main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
});
