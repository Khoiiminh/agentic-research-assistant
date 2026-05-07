import { AIMessage } from '@langchain/core/messages';
import type { AgentStateType } from './agent.state.js';
import { ChatOpenAI } from '@langchain/openai';

/**
 * Supervisor Agent Node
 *
 * Central coordinator of the A2A graph. Decides which worker to invoke next:
 * - "researcher": if more information is needed
 * - "writer": if enough context has been gathered to write the answer
 * - "__end__": if the final answer is already complete
 *
 * Safety: forces routing to Writer when researchSteps >= maxResearchSteps.
 */
export function createSupervisorNode(
    llmBaseUrl: string,
    llmModel: string,
    llmApiKey: string,
) {
    const llm = new ChatOpenAI({
        configuration: { baseURL: `${llmBaseUrl.replace(/\/+$/, '')}/v1` },
        modelName: llmModel,
        openAIApiKey: llmApiKey || 'not-needed',
        temperature: 0,
        maxTokens: 256,
    });

    return async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
        // Hard safety: if final answer already exists, end the graph
        if (state.finalAnswer && state.finalAnswer.trim() !== '') {
            return {
                messages: [new AIMessage({ content: '[Supervisor] Final answer is ready. Ending graph.' })],
                nextAgent: '__end__',
            };
        }

        // Hard safety: force Writer if research steps exhausted
        if (state.researchSteps >= state.maxResearchSteps) {
            return {
                messages: [new AIMessage({ content: `[Supervisor] Research step limit (${state.maxResearchSteps}) reached. Routing to Writer.` })],
                nextAgent: 'writer',
            };
        }

        // If no context gathered yet, go to Researcher
        if (!state.retrievedContext || state.retrievedContext.trim() === '') {
            return {
                messages: [new AIMessage({ content: '[Supervisor] No context yet. Routing to Researcher.' })],
                nextAgent: 'researcher',
            };
        }

        // Use LLM to decide if more research is needed or we can write
        const systemMessage = {
            role: 'system' as const,
            content: [
                'You are a Supervisor Agent coordinating a research team.',
                'You must decide the next action based on the current state.',
                '',
                'You MUST respond with ONLY one of these exact words:',
                '- "researcher" — if the gathered context is insufficient and more research is needed',
                '- "writer" — if enough context has been gathered to write a comprehensive answer',
                '',
                'Decision criteria:',
                '- If the context already covers the key aspects of the query → "writer"',
                '- If the context is too thin, missing key details, or covers only one perspective → "researcher"',
                '- When in doubt, prefer "writer" to avoid excessive research loops',
                '',
                `Current research steps: ${state.researchSteps}/${state.maxResearchSteps}`,
                `Number of sources: ${state.sources.length}`,
            ].join('\n'),
        };

        const userMessage = {
            role: 'user' as const,
            content: `Query: ${state.query}\n\nGathered context (${state.retrievedContext.length} chars, ${state.sources.length} sources):\n${state.retrievedContext.slice(0, 2000)}${state.retrievedContext.length > 2000 ? '\n... [truncated for decision]' : ''}`,
        };

        try {
            const response = await llm.invoke([systemMessage, userMessage]);
            const decision = (typeof response.content === 'string' ? response.content : '')
                .trim()
                .toLowerCase()
                .replace(/[^a-z]/g, '');

            const next = decision.includes('researcher') ? 'researcher' : 'writer';

            return {
                messages: [new AIMessage({ content: `[Supervisor] Decision: route to ${next}.` })],
                nextAgent: next,
            };
        } catch {
            // LLM failed — safe fallback: if we have any context, write; otherwise research
            const fallback = state.sources.length > 0 ? 'writer' : 'researcher';
            return {
                messages: [new AIMessage({ content: `[Supervisor] LLM decision failed. Fallback: ${fallback}.` })],
                nextAgent: fallback,
            };
        }
    };
}
