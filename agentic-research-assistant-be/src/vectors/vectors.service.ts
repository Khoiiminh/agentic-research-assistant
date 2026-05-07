import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';

type Distance = 'Cosine' | 'Euclid' | 'Dot';

type QdrantFilter = Record<string, unknown>;

@Injectable()
export class VectorsService implements OnModuleInit {
    private readonly logger = new Logger(VectorsService.name);
    private readonly client: QdrantClient;
    private readonly collectionName: string;
    private readonly vectorSize: number;
    private readonly distance: Distance;
    private readonly upsertWaitDefault: boolean;

    constructor(private readonly config: ConfigService) {
        const url = this.config.getOrThrow<string>('QDRANT_URL');
        // MODIFIED: Support Qdrant Cloud auth via API key (optional for local Qdrant)
        const apiKey = this.config.get<string>('QDRANT_API_KEY');
        this.client = new QdrantClient({ url, apiKey: apiKey || undefined } as any);
        this.collectionName = this.config.getOrThrow<string>('QDRANT_COLLECTION');
        this.vectorSize = Number(this.config.getOrThrow<string>('QDRANT_VECTOR_SIZE'));
        this.distance = (this.config.getOrThrow<string>('QDRANT_DISTANCE') as Distance) ?? 'Cosine';
        const waitRaw = this.config.get<string>('QDRANT_UPSERT_WAIT') ?? 'true';
        this.upsertWaitDefault = waitRaw.toLowerCase() !== 'false';
    }

    async onModuleInit() {
        await this.ensureCollection();
        await this.ensurePayloadIndexes();
    }

    async ensureCollection() {
        const collections = await this.client.getCollections();
        const exists = collections.collections.some((c) => c.name === this.collectionName);
        if (exists) return;

        const hnsw_m = Number(this.config.get<string>('QDRANT_HNSW_M') ?? '16');
        const hnsw_ef_construct = Number(this.config.get<string>('QDRANT_HNSW_EF_CONSTRUCT') ?? '100');
        const hnsw_full_scan = Number(this.config.get<string>('QDRANT_HNSW_FULL_SCAN_THRESHOLD') ?? '10000');

        const quant = (this.config.get<string>('QDRANT_SCALAR_QUANTIZATION') ?? '').toLowerCase();
        const quantization_config =
            quant === 'int8'
                ? {
                      scalar: {
                          type: 'int8' as const,
                          quantile: Number(this.config.get<string>('QDRANT_QUANTILE') ?? '0.99'),
                          always_ram: (this.config.get<string>('QDRANT_QUANT_ALWAYS_RAM') ?? 'true') !== 'false',
                      },
                  }
                : undefined;

        await this.client.createCollection(this.collectionName, {
            vectors: {
                size: this.vectorSize,
                distance: this.distance,
            },
            hnsw_config: {
                m: hnsw_m,
                ef_construct: hnsw_ef_construct,
                full_scan_threshold: hnsw_full_scan,
            },
            ...(quantization_config ? { quantization_config } : {}),
        });
    }

    /**
     * Payload indexes for filter fields; avoids full-scan on category/source/text/credibility.
     * Safe to call on existing collections (ignores "already exists" errors).
     */
    async ensurePayloadIndexes() {
        const indexes: Array<{ field_name: string; field_schema: unknown }> = [
            { field_name: 'category', field_schema: 'keyword' },
            { field_name: 'source', field_schema: 'keyword' },
            { field_name: 'credibilityWeight', field_schema: 'float' },
            {
                field_name: 'text',
                field_schema: {
                    type: 'text',
                    tokenizer: 'word',
                    min_token_len: 2,
                    lowercase: true,
                },
            },
        ];

        for (const idx of indexes) {
            try {
                await this.client.createPayloadIndex(this.collectionName, idx as any);
                this.logger.log(`Payload index ensured: ${idx.field_name}`);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e);
                if (msg.includes('already exists') || msg.includes('Already exists') || /409|400/.test(msg)) {
                    continue;
                }
                this.logger.warn(`Payload index ${idx.field_name}: ${msg}`);
            }
        }
    }

    async upsert(
        points: Array<{ id: string; vector: number[]; payload: Record<string, unknown> }>,
        options?: { wait?: boolean },
    ) {
        const wait = options?.wait ?? this.upsertWaitDefault;
        return await this.client.upsert(this.collectionName, {
            wait,
            points: points.map((p) => ({ id: p.id, vector: p.vector, payload: p.payload })),
        });
    }

    /** Batch retrieve by point id; parallel batch requests to Qdrant. */
    async retrieveByIds(ids: string[]) {
        if (ids.length === 0) return [];
        const batchSize = 128;
        const slices: string[][] = [];
        for (let i = 0; i < ids.length; i += batchSize) {
            slices.push(ids.slice(i, i + batchSize));
        }
        const chunks = await Promise.all(
            slices.map((slice) =>
                this.client.retrieve(this.collectionName, {
                    ids: slice,
                    with_payload: true,
                }),
            ),
        );
        return chunks.flat();
    }

    async search(args: {
        vector: number[];
        topK: number;
        scoreThreshold?: number;
        filter?: QdrantFilter;
        category?: string;
        source?: string;
        minCredibility?: number;
        /** Requires `text` payload index; combines with vector search as constrained retrieval. */
        matchText?: string;
        /** Post-process: multiply score by a blend of vector similarity and credibilityWeight (Research Assistant). */
        applyCredibilityBoost?: boolean;
    }) {
        const {
            vector,
            topK,
            scoreThreshold,
            filter: rawFilter,
            category,
            source,
            minCredibility,
            matchText,
            applyCredibilityBoost,
        } = args;

        const filter = this.mergeSearchFilters(rawFilter, {
            category,
            source,
            minCredibility,
            matchText,
        });

        const results = await this.client.search(this.collectionName, {
            vector,
            limit: topK,
            score_threshold: scoreThreshold,
            filter: filter as any,
            with_payload: true,
        });

        const boost = applyCredibilityBoost === true;
        if (!boost) return results;

        return results
            .map((r) => {
                const w = (r.payload as Record<string, unknown> | null | undefined)?.credibilityWeight;
                const c = typeof w === 'number' && !Number.isNaN(w) ? Math.max(0, Math.min(1, w)) : 0.5;
                const blended = r.score * (0.55 + 0.45 * c);
                return { ...r, score: blended, scoreVector: r.score };
            })
            .sort((a, b) => b.score - a.score);
    }

    private mergeSearchFilters(
        raw: QdrantFilter | undefined,
        opts: { category?: string; source?: string; minCredibility?: number; matchText?: string },
    ): QdrantFilter | undefined {
        const extraMust: unknown[] = [];
        if (opts.category?.trim()) {
            extraMust.push({ key: 'category', match: { value: opts.category.trim() } });
        }
        if (opts.source?.trim()) {
            extraMust.push({ key: 'source', match: { value: opts.source.trim() } });
        }
        if (opts.minCredibility !== undefined && !Number.isNaN(opts.minCredibility)) {
            extraMust.push({ key: 'credibilityWeight', range: { gte: opts.minCredibility } });
        }
        if (opts.matchText?.trim()) {
            extraMust.push({ key: 'text', match: { text: opts.matchText.trim() } });
        }

        if (extraMust.length === 0) return raw;

        if (!raw || Object.keys(raw).length === 0) {
            return { must: extraMust };
        }

        const must = Array.isArray((raw as { must?: unknown }).must) ? [...(raw as { must: unknown[] }).must] : [raw];
        return { must: [...extraMust, ...must] };
    }
}
