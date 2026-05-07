import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class ResearchRequestDto {
    @IsString()
    query: string;

    @IsInt()
    @IsOptional()
    @Min(1)
    topK?: number;

    @IsString()
    @IsOptional()
    category?: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(1)
    minCredibility?: number;

    @IsBoolean()
    @IsOptional()
    applyCredibilityBoost?: boolean;

    @IsString()
    @IsOptional()
    matchText?: string;

    @IsBoolean()
    @IsOptional()
    includeContext?: boolean;
}

export type ResearchSource = {
    chunkId: string;
    url?: string;
    title?: string;
    publishedAt?: string;
    score?: number;
    credibilityWeight?: number;
};

export type ResearchResponse = {
    answer: string;
    sources: ResearchSource[];
    retrievedCount: number;
    llmUsed: boolean;
    isExtractiveFallback: boolean;
    context?: string;
    snippets?: Array<{ chunkId: string; text: string }>;
};

