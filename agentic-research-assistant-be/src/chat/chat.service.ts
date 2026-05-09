import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { History } from '../history/history.entity';
import { VllmService } from '../llm/vllm.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(History) private historyRepo: Repository<History>,
    private vllmService: VllmService,
  ) {}

  async processAgenticChat(userId: string, userQuery: string) {
    // 1. Retrieve Current State (B)
    let history = await this.historyRepo.findOne({ 
      where: { user_id: userId },
      order: { created_at: 'DESC' } 
    });

    const previousSummary = history?.chat_summary || "";

    // 2. RAG Execution (A + B)
    // Here, you'd pass userQuery + previousSummary to your RAG logic.
    // For this example, let's assume the agent returned:
    const agentAnswer = "Based on your interest in PostgreSQL, I've found that...";

    // 3. Update Memory (A + B + C -> New B)
    const updatedSummary = await this.vllmService.summarize(
      previousSummary, 
      userQuery, 
      agentAnswer
    );

    // 4. Persistence
    if (history) {
      history.chat_summary = updatedSummary;
      await this.historyRepo.save(history);
    } else {
      await this.historyRepo.save({
        user_id: userId,
        chat_summary: updatedSummary
      });
    }

    return { answer: agentAnswer };
  }
}