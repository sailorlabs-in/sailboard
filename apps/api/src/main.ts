import './load-env';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { AppConfigService } from './config/config.service';
import { HttpExceptionFilter, LoggingInterceptor } from './common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const config = app.get(AppConfigService);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.setGlobalPrefix('api');

  // Architecture Refinement: Global Validation & Error Filtering
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
    })
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.enableShutdownHooks();

  const port = config.port;
  await app.listen(port);
  logger.log(`Nest.js API server is listening on: http://localhost:${port}/api`);
  logger.log(`WebSocket Gateway connected on: http://localhost:${port}/whiteboard`);
  logger.log(`Environment mode: ${config.nodeEnv}`);
}

bootstrap();
