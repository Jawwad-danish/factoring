import { Logger, OnApplicationShutdown } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { LocalQueueMessage } from '..';
import { MessageConsumer, MessageHandler } from './message-consumer';
import { runPeriodically } from '@core/date-time';

export class LocalMessageConsumer
  implements MessageConsumer, OnApplicationShutdown
{
  private readonly logger = new Logger(LocalMessageConsumer.name);
  private intervalId: NodeJS.Timeout | null = null;
  private isProcessing = false;
  private isShuttingDown = false;
  private queueFilePath: string;
  private dlqFilePath: string;
  private maxReceiveCount = 5;

  constructor(
    private readonly queueDir: string,
    private readonly pollIntervalSeconds = 5,
  ) {
    if (!this.queueDir) {
      throw new Error('LOCAL_QUEUE_PATH config value is required');
    }
    this.ensureDirectoryExists(this.queueDir);
  }

  async start(handleMessage: MessageHandler): Promise<void> {
    this.queueFilePath = path.join(this.queueDir, `jobs.queue.json`);
    this.dlqFilePath = path.join(this.queueDir, `jobs.dlq.json`);
    this.logger.log(`Initialized for local file queue: ${this.queueFilePath}`);

    if (this.intervalId) {
      this.logger.warn(`Local consumer for jobs already started.`);
      return;
    }

    this.logger.log(
      `Starting local file consumer for jobs (polling every ${this.pollIntervalSeconds}s)`,
    );
    await this.ensureFileExists(this.queueFilePath);
    await this.ensureFileExists(this.dlqFilePath);

    this.intervalId = runPeriodically(
      this.poll.bind(this, handleMessage),
      this.pollIntervalSeconds,
    );
  }

  async poll(handleMessage: MessageHandler): Promise<void> {
    if (this.isProcessing || this.isShuttingDown) {
      return;
    }

    this.isProcessing = true;
    try {
      await this.processNextMessage(handleMessage);
    } catch (error) {
      this.logger.error(
        `Error during local queue polling loop: ${error.message}`,
        error.stack,
      );
    } finally {
      this.isProcessing = false;
    }
  }

  stop(): void {
    if (!this.intervalId || this.isShuttingDown) return;

    this.isShuttingDown = true;
    this.logger.log(`Stopping local file consumer for jobs...`);
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.logger.log(`Local file consumer for jobs stopped.`);
  }

  onApplicationShutdown() {
    this.stop();
  }

  private async processNextMessage(
    handleMessage: MessageHandler,
  ): Promise<void> {
    const messageRecord = await this.readNextMessage();
    if (!messageRecord) return;

    this.logger.log(
      `Processing local message ${messageRecord.MessageId} (Attempt ${messageRecord.Attributes?.ApproximateReceiveCount})`,
    );

    if (!messageRecord.Attributes) {
      messageRecord.Attributes = {};
    }
    messageRecord.Attributes.ApproximateReceiveCount = String(
      messageRecord.Attributes.ApproximateReceiveCount,
    );

    try {
      await handleMessage(messageRecord);
      await this.removeMessage(messageRecord.MessageId!);
      this.logger.log(
        `Successfully processed local message ${messageRecord.MessageId}. Removed from queue.`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing local message ${messageRecord.MessageId}: ${error.message}`,
        error.stack,
      );

      if (
        Number(messageRecord.Attributes.ApproximateReceiveCount) >=
        this.maxReceiveCount
      ) {
        this.logger.warn(
          `Message ${messageRecord.MessageId} exceeded max receive count (${this.maxReceiveCount}). Moving to DLQ.`,
        );
        await this.moveToDLQ(messageRecord);
      } else {
        this.logger.log(
          `Message ${messageRecord.MessageId} failed processing. It will be retried on next poll.`,
        );
      }
    }
  }

  private async ensureFileExists(filePath: string): Promise<void> {
    try {
      await fs.access(filePath);
    } catch {
      await fs.writeFile(filePath, '[]', 'utf-8');
      this.logger.log(`Created empty file: ${filePath}`);
    }
  }

  private async readQueueFile(filePath: string): Promise<LocalQueueMessage[]> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      if (!content || content.trim() === '') return [];
      return JSON.parse(content) as LocalQueueMessage[];
    } catch (error) {
      if (error.code === 'ENOENT') {
        await this.ensureFileExists(filePath);
        return [];
      }
      this.logger.error(
        `Failed to read or parse queue file ${filePath}: ${error.message}`,
      );
      return [];
    }
  }

  private async writeQueueFile(
    filePath: string,
    records: LocalQueueMessage[],
  ): Promise<void> {
    try {
      await fs.writeFile(filePath, JSON.stringify(records, null, 2), 'utf-8');
    } catch (error) {
      this.logger.error(
        `Failed to write queue file ${filePath}: ${error.message}`,
      );
      throw error;
    }
  }

  private async readNextMessage(): Promise<LocalQueueMessage | null> {
    const queue = await this.readQueueFile(this.queueFilePath);
    if (queue.length === 0) return null;

    const nextRecord = queue[0];
    nextRecord.Attributes = nextRecord.Attributes || {};
    await this.writeQueueFile(this.queueFilePath, queue);
    return nextRecord;
  }

  private async removeMessage(messageId: string): Promise<void> {
    const queue = await this.readQueueFile(this.queueFilePath);
    const updatedQueue = queue.filter((r) => r.MessageId !== messageId);

    if (queue.length !== updatedQueue.length) {
      await this.writeQueueFile(this.queueFilePath, updatedQueue);
    } else {
      this.logger.warn(
        `Attempted to remove message ${messageId} but it was not found in the queue.`,
      );
    }
  }

  private async moveToDLQ(record: LocalQueueMessage): Promise<void> {
    await this.removeMessage(record.MessageId!);

    const dlq = await this.readQueueFile(this.dlqFilePath);
    if (!dlq.some((r) => r.MessageId === record.MessageId)) {
      dlq.push(record);
      await this.writeQueueFile(this.dlqFilePath, dlq);
    } else {
      this.logger.warn(
        `Message ${record.MessageId} already found in DLQ. Skipping add.`,
      );
    }
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
      this.logger.log(`Created directory: ${dirPath}`);
    } catch (err) {
      this.logger.error(
        `Failed to create local queue directory: ${err.message}`,
      );
      throw err;
    }
  }
}
