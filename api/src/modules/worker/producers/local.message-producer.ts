import { CONFIG_SERVICE, ConfigService } from '@module-config';
import { Inject, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { LocalQueueMessage, MessagePayload } from '../data';
import { MessageProducer } from './message-producer';

export class LocalMessageProducer implements MessageProducer {
  private readonly logger = new Logger(LocalMessageProducer.name);
  private readonly queueDir: string;

  constructor(
    @Inject(CONFIG_SERVICE) private readonly configService: ConfigService,
  ) {
    this.queueDir = this.configService.getValue('LOCAL_QUEUE_PATH').asString();
    if (!this.queueDir) {
      throw new Error('LOCAL_QUEUE_PATH config value is required');
    }
    this.ensureDirectoryExists(this.queueDir);
  }

  async sendMessage<T>(payload: MessagePayload<T>): Promise<void> {
    const queueFilePath = this.getQueueFilePath('jobs');
    this.logger.log(
      `Sending message locally to ${queueFilePath} for job ${payload.id}`,
    );

    try {
      let queueData: LocalQueueMessage[] = [];
      try {
        const fileContent = await fs.readFile(queueFilePath, 'utf-8');
        queueData = JSON.parse(fileContent);
        if (!Array.isArray(queueData)) {
          this.logger.warn(
            `Queue file ${queueFilePath} appears corrupted. Resetting.`,
          );
          queueData = [];
        }
      } catch (error) {
        if (error.code !== 'ENOENT') {
          this.logger.error(
            `Error reading local queue file ${queueFilePath}: ${error.message}`,
          );
          throw error;
        }
      }

      const newMessage: LocalQueueMessage = {
        MessageId: `local-${payload.id}`,
        Body: JSON.stringify(payload),
        Attributes: { ApproximateReceiveCount: '0' },
      };

      queueData.push(newMessage);
      await fs.writeFile(queueFilePath, JSON.stringify(queueData, null, 2));

      this.logger.log(
        `Successfully wrote message for job ${payload.id} to ${queueFilePath}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send message locally for job ${payload.id} to 'jobs': ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        this.logger.error(
          `Failed to create local queue directory ${dirPath}: ${error.message}`,
        );
        throw error;
      }
    }
  }

  private getQueueFilePath(queueName: string): string {
    return path.join(this.queueDir, `${queueName}.queue.json`);
  }
}
