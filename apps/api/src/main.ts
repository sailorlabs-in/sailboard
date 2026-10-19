import './load-env';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3333;
  await app.listen(port);
  logger.log(`Nest.js API server is listening on: http://localhost:${port}/api`);
  logger.log(`WebSocket Gateway connected on: http://localhost:${port}/whiteboard`);
}

bootstrap();
