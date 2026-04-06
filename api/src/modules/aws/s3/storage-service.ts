import {
  CopyObjectCommandOutput,
  GetObjectCommandOutput,
  PutObjectCommandOutput,
} from '@aws-sdk/client-s3';
import { S3ObjectLocator } from './s3-object-locator';
import { NodeJsRuntimeStreamingBlobPayloadInputTypes } from '@smithy/types';

export interface ContentParams {
  data: NodeJsRuntimeStreamingBlobPayloadInputTypes;
  type?: string;
  length?: number;
}

export interface StorageService {
  getObject(source: S3ObjectLocator): Promise<GetObjectCommandOutput>;

  getObjectContent(source: S3ObjectLocator): Promise<string>;

  copyObject(
    source: S3ObjectLocator,
    destination: S3ObjectLocator,
  ): Promise<CopyObjectCommandOutput>;

  putObjectFromURL(
    url: string,
    destination: S3ObjectLocator,
  ): Promise<PutObjectCommandOutput>;

  putObject(
    content: ContentParams,
    destination: S3ObjectLocator,
  ): Promise<PutObjectCommandOutput>;
}
