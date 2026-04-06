import {
  CopyObjectCommandOutput,
  GetObjectCommandOutput,
  PutObjectCommandOutput,
} from '@aws-sdk/client-s3';
import { environment } from '@core/environment';
import { Injectable } from '@nestjs/common';
import { CloudStorageService } from './cloud-storage.service';
import { LocalStorageService } from './local-storage.service';
import { S3ObjectLocator } from './s3-object-locator';
import { ContentParams, StorageService } from './storage-service';

@Injectable()
export class S3Service implements StorageService {
  private readonly storage: StorageService;

  constructor() {
    this.storage =
      environment.isLocal() || environment.isTest()
        ? new LocalStorageService()
        : new CloudStorageService();
  }

  getObject(source: S3ObjectLocator): Promise<GetObjectCommandOutput> {
    return this.storage.getObject(source);
  }

  getObjectContent(source: S3ObjectLocator): Promise<string> {
    return this.storage.getObjectContent(source);
  }

  copyObject(
    source: S3ObjectLocator,
    destination: S3ObjectLocator,
  ): Promise<CopyObjectCommandOutput> {
    return this.storage.copyObject(source, destination);
  }

  putObjectFromURL(
    url: string,
    destination: S3ObjectLocator,
  ): Promise<PutObjectCommandOutput> {
    return this.storage.putObjectFromURL(url, destination);
  }

  async putObject(
    content: ContentParams,
    destination: S3ObjectLocator,
  ): Promise<PutObjectCommandOutput> {
    return this.storage.putObject(content, destination);
  }
}
