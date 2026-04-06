import { LoggerService } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { LOGGER_PROVIDER } from '@module-logger';
import { WorkerModule } from './worker.module';

async function bootstrapWorker() {
  console.log('Starting reports worker...');
  const app = await NestFactory.createApplicationContext(WorkerModule);
  app.useLogger(app.get<LoggerService>(LOGGER_PROVIDER));

  process.on('SIGINT', async () => {
    console.log('Received SIGINT. Shutting down worker...');
    await app.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM. Shutting down worker...');
    await app.close();
    process.exit(0);
  });

  console.log('Reports worker started successfully');
}

bootstrapWorker().catch((error) => {
  console.error('Failed to bootstrap reports worker:', error);
  process.exit(1);
});
