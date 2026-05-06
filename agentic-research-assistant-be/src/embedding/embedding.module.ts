import { Module } from '@nestjs/common';
import { EmbeddingService } from './embedding.service.js';
import { EmbeddingController } from './embedding.controller.js';

@Module({
    controllers: [EmbeddingController],
    providers: [EmbeddingService],
    exports: [EmbeddingService],
})
export class EmbeddingModule {}

