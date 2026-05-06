import { Body, Controller, Post } from '@nestjs/common';
import { VectorsService } from './vectors.service.js';
import { UpsertVectorsDto } from './dto/upsert.dto.js';
import { SearchVectorsDto } from './dto/search.dto.js';

@Controller('/api/vectors')
export class VectorsController {
    constructor(private readonly vectors: VectorsService) {}

    @Post('/upsert')
    async upsert(@Body() body: UpsertVectorsDto) {
        const points = body.points.map((p) => ({
            id: p.id,
            vector: p.vector,
            payload: p.payload as unknown as Record<string, unknown>,
        }));

        return await this.vectors.upsert(points);
    }

    @Post('/search')
    async search(@Body() body: SearchVectorsDto) {
        return await this.vectors.search({
            vector: body.vector,
            topK: body.topK,
            scoreThreshold: body.scoreThreshold,
            filter: body.filter,
            category: body.category,
            source: body.source,
            minCredibility: body.minCredibility,
            matchText: body.matchText,
            applyCredibilityBoost: body.applyCredibilityBoost,
        });
    }
}
