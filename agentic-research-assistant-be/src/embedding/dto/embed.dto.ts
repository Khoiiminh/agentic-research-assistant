import { IsArray, IsString, MinLength } from 'class-validator';

export class EmbedDto {
    @IsArray()
    @IsString({ each: true })
    @MinLength(1, { each: true })
    texts: string[];
}

