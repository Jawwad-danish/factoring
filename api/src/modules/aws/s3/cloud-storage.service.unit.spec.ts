import {
  CopyObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import axios from 'axios';

import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { CloudStorageService } from './cloud-storage.service';
import { S3ObjectLocator } from './s3-object-locator';

const s3ClientMock = mockClient(S3Client);
jest.mock('axios');

beforeEach(() => {
  s3ClientMock.reset();
});

describe('CloudStorageService', () => {
  test('Copy object', async () => {
    const service = new CloudStorageService();
    const source = new S3ObjectLocator('source_bucket', 'source_key+=$', true);
    const destination = new S3ObjectLocator(
      'destination_bucket',
      'destination_key',
    );
    await service.copyObject(source, destination);
    expect(s3ClientMock).toHaveReceivedCommandWith(CopyObjectCommand, {
      CopySource: source.getPath(),
      Bucket: destination.getBucket(),
      Key: destination.getKey(),
    });
  });

  test('Put object', async () => {
    const mockedAxios = axios as jest.Mocked<typeof axios>;
    mockedAxios.get.mockResolvedValue({
      data: '',
      headers: {
        'content-type': 'application/pdf',
        'content-length': 1,
      },
    });
    const service = new CloudStorageService();
    const destination = new S3ObjectLocator(
      'destination_bucket',
      'destination_key',
    );
    await service.putObjectFromURL('url', destination);
    expect(s3ClientMock).toHaveReceivedCommandWith(PutObjectCommand, {
      Bucket: destination.getBucket(),
      Key: destination.getKey(),
    });
  });

  test('Get object', async () => {
    const service = new CloudStorageService();
    const source = new S3ObjectLocator('source_bucket', 'source_key+=$', true);
    await service.getObject(source);
    expect(s3ClientMock).toHaveReceivedCommandWith(GetObjectCommand, {
      Bucket: source.getBucket(),
      Key: source.getKey(),
    });
  });
});
