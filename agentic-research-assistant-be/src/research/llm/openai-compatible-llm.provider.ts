import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export class OpenAiCompatibleLlmProvider {
    private readonly logger = new Logger(OpenAiCompatibleLlmProvider.name);

    constructor(private readonly config: ConfigService) {}

    async chat(args: { messages: ChatMessage[] }) {
        const baseUrl = (this.config.get<string>('LLM_API_BASE_URL') ?? '').trim();
        const model = (this.config.get<string>('LLM_MODEL') ?? '').trim();
        if (!baseUrl || !model) {
            throw new Error('LLM not configured: set LLM_API_BASE_URL and LLM_MODEL');
        }

        const apiKey = (this.config.get<string>('LLM_API_KEY') ?? '').trim();
        const temperature = Number(this.config.get<string>('LLM_TEMPERATURE') ?? '0.2');
        const maxTokens = Number(this.config.get<string>('LLM_MAX_TOKENS') ?? '512');
        const timeoutMs = Number(this.config.get<string>('LLM_TIMEOUT_MS') ?? '60000');

        const url = `${baseUrl.replace(/\/+$/, '')}/v1/chat/completions`;

        const startTime = Date.now();
        this.logger.log(`LLM request → model=${model} | messages=${args.messages.length} | maxTokens=${maxTokens}`);

        const res = await axios.post(
            url,
            {
                model,
                messages: args.messages,
                temperature,
                max_tokens: maxTokens,
            },
            {
                timeout: timeoutMs,
                headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
            },
        );

        const latencyMs = Date.now() - startTime;
        const usage = res.data?.usage;
        const promptTokens = usage?.prompt_tokens ?? 'N/A';
        const completionTokens = usage?.completion_tokens ?? 'N/A';
        const totalTokens = usage?.total_tokens ?? 'N/A';

        this.logger.log(
            `LLM response ← ${latencyMs}ms | tokens: prompt=${promptTokens} completion=${completionTokens} total=${totalTokens}`,
        );

        const content = res.data?.choices?.[0]?.message?.content;
        if (typeof content !== 'string' || !content.trim()) {
            throw new Error('LLM response missing choices[0].message.content');
        }
        return { content, latencyMs, usage };
    }
}
