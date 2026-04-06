import {
  S3Client,
  GetObjectCommand,
  GetObjectCommandOutput,
  CopyObjectCommandOutput,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';

export class S3Mock {
  readonly client = mockClient(S3Client);

  onGetObjectResolve(response: Partial<GetObjectCommandOutput>) {
    this.client.on(GetObjectCommand).resolves(response);
  }

  onCopyObjectResolve(response: Partial<CopyObjectCommandOutput>) {
    this.client.on(CopyObjectCommand).resolves(response);
  }

  reset() {
    this.client.reset();
  }
}
