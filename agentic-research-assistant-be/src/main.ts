import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from '@/app.module.js';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const allowedOrigins = [
        'http://localhost:3000',
        'http://192.168.1.4:3000',
    ];

    app.enableCors({
            // Allow FE 
        origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true                   // Allow cookies
    });

    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    // MODIFIED: Allow FE to call BE in dev
    app.enableCors({ origin: true, credentials: true });
    await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
