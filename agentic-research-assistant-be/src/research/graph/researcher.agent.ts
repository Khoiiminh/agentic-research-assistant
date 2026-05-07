import { AIMessage } from '@langchain/core/messages';
import type { AgentStateType } from './agent.state.js';
import type { StructuredToolInterface } from '@langchain/core/tools';
import { ChatOpenAI } from '@langchain/openai';

/**
 * Researcher Agent Node
 *
 * Responsible for gathering information using tools:
 * - QdrantSearchTool  (internal knowledge)
 * - WebSearchTool     (real-time web knowledge)
 * - WebReaderTool     (full article extraction)
 *
 * Increments researchSteps on each invocation.
 */
export function createResearcherNode(
    llmBaseUrl: string,
    llmModel: string,
    llmApiKey: string,
    tools: StructuredToolInterface[],
) {
    const llm = new ChatOpenAI({
        configuration: { baseURL: `${llmBaseUrl.replace(/\/+$/, '')}/v1` },
        modelName: llmModel,
        openAIApiKey: llmApiKey || 'not-needed',
        temperature: 0.1,
        maxTokens: 1024,
    });

    const llmWithTools = llm.bindTools(tools);

    return async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
        const currentStep = state.researchSteps + 1;

        const systemMessage = {
            role: 'system' as const,
            content: [
                'You are a Research Agent specialized in gathering information.',
                'You have access to tools for searching the internal database (qdrant_search), searching the web (web_search), and reading web pages (web_reader).',
                '',
                'Your strategy:',
                '1. ALWAYS start by searching the internal Qdrant database for relevant documents.',
                '2. If internal results are insufficient, use web_search to find additional sources.',
                '3. If a web search result looks promising, use web_reader to get the full content.',
                '4. Compile all gathered information into a clear, structured context block.',
                '',
                'Format your final output as structured context blocks with source citations.',
                `This is research step ${currentStep} of maximum ${state.maxResearchSteps}.`,
            ].join('\n'),
        };

        const userMessage = {
            role: 'user' as const,
            content: `Research the following query and gather relevant information:\n\nQuery: ${state.query}\n\n${state.retrievedContext ? `Previously gathered context:\n${state.retrievedContext}` : 'No prior context gathered yet.'}`,
        };

        // Call LLM with tools bound
        const response = await llmWithTools.invoke([systemMessage, userMessage]);

        // If LLM wants to use tools, execute them
        let contextParts: string[] = state.retrievedContext ? [state.retrievedContext] : [];
        let sourcesAcc: Array<Record<string, unknown>> = [...state.sources];

        if (response.tool_calls && response.tool_calls.length > 0) {
            for (const toolCall of response.tool_calls) {
                const matchedTool = tools.find((t) => t.name === toolCall.name);
                if (!matchedTool) continue;

                try {
                    const toolResult = await matchedTool.invoke(toolCall.args);
                    const parsed = JSON.parse(typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult));

                    if (parsed.results && Array.isArray(parsed.results)) {
                        for (const r of parsed.results) {
                            if (r.text || r.snippet || r.content) {
                                const chunkId = r.chunkId || `web-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
                                const text = r.text || r.snippet || r.content || '';
                                const header = [
                                    `[${chunkId}]`,
                                    r.title ? `title="${r.title}"` : '',
                                    r.url ? `url=${r.url}` : '',
                                ].filter(Boolean).join(' | ');

                                contextParts.push(`${header}\n${text}`);
                                sourcesAcc.push({
                                    chunkId,
                                    url: r.url ?? '',
                                    title: r.title ?? '',
                                    publishedAt: r.publishedAt ?? '',
                                    score: r.score ?? 0,
                                    credibilityWeight: r.credibilityWeight ?? 0.5,
                                });
                            }
                        }
                    }
                } catch {
                    // Tool execution failed — continue with other tools
                }
            }
        } else if (typeof response.content === 'string' && response.content.trim()) {
            // LLM returned text directly (no tool calls) — treat as additional context
            contextParts.push(response.content);
        }

        const newContext = contextParts.join('\n\n');

        return {
            messages: [new AIMessage({ content: `[Researcher step ${currentStep}] Gathered ${sourcesAcc.length} sources.` })],
            researchSteps: currentStep,
            retrievedContext: newContext,
            sources: sourcesAcc,
        };
    };
}
