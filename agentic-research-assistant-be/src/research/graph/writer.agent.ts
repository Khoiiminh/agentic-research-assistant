import { AIMessage } from '@langchain/core/messages';
import type { AgentStateType } from './agent.state.js';
import { ChatOpenAI } from '@langchain/openai';

/**
 * Writer Agent Node
 *
 * Synthesizes a final answer from the gathered context.
 * Enforces strict citation format [chunkId] and refuses to invent information.
 */
export function createWriterNode(
    llmBaseUrl: string,
    llmModel: string,
    llmApiKey: string,
) {
    const llm = new ChatOpenAI({
        configuration: { baseURL: `${llmBaseUrl.replace(/\/+$/, '')}/v1` },
        modelName: llmModel,
        openAIApiKey: llmApiKey || 'not-needed',
        temperature: 0.2,
        maxTokens: 1024,
    });

    return async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
        if (!state.retrievedContext || state.retrievedContext.trim() === '') {
            return {
                messages: [new AIMessage({ content: '[Writer] No context available to generate an answer.' })],
                finalAnswer: 'Insufficient information. No relevant context was retrieved to answer this query.',
            };
        }

        const systemMessage = {
            role: 'system' as const,
            content: [
                'You are a Writer Agent. Your task is to synthesize a clear, well-structured answer based ONLY on the provided context.',
                '',
                'Rules:',
                '1. You MUST answer ONLY using information from the provided context blocks.',
                '2. You MUST cite sources using the exact chunk ID format: [chunkId].',
                '3. Every factual claim MUST have at least one citation.',
                '4. If the context is insufficient to fully answer the query, clearly state what is missing.',
                '5. Do NOT invent citations or information not present in the context.',
                '6. Write in a professional, concise style appropriate for a research assistant.',
                '7. Structure your answer with clear paragraphs and logical flow.',
            ].join('\n'),
        };

        const userMessage = {
            role: 'user' as const,
            content: `Query: ${state.query}\n\nContext:\n${state.retrievedContext}\n\nWrite a comprehensive answer with proper citations [chunkId]:`,
        };

        const response = await llm.invoke([systemMessage, userMessage]);
        const answerText = typeof response.content === 'string' ? response.content : '';

        return {
            messages: [new AIMessage({ content: '[Writer] Final answer generated.' })],
            finalAnswer: answerText.trim(),
        };
    };
}
