import { Annotation, messagesStateReducer } from '@langchain/langgraph';
import type { BaseMessage } from '@langchain/core/messages';

/**
 * Shared state for the A2A research graph.
 *
 * - `messages`: LangGraph message history (auto-reduced).
 * - `query`: The original user question.
 * - `researchSteps`: Counter tracking how many times Researcher has been invoked.
 * - `maxResearchSteps`: Hard cap — forces routing to Writer when reached.
 * - `retrievedContext`: Raw context blocks gathered by Researcher.
 * - `sources`: Metadata about retrieved sources (chunkId, url, title, etc.).
 * - `finalAnswer`: Completed answer written by Writer.
 * - `nextAgent`: Routing hint set by Supervisor ("researcher" | "writer" | "__end__").
 */
export const AgentState = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: messagesStateReducer,
        default: () => [],
    }),

    query: Annotation<string>({
        reducer: (_prev, next) => next,
        default: () => '',
    }),

    researchSteps: Annotation<number>({
        reducer: (_prev, next) => next,
        default: () => 0,
    }),

    maxResearchSteps: Annotation<number>({
        reducer: (_prev, next) => next,
        default: () => 3,
    }),

    retrievedContext: Annotation<string>({
        reducer: (_prev, next) => next,
        default: () => '',
    }),

    sources: Annotation<Array<Record<string, unknown>>>({
        reducer: (_prev, next) => next,
        default: () => [],
    }),

    finalAnswer: Annotation<string>({
        reducer: (_prev, next) => next,
        default: () => '',
    }),

    nextAgent: Annotation<string>({
        reducer: (_prev, next) => next,
        default: () => 'researcher',
    }),
});

export type AgentStateType = typeof AgentState.State;
