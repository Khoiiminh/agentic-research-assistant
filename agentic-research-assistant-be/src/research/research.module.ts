import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ResearchController } from './research.controller.js';
import { ResearchService } from './research.service.js';
import { EmbeddingModule } from '@/embedding/embedding.module.js';
import { VectorsModule } from '@/vectors/vectors.module.js';

@Module({
    imports: [ConfigModule, EmbeddingModule, VectorsModule],
    controllers: [ResearchController],
    providers: [ResearchService],
})
export class ResearchModule {}
