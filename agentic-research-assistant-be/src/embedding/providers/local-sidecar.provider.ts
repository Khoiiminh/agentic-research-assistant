import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import type { EmbeddingProvider } from './embedding-provider.js';

export class LocalSidecarProvider implements EmbeddingProvider {
    readonly name = 'local-sidecar';

    constructor(private readonly config: ConfigService) {}

    async embed(texts: string[]): Promise<number[][]> {
        const baseUrl = this.config.getOrThrow<string>('EMBED_LOCAL_URL');
        const res = await axios.post(`${baseUrl}/embed`, { texts }, { timeout: 120_000 });
        return res.data.vectors as number[][];
    }
}

