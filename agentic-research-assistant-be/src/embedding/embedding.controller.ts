import { Body, Controller, Post } from '@nestjs/common';
import { EmbeddingService } from './embedding.service.js';
import { EmbedDto } from './dto/embed.dto.js';

@Controller('/api/embeddings')
export class EmbeddingController {
    constructor(private readonly embedding: EmbeddingService) {}

    @Post()
    async embed(@Body() body: EmbedDto) {
        const vectors = await this.embedding.embed(body.texts);
        const dim = vectors[0]?.length ?? 0;
        return { vectors, dim, provider: this.embedding.getProviderName() };
    }
}

