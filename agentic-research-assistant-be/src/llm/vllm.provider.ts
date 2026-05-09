import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export const VLLM_CLIENT = 'VLLM_CLIENT';

export const VllmProvider: Provider = {
  provide: VLLM_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    return new OpenAI({
      baseURL: configService.get<string>('VLLM_URL') || 'http://localhost:8000/v1',
      apiKey: 'vllm-no-key-required',
    });
  },
};