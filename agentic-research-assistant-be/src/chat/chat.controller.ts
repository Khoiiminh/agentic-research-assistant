import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service.js';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('query')
  async handleQuery(
    @Body() body: { query: string },
    @Req() req: any // Assuming your AuthGuard attaches user to req
  ) {
    // Replace req.user.id with a static UUID if you haven't implemented Auth yet
    const userId = req.user?.id || 'static-test-uuid-123';
    
    return await this.chatService.processAgenticChat(userId, body.query);
  }
}