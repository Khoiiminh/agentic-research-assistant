import { IsBoolean, IsInt, IsNumber, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';

export class SearchVectorsDto {
    vector: number[];

    @IsInt()
    @Min(1)
    topK: number;

    @IsNumber()
    @IsOptional()
    scoreThreshold?: number;

    @IsObject()
    @IsOptional()
    filter?: Record<string, unknown>;

    @IsString()
    @IsOptional()
    category?: string;

    @IsString()
    @IsOptional()
    source?: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(1)
    minCredibility?: number;

    @IsString()
    @IsOptional()
    matchText?: string;

    @IsBoolean()
    @IsOptional()
    applyCredibilityBoost?: boolean;
}
