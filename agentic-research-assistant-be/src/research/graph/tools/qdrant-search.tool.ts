import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import type { EmbeddingService } from '@/embedding/embedding.service.js';
import type { VectorsService } from '@/vectors/vectors.service.js';

/**
 * LangGraph tool: searches Qdrant vector DB for relevant document chunks.
 * Used by the Researcher agent to retrieve internal knowledge.
 */
export function createQdrantSearchTool(
    embeddingService: EmbeddingService,
    vectorsService: VectorsService,
) {
    return tool(
        async ({ query, topK, category }) => {
            const vectors = await embeddingService.embed([query]);
            const hits = await vectorsService.search({
                vector: vectors[0],
                topK: topK ?? 5,
                category: category || undefined,
                applyCredibilityBoost: true,
            });

            if (!hits || hits.length === 0) {
                return JSON.stringify({ results: [], message: 'No relevant documents found in Qdrant.' });
            }

            const results = hits.map((hit: any) => {
                const p = (hit.payload ?? {}) as Record<string, unknown>;
                return {
                    chunkId: p.chunkId ?? '',
                    title: p.title ?? '',
                    url: p.url ?? '',
                    publishedAt: p.publishedAt ?? '',
                    text: p.text ?? '',
                    score: hit.score ?? 0,
                    credibilityWeight: p.credibilityWeight ?? 0.5,
                };
            });

            return JSON.stringify({ results });
        },
        {
            name: 'qdrant_search',
            description:
                'Search the internal Qdrant vector database for document chunks relevant to a query. ' +
                'Returns ranked results with text, metadata, and relevance scores. ' +
                'Use this tool to find information from pre-indexed articles and documents.',
            schema: z.object({
                query: z.string().describe('The search query to find relevant documents'),
                topK: z.number().optional().default(5).describe('Number of top results to return (default: 5)'),
                category: z.string().optional().describe('Optional category filter'),
            }),
        },
    );
}
