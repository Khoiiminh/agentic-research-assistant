import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@/auth/auth.module.js';
import { UserModule } from '@/user/user.module.js';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: '../.env.development',
            isGlobal: true,
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
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
