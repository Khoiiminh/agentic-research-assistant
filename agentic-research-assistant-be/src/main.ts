import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '@/app.module.js';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // MODIFIED: Global API prefix; Swagger UI at /api/docs when SWAGGER_ENABLED=true
    app.setGlobalPrefix('api');

    const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:8080',
        'http://127.0.0.1:8080',
        'http://192.168.1.4:3000',
    ];

    // MODIFIED: Single CORS config (do not throw; just disallow)
    app.enableCors({
        origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
            if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
            return callback(null, false);
        },
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    });

    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    // MODIFIED: OpenAPI docs when explicitly enabled
    if (process.env.SWAGGER_ENABLED === 'true') {
        const swaggerConfig = new DocumentBuilder()
            .setTitle('Agentic Research Assistant API')
            .setDescription('HTTP API for the research assistant backend')
            .setVersion('1.0')
            .addBearerAuth(
                { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
                'access-token',
            )
            .build();
        const document = SwaggerModule.createDocument(app, swaggerConfig);
        // MODIFIED: Swagger should respect global prefix (/api/docs)
        SwaggerModule.setup('docs', app, document, { useGlobalPrefix: true });
    }

    await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
