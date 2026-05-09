import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';
import { VLLM_CLIENT } from './vllm.provider.js';

@Injectable()
export class VllmService {
  // We inject the client we set up in the provider
  constructor(@Inject(VLLM_CLIENT) private readonly vllm: OpenAI) {}

  async summarize(oldSummary: string, query: string, answer: string): Promise<string> {
    const prompt = `[INST] Update the research summary.
Existing Summary: ${oldSummary || 'None'}
User: ${query}
Agent: ${answer}
Return only the updated summary. [/INST]`;

    try {
      const response = await this.vllm.chat.completions.create({
        model: "mistralai/Mistral-7B-Instruct-v0.2", 
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      });

      return response?.choices[0]?.message?.content?.trim() ?? '';
    } catch (error) {
      throw new InternalServerErrorException('vLLM summary update failed');
    }
  }
}