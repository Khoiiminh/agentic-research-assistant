import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '@/auth/auth.module.js';
import { UserModule } from '@/user/user.module.js';
import { VectorsModule } from '@/vectors/vectors.module.js';
import { EmbeddingModule } from '@/embedding/embedding.module.js';
import { ResearchModule } from '@/research/research.module.js';

@Module({
    imports: [
        ConfigModule.forRoot({
            // MODIFIED: Use repo-root env file shared with frontend
            envFilePath: '../.env.development',
            isGlobal: true,
        }),
        // MODIFIED: Rate-limit only routes that opt-in via @Throttle + ThrottlerGuard
        ThrottlerModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                throttlers: [
                    {
                        name: 'research',
                        ttl: Number(config.get<string>('RESEARCH_RATE_TTL_SECONDS') ?? '60'),
                        limit: Number(config.get<string>('RESEARCH_RATE_LIMIT') ?? '5'),
                    },
                ],
            }),
        }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                type: 'postgres',
                host: config.getOrThrow<string>('DB_HOST'),
                port: config.getOrThrow<number>('DB_PORT'),
                username: config.getOrThrow<string>('DB_USER'),
                password: config.getOrThrow<string>('DB_PASWORD'),
                database: config.getOrThrow<string>('DB_DATABASE'),
                ssl: { rejectUnauthorized: false },
                extra: { prepareThreshold: 0 },
                autoLoadEntities: true,
                synchronize: true,
            }),
        }),
        AuthModule,
        UserModule,
        VectorsModule,
        EmbeddingModule,
        ResearchModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
