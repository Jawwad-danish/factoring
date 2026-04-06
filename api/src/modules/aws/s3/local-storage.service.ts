import {
  CopyObjectCommandOutput,
  GetObjectCommandOutput,
  PutObjectCommandOutput,
} from '@aws-sdk/client-s3';
import { readableToString } from '@core/streams';
import { UUID } from '@core/uuid';
import { Logger } from '@nestjs/common';
import { ResponseMetadata } from '@smithy/types';
import { sdkStreamMixin } from '@smithy/util-stream';
import axios, { AxiosResponse } from 'axios';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Readable } from 'stream';
import { S3ObjectLocator } from './s3-object-locator';
import { ContentParams } from './storage-service';

export class LocalStorageService {
  private readonly logger: Logger = new Logger(LocalStorageService.name);

  async getObject(source: S3ObjectLocator): Promise<GetObjectCommandOutput> {
    return {
      $metadata: this.buildMetadata(),
      Body: sdkStreamMixin(
        fs.createReadStream(
          path.join(
            os.tmpdir(),
            'bobtail',
            source.getBucket(),
            source.getKey(),
          ),
        ),
      ),
    };
  }

  async getObjectContent(source: S3ObjectLocator): Promise<string> {
    const s3Result = await this.getObject(source);
    return readableToString(s3Result.Body as Readable);
  }

  async copyObject(
    source: S3ObjectLocator,
    destination: S3ObjectLocator,
  ): Promise<CopyObjectCommandOutput> {
    fs.copyFileSync(
      path.join(os.tmpdir(), 'bobtail', source.getBucket(), source.getKey()),
      path.join(
        os.tmpdir(),
        'bobtail',
        destination.getBucket(),
        destination.getKey(),
      ),
    );
    return {
      $metadata: this.buildMetadata(),
    };
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
    let data: null | Buffer = null;
    if (
      typeof content.data === 'string' ||
      content.data instanceof Uint8Array
    ) {
      data = Buffer.from(content.data);
    }
    if (Buffer.isBuffer(content.data)) {
      data = content.data;
    }
    if (content.data instanceof Readable) {
      data = Buffer.concat(await content.data.toArray());
    }
    if (!data) {
      throw new Error(
        `Could not write data to local storage because of unhandled type of ${typeof content.data}`,
      );
    }

    const filePath = path.join(
      os.tmpdir(),
      'bobtail',
      destination.getBucket(),
      destination.getKey(),
    );
    try {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, data);
    } catch (error) {
      this.logger.error(`Could not write file to local storage path ${path}`);
      throw new Error(`Could not write file to local storage`);
    }
    return {
      $metadata: this.buildMetadata(),
    };
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

  private buildMetadata(): ResponseMetadata {
    return {
      httpStatusCode: 200,
      requestId: UUID.get(),
      extendedRequestId: UUID.get(),
      cfId: UUID.get(),
      attempts: 1,
      totalRetryDelay: 0,
    };
  }
}
