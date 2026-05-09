import { Module } from '@nestjs/common';
import { VllmProvider } from './vllm.provider.js';
import { VllmService } from './vllm.service.js';

@Module({
  providers: [VllmProvider, VllmService],
  exports: [VllmService], // Export the service so ChatService can use it
})
export class VllmModule {}