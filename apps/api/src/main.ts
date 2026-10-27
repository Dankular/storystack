import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global prefix for API routes
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  app.getHttpAdapter().get('/', (_req, res) => res.redirect('/api'));
  app.getHttpAdapter().get('/healthz', (_req, res) => res.json({status: 'ok'}));
  await app.listen(port, '0.0.0.0');

  console.log(`StoryStack API running on http://localhost:${port}`);
}

bootstrap();
