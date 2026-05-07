import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import axios from 'axios';

/**
 * LangGraph tool: real-time web search via Tavily API.
 * Used by the Researcher agent to cross-check facts and get up-to-date information.
 */
export function createWebSearchTool(tavilyApiKey: string) {
    return tool(
        async ({ query, maxResults }) => {
            if (!tavilyApiKey) {
                return JSON.stringify({
                    results: [],
                    message: 'Web search is not configured. Set TAVILY_API_KEY in environment.',
                });
            }

            try {
                const response = await axios.post(
                    'https://api.tavily.com/search',
                    {
                        api_key: tavilyApiKey,
                        query,
                        max_results: maxResults ?? 5,
                        search_depth: 'basic',
                        include_answer: false,
                        include_raw_content: false,
                    },
                    { timeout: 15000 },
                );

                const results = (response.data?.results ?? []).map((r: any) => ({
                    title: r.title ?? '',
                    url: r.url ?? '',
                    snippet: r.content ?? '',
                    score: r.score ?? 0,
                }));

                return JSON.stringify({ results });
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return JSON.stringify({
                    results: [],
                    message: `Web search failed: ${msg}`,
                });
            }
        },
        {
            name: 'web_search',
            description:
                'Search the web for real-time information using Tavily API. ' +
                'Use this to fact-check information, find latest news, or get data not in the internal database. ' +
                'Returns titles, URLs, and text snippets.',
            schema: z.object({
                query: z.string().describe('The search query'),
                maxResults: z.number().optional().default(5).describe('Maximum number of results (default: 5)'),
            }),
        },
    );
}
