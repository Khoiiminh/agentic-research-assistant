import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import type { EmbeddingProvider } from './embedding-provider.js';

export class RemoteHttpProvider implements EmbeddingProvider {
    readonly name = 'remote-http';

    constructor(private readonly config: ConfigService) {}

    async embed(texts: string[]): Promise<number[][]> {
        const url = this.config.getOrThrow<string>('EMBED_REMOTE_URL');
        const apiKey = this.config.get<string>('EMBED_REMOTE_API_KEY');
        const model = this.config.get<string>('EMBEDDING_MODEL') ?? 'bge-m3';

        // OpenAI-compatible request; vLLM supports this surface.
        const res = await axios.post(
            url,
            { model, input: texts },
            {
                timeout: 120_000,
                headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
            },
        );

        // Expected: { data: [{ embedding: number[] }, ...] }
        const data = res.data?.data as Array<{ embedding: number[] }> | undefined;
        if (!data?.length) return [];
        return data.map((d) => d.embedding);
    }
}

