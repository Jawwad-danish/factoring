import {
  CopyObjectCommand,
  CopyObjectCommandOutput,
  GetObjectCommand,
  GetObjectCommandOutput,
  PutObjectCommand,
  PutObjectCommandOutput,
  S3Client,
} from '@aws-sdk/client-s3';
import { environment } from '@core/environment';
import { readableToString } from '@core/streams';
import { Logger } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { Readable } from 'stream';
import { S3ObjectLocator } from './s3-object-locator';
import { ContentParams, StorageService } from './storage-service';

export class CloudStorageService implements StorageService {
  private readonly client: S3Client = new S3Client({
    region: environment.aws.defaultRegion(),
  });
  private readonly logger: Logger = new Logger(CloudStorageService.name);

  async getObject(source: S3ObjectLocator): Promise<GetObjectCommandOutput> {
    try {
      const command = new GetObjectCommand({
        Bucket: source.getBucket(),
        Key: source.getKey(),
      });

      const result = await this.client.send(command);
      this.logger.log(`Fetched s3 object from ${source}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Could not fetch object from bucket ${source.getBucket()} with key ${source.getKey()}`,
        error,
      );
      throw error;
    }
  }

  async getObjectContent(source: S3ObjectLocator): Promise<string> {
    const s3Result = await this.getObject(source);
    return readableToString(s3Result.Body as Readable);
  }

  async copyObject(
    source: S3ObjectLocator,
    destination: S3ObjectLocator,
  ): Promise<CopyObjectCommandOutput> {
    try {
      const command = new CopyObjectCommand({
        CopySource: source.getPath(),
        Bucket: destination.getBucket(),
        Key: destination.getKey(),
      });

      const result = await this.client.send(command);
      this.logger.log(`Copied object ${source} to ${destination}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Could not copy object from bucket ${source.getBucket()} with key ${source.getKey()} to bucket ${destination.getBucket()} with key ${destination.getKey()}`,
        error,
      );
      throw error;
    }
  }

  async putObjectFromURL(
    url: string,
    destination: S3ObjectLocator,
  ): Promise<PutObjectCommandOutput> {
    const downloadResponse = await this.download(url);
    return this.putObject(
      {
        data: downloadResponse.data,
        type: downloadResponse.headers['content-type'],
        length: parseInt(
          downloadResponse.headers['content-length'] ||
            downloadResponse.headers['file-size'],
        ),
      },
      destination,
    );
  }

  async putObject(
    content: ContentParams,
    destination: S3ObjectLocator,
  ): Promise<PutObjectCommandOutput> {
    try {
      const command = new PutObjectCommand({
        Body: content.data,
        Bucket: destination.getBucket(),
        Key: destination.getKey(),
        ContentType: content.type,
        ContentLength: content.length,
      });
      const result = await this.client.send(command);
      this.logger.log(`Put object to ${destination}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Could not put object with key ${destination.getKey()} to bucket ${destination.getBucket()}`,
      );
      throw error;
    }
  }

  private async download(url: string): Promise<AxiosResponse<Buffer, any>> {
    try {
      return axios.get(url, {
        responseType: 'arraybuffer',
      });
    } catch (error) {
      this.logger.error(`Could not download content from url ${url}`);
      throw error;
    }
  }
}
