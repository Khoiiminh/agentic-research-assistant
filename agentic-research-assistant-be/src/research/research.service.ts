import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmbeddingService } from '@/embedding/embedding.service.js';
import { VectorsService } from '@/vectors/vectors.service.js';
import type { ResearchRequestDto, ResearchResponse, ResearchSource } from './dto/research.dto.js';
import { OpenAiCompatibleLlmProvider } from './llm/openai-compatible-llm.provider.js';

type RetrievedHit = {
    score: number;
    payload?: Record<string, unknown> | null;
};

@Injectable()
export class ResearchService {
    private readonly logger = new Logger(ResearchService.name);
    private readonly llm: OpenAiCompatibleLlmProvider;

    constructor(
        private readonly config: ConfigService,
        private readonly embedding: EmbeddingService,
        private readonly vectors: VectorsService,
    ) {
        this.llm = new OpenAiCompatibleLlmProvider(this.config);
    }

    async research(dto: ResearchRequestDto): Promise<ResearchResponse> {
        const query = dto.query.trim();
        const topK = dto.topK ?? 5;
        const applyCredibilityBoost = dto.applyCredibilityBoost ?? true;

        const qVec = await this.embedding.embed([query]);
        const hits = (await this.vectors.search({
            vector: qVec[0],
            topK,
            category: dto.category,
            minCredibility: dto.minCredibility,
            matchText: dto.matchText,
            applyCredibilityBoost,
        })) as unknown as RetrievedHit[];

        const sources = this.toSources(hits);
        const { context, contextChunkIds } = this.buildContextCapped(hits);

        const system = this.systemPrompt();
        const user = this.userPrompt(query, context);

        try {
            const { content } = await this.llm.chat({ messages: [system, user] });
            const { answer, citedChunkIds } = this.validateCitations(content, contextChunkIds);

            // Only return sources that were actually cited (stable mapping by chunkId).
            const citedSources = sources.filter((s) => citedChunkIds.has(s.chunkId));

            return {
                answer,
                sources: citedSources.length ? citedSources : sources,
                retrievedCount: hits.length,
                llmUsed: true,
                isExtractiveFallback: false,
                ...(dto.includeContext ? { context } : {}),
            };
        } catch (err) {
            this.logger.warn(`LLM unavailable; returning extractive fallback. ${this.errMsg(err)}`);
            const snippets = sources
                .slice(0, Math.min(5, sources.length))
                .map((s) => ({ chunkId: s.chunkId, text: this.getPayloadTextByChunkId(hits, s.chunkId) ?? '' }))
                .filter((x) => x.text);

            return {
                answer:
                    'AI service is currently unavailable. Displaying raw contextual snippets instead.',
                sources,
                retrievedCount: hits.length,
                llmUsed: false,
                isExtractiveFallback: true,
                snippets,
                ...(dto.includeContext ? { context } : {}),
            };
        }
    }

    private systemPrompt() {
        return {
            role: 'system' as const,
            content:
                [
                    'You are a Topic Research Assistant.',
                    'You MUST answer ONLY using the provided context blocks.',
                    'You MUST ONLY cite sources that appear in the context.',
                    'Citations MUST use the exact chunk id format: [chunkId].',
                    "If the context does not contain the answer, respond exactly: 'Insufficient information.'",
                    'Do not invent citations.',
                ].join('\n'),
        };
    }

    private userPrompt(query: string, context: string) {
        return {
            role: 'user' as const,
            content: `Query:\n${query}\n\nContext:\n${context}\n\nAnswer (with citations [chunkId]):`,
        };
    }

    private toSources(hits: RetrievedHit[]): ResearchSource[] {
        const out: ResearchSource[] = [];
        for (const h of hits) {
            const p = (h.payload ?? {}) as Record<string, unknown>;
            const chunkId = typeof p.chunkId === 'string' ? p.chunkId : '';
            if (!chunkId) continue;
            out.push({
                chunkId,
                url: typeof p.url === 'string' ? p.url : undefined,
                title: typeof p.title === 'string' ? p.title : undefined,
                publishedAt: typeof p.publishedAt === 'string' ? p.publishedAt : undefined,
                score: typeof h.score === 'number' ? h.score : undefined,
                credibilityWeight: typeof p.credibilityWeight === 'number' ? p.credibilityWeight : undefined,
            });
        }
        return out;
    }

    /**
     * Token-based capping: never truncate inside a chunk.
     * Budget uses a lightweight heuristic: tokens ≈ ceil(chars/4).
     * Drops lowest-score chunks until within budget.
     */
    private buildContextCapped(hits: RetrievedHit[]) {
        const windowTokens = Number(this.config.get<string>('LLM_CONTEXT_WINDOW_TOKENS') ?? '8192');
        const maxTokens = Number(this.config.get<string>('LLM_MAX_TOKENS') ?? '512');
        const overheadTokens = Number(this.config.get<string>('LLM_CONTEXT_OVERHEAD_TOKENS') ?? '800');
        const budget = Math.max(256, windowTokens - maxTokens - overheadTokens);

        const blocks: Array<{ chunkId: string; score: number; text: string; header: string }> = [];
        for (const h of hits) {
            const p = (h.payload ?? {}) as Record<string, unknown>;
            const chunkId = typeof p.chunkId === 'string' ? p.chunkId : '';
            const text = typeof p.text === 'string' ? p.text : '';
            if (!chunkId || !text) continue;

            const title = typeof p.title === 'string' ? p.title : '';
            const url = typeof p.url === 'string' ? p.url : '';
            const publishedAt = typeof p.publishedAt === 'string' ? p.publishedAt : '';

            const headerParts = [
                `[${chunkId}]`,
                title ? `title="${title.replace(/\\s+/g, ' ').trim()}"` : '',
                url ? `url=${url}` : '',
                publishedAt ? `publishedAt=${publishedAt}` : '',
            ].filter(Boolean);

            blocks.push({
                chunkId,
                score: typeof h.score === 'number' ? h.score : 0,
                text,
                header: headerParts.join(' | '),
            });
        }

        // Sort by score desc; then keep adding until budget reached; drop whole chunks.
        blocks.sort((a, b) => b.score - a.score);

        const chosen: typeof blocks = [];
        let used = 0;
        for (const b of blocks) {
            const blockStr = `${b.header}\n${b.text}\n`;
            const t = this.estimateTokens(blockStr);
            if (t > budget) continue; // single block too large — drop it
            if (used + t > budget) continue;
            chosen.push(b);
            used += t;
        }

        const context = chosen.map((b) => `${b.header}\n${b.text}`).join('\n\n');
        const contextChunkIds = new Set(chosen.map((b) => b.chunkId));
        return { context, contextChunkIds };
    }

    private estimateTokens(s: string) {
        return Math.ceil(s.length / 4);
    }

    private validateCitations(answerRaw: string, allowedChunkIds: Set<string>) {
        const citedChunkIds = new Set<string>();
        const cleaned = answerRaw.replace(/\[([^\]]+)\]/g, (full, inner: string) => {
            const chunkId = inner.trim();
            if (allowedChunkIds.has(chunkId)) {
                citedChunkIds.add(chunkId);
                return `[${chunkId}]`;
            }
            // Drop invalid citation tokens.
            return '';
        });

        return { answer: cleaned.trim(), citedChunkIds };
    }

    private getPayloadTextByChunkId(hits: RetrievedHit[], chunkId: string) {
        for (const h of hits) {
            const p = (h.payload ?? {}) as Record<string, unknown>;
            if (p.chunkId === chunkId && typeof p.text === 'string') return p.text;
        }
        return undefined;
    }

    private errMsg(err: unknown) {
        return err instanceof Error ? err.message : String(err);
    }
}

