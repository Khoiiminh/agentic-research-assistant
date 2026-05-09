import { Injectable } from '@nestjs/common';
import { OpenAI } from 'openai'; // or your preferred LLM SDK

@Injectable()
export class SummarizerService {
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  async updateSummary(oldSummary: string, userQuery: string, agentAnswer: string): Promise<string> {
    const prompt = `
      PROGRESSIVE SUMMARY:
      Existing Summary: "${oldSummary || 'No previous history.'}"
      New Exchange:
      User: "${userQuery}"
      Agent: "${agentAnswer}"

      Task: Update the summary to include the key points of the new exchange while keeping it concise. 
      Maintain the core research goals and findings. Output only the new summary.
    `;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini', // Efficient for summarization
      messages: [{ role: 'system', content: prompt }],
    });

    return response.choices[0].message.content || oldSummary;
  }
}