import { IsArray, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class VectorPayloadDto {
    @IsString()
    @IsNotEmpty()
    source: string;

    @IsString()
    @IsNotEmpty()
    url: string;

    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    publishedAt?: string;

    @IsString()
    @IsOptional()
    chunkId?: string;

    @IsString()
    @IsOptional()
    text?: string;

    @IsString()
    @IsOptional()
    hash_content?: string;

    @IsString()
    @IsOptional()
    category?: string;

    @IsString()
    @IsOptional()
    domain?: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(1)
    credibilityWeight?: number;

    @IsString()
    @IsOptional()
    expiredAt?: string;

    @IsObject()
    @IsOptional()
    meta?: Record<string, unknown>;
}

export class VectorPointDto {
    @IsString()
    @IsNotEmpty()
    id: string;

    @IsArray()
    vector: number[];

    @ValidateNested()
    @Type(() => VectorPayloadDto)
    payload: VectorPayloadDto;
}

export class UpsertVectorsDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => VectorPointDto)
    points: VectorPointDto[];
}
