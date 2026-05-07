import { StateGraph, END } from '@langchain/langgraph';
import { AgentState, type AgentStateType } from './agent.state.js';
import { createSupervisorNode } from './supervisor.agent.js';
import { createResearcherNode } from './researcher.agent.js';
import { createWriterNode } from './writer.agent.js';
import { createQdrantSearchTool } from './tools/qdrant-search.tool.js';
import { createWebSearchTool } from './tools/web-search.tool.js';
import { createWebReaderTool } from './tools/web-reader.tool.js';
import type { EmbeddingService } from '@/embedding/embedding.service.js';
import type { VectorsService } from '@/vectors/vectors.service.js';
import { Logger } from '@nestjs/common';

const logger = new Logger('AgentWorkflow');

export interface WorkflowConfig {
    llmBaseUrl: string;
    llmModel: string;
    llmApiKey: string;
    tavilyApiKey: string;
    maxResearchSteps: number;
    embeddingService: EmbeddingService;
    vectorsService: VectorsService;
}

/**
 * Builds and compiles the A2A LangGraph workflow:
 *
 *   ┌──────────┐
 *   │supervisor│ ──────────────────────────────┐
 *   └────┬─────┘                               │
 *        │ nextAgent="researcher"               │ nextAgent="writer"
 *        ▼                                      ▼
 *   ┌──────────┐                          ┌─────────┐
 *   │researcher│ ──→ supervisor           │  writer  │ ──→ supervisor
 *   └──────────┘                          └─────────┘
 *
 *   Supervisor routes to __end__ when finalAnswer exists.
 */
export function buildResearchGraph(config: WorkflowConfig) {
    // Create tools
    const qdrantTool = createQdrantSearchTool(config.embeddingService, config.vectorsService);
    const webSearchTool = createWebSearchTool(config.tavilyApiKey);
    const webReaderTool = createWebReaderTool();

    const tools = [qdrantTool, webSearchTool, webReaderTool];

    // Create agent nodes
    const supervisorNode = createSupervisorNode(config.llmBaseUrl, config.llmModel, config.llmApiKey);
    const researcherNode = createResearcherNode(config.llmBaseUrl, config.llmModel, config.llmApiKey, tools);
    const writerNode = createWriterNode(config.llmBaseUrl, config.llmModel, config.llmApiKey);

    // Build the StateGraph
    const graph = new StateGraph(AgentState)
        .addNode('supervisor', supervisorNode)
        .addNode('researcher', researcherNode)
        .addNode('writer', writerNode)
        // Entry: always start at supervisor
        .addEdge('__start__', 'supervisor')
        // After researcher/writer, go back to supervisor for evaluation
        .addEdge('researcher', 'supervisor')
        .addEdge('writer', 'supervisor')
        // Supervisor routes conditionally
        .addConditionalEdges('supervisor', (state: AgentStateType) => {
            const next = state.nextAgent;
            if (next === '__end__') return END;
            if (next === 'researcher') return 'researcher';
            if (next === 'writer') return 'writer';
            // Fallback
            return END;
        });

    return graph.compile();
}

/**
 * Execute the research graph and return the final result.
 * Wraps the graph invocation with recursionLimit safety and error handling.
 */
export async function runResearchGraph(
    config: WorkflowConfig,
    query: string,
): Promise<{
    answer: string;
    sources: Array<Record<string, unknown>>;
    llmUsed: boolean;
    isExtractiveFallback: boolean;
    researchSteps: number;
}> {
    const startTime = Date.now();

    try {
        const app = buildResearchGraph(config);

        const result = await app.invoke(
            {
                query,
                researchSteps: 0,
                maxResearchSteps: config.maxResearchSteps,
                retrievedContext: '',
                sources: [],
                finalAnswer: '',
                nextAgent: 'researcher',
            },
            {
                recursionLimit: 15, // Hard framework-level safety net
            },
        );

        const elapsedMs = Date.now() - startTime;
        logger.log(`Graph completed in ${elapsedMs}ms | Steps: ${result.researchSteps} | Sources: ${result.sources?.length ?? 0}`);

        const answer = result.finalAnswer?.trim() || 'No answer was generated.';

        return {
            answer,
            sources: result.sources ?? [],
            llmUsed: true,
            isExtractiveFallback: false,
            researchSteps: result.researchSteps ?? 0,
        };
    } catch (err) {
        const elapsedMs = Date.now() - startTime;
        const msg = err instanceof Error ? err.message : String(err);
        logger.error(`Graph failed after ${elapsedMs}ms: ${msg}`);

        // Fallback: return safe error response
        return {
            answer: 'The AI research pipeline encountered an error. Please try again or simplify your query.',
            sources: [],
            llmUsed: false,
            isExtractiveFallback: true,
            researchSteps: 0,
        };
    }
}
