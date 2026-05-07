import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ResearchService } from './research.service.js';
import { ResearchRequestDto } from './dto/research.dto.js';

@ApiTags('Research')
@Controller('research')
@UseGuards(ThrottlerGuard)
export class ResearchController {
    constructor(private readonly researchService: ResearchService) {}

    @Post()
    @Throttle({ research: {} })
    async research(@Body() dto: ResearchRequestDto) {
        return await this.researchService.research(dto);
    }
}

