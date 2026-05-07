import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * LangGraph tool: reads and extracts text content from a given URL using Cheerio.
 * Used by the Researcher agent to get full content from a web search result URL.
 */
export function createWebReaderTool() {
    return tool(
        async ({ url, maxLength }) => {
            try {
                const response = await axios.get(url, {
                    timeout: 10000,
                    headers: {
                        'User-Agent':
                            'Mozilla/5.0 (compatible; AgenticResearchBot/1.0)',
                        Accept: 'text/html,application/xhtml+xml',
                    },
                    maxContentLength: 2 * 1024 * 1024, // 2MB max
                });

                const $ = cheerio.load(response.data);

                // Remove scripts, styles, nav, footer, ads
                $('script, style, nav, footer, header, aside, .ad, .ads, .advertisement, .sidebar').remove();

                // Extract main content — prefer <article> or <main>, fallback to body
                let content = '';
                const mainEl = $('article, main, [role="main"]').first();
                if (mainEl.length) {
                    content = mainEl.text();
                } else {
                    content = $('body').text();
                }

                // Normalize whitespace
                content = content
                    .replace(/\s+/g, ' ')
                    .replace(/\n\s*\n/g, '\n')
                    .trim();

                const limit = maxLength ?? 4000;
                if (content.length > limit) {
                    content = content.slice(0, limit) + '... [truncated]';
                }

                return JSON.stringify({
                    url,
                    content,
                    length: content.length,
                });
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return JSON.stringify({
                    url,
                    content: '',
                    error: `Failed to read URL: ${msg}`,
                });
            }
        },
        {
            name: 'web_reader',
            description:
                'Read and extract the main text content from a specific URL. ' +
                'Use this to get the full article text after finding a relevant URL via web search. ' +
                'Strips HTML tags, scripts, styles, and navigation elements.',
            schema: z.object({
                url: z.string().url().describe('The URL to read content from'),
                maxLength: z
                    .number()
                    .optional()
                    .default(4000)
                    .describe('Maximum character length of extracted text (default: 4000)'),
            }),
        },
    );
}
