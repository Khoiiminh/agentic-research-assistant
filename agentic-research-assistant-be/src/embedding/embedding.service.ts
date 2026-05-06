import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import type { EmbeddingProvider } from './providers/embedding-provider.js';
import { LocalSidecarProvider } from './providers/local-sidecar.provider.js';
import { RemoteHttpProvider } from './providers/remote-http.provider.js';

type ProviderKind = 'local' | 'remote';

/** Max length to use raw string as Map key; longer strings use MD5 to cap key memory. */
const CACHE_KEY_INLINE_MAX = 512;

@Injectable()
export class EmbeddingService {
    private readonly logger = new Logger(EmbeddingService.name);
    private readonly provider: EmbeddingProvider;

    /**
     * LRU via insertion order: on get/set, delete+set moves entry to end.
     * Evict: delete first key from Map — O(1) per eviction.
     * Values are embedding vectors only (Float64-backed arrays from provider).
     */
    private readonly cache = new Map<string, number[]>();
    private readonly cacheMaxEntries = 5000;

    /**
     * Request collapsing: concurrent embed() calls with the same set of missing keys
     * share one provider.embed batch (signature = sorted keys). Overlapping but unequal sets
     * (e.g. {a} vs {a,b}) may still issue separate batches until a shared queue is added.
     */
    private readonly batchInFlight = new Map<string, Promise<Map<string, number[]>>>();

    constructor(private readonly config: ConfigService) {
        const providerKind = (this.config.get<string>('EMBEDDING_PROVIDER') ?? 'local') as ProviderKind;
        this.provider =
            providerKind === 'remote'
                ? new RemoteHttpProvider(this.config)
                : new LocalSidecarProvider(this.config);
    }

    getProviderName() {
        return this.provider.name;
    }

    async embed(texts: string[]): Promise<number[][]> {
        const trimmed = texts.map((t) => t.trim());
        const keys = trimmed.map((t) => this.cacheKey(t));
        const results: number[][] = new Array(trimmed.length);

        const needIndices: number[] = [];
        for (let i = 0; i < trimmed.length; i++) {
            const hit = this.lruGet(keys[i]);
            if (hit) results[i] = hit;
            else needIndices.push(i);
        }

        if (needIndices.length === 0) return results;

        // Dedupe by cache key (same text may appear multiple times in one request).
        const keyToText = new Map<string, string>();
        for (const i of needIndices) {
            const k = keys[i];
            if (!keyToText.has(k)) keyToText.set(k, trimmed[i]);
        }

        // Re-check cache (another request may have filled while we built the map).
        const stillMissing: Array<{ key: string; text: string }> = [];
        for (const [key, text] of keyToText) {
            const v = this.lruGet(key);
            if (v) {
                for (const i of needIndices) {
                    if (keys[i] === key) results[i] = v;
                }
                continue;
            }
            stillMissing.push({ key, text });
        }

        if (stillMissing.length === 0) {
            for (const i of needIndices) {
                if (!results[i]) results[i] = this.lruGet(keys[i])!;
            }
            return results;
        }

        let vectorsByKey: Map<string, number[]>;
        try {
            vectorsByKey = await this.embedUniqueKeysBatched(stillMissing);
        } catch (err) {
            this.logger.error('Embedding provider failed for batch', err instanceof Error ? err.stack : String(err));
            throw err;
        }

        for (const i of needIndices) {
            if (!results[i]) {
                const v = vectorsByKey.get(keys[i]) ?? this.lruGet(keys[i]);
                if (!v) {
                    throw new Error(`EmbeddingService: missing vector for key after batch (index ${i})`);
                }
                results[i] = v;
            }
        }

        return results;
    }

    private cacheKey(text: string): string {
        if (text.length <= CACHE_KEY_INLINE_MAX) return `s:${text}`;
        return `h:${createHash('md5').update(text, 'utf8').digest('hex')}`;
    }

    /** Get value and mark as most recently used — O(1). */
    private lruGet(key: string): number[] | undefined {
        const v = this.cache.get(key);
        if (v === undefined) return undefined;
        this.cache.delete(key);
        this.cache.set(key, v);
        return v;
    }

    private lruSet(key: string, vector: number[]) {
        this.cache.delete(key);
        this.cache.set(key, vector);
        while (this.cache.size > this.cacheMaxEntries) {
            const firstKey = this.cache.keys().next().value as string | undefined;
            if (firstKey === undefined) break;
            this.cache.delete(firstKey);
        }
    }

    /**
     * One provider call for all missing unique keys; concurrent callers with the same
     * key-set share the same Promise (signature from sorted keys).
     */
    private embedUniqueKeysBatched(pairs: Array<{ key: string; text: string }>): Promise<Map<string, number[]>> {
        const sorted = [...pairs].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
        const batchKeys = sorted.map((p) => p.key);
        const batchTexts = sorted.map((p) => p.text);
        const sig = batchKeys.join('\0');

        let p = this.batchInFlight.get(sig);
        if (p) return p;

        p = (async () => {
            try {
                const vectors = await this.provider.embed(batchTexts);
                if (vectors.length !== batchKeys.length) {
                    throw new Error(
                        `EmbeddingService: provider returned ${vectors.length} vectors for ${batchKeys.length} texts`,
                    );
                }
                const out = new Map<string, number[]>();
                for (let i = 0; i < batchKeys.length; i++) {
                    const vec = vectors[i];
                    const k = batchKeys[i];
                    this.lruSet(k, vec);
                    out.set(k, vec);
                }
                return out;
            } finally {
                this.batchInFlight.delete(sig);
            }
        })();

        this.batchInFlight.set(sig, p);
        return p;
    }
}
