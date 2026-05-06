import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from '@/app.module.js';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    // MODIFIED: Allow FE to call BE in dev
    app.enableCors({ origin: true, credentials: true });
    await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
