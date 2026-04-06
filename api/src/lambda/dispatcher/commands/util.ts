import {
  GetObjectCommand,
  GetObjectCommandOutput,
  S3Client,
} from '@aws-sdk/client-s3';
import { S3EventRecord } from 'aws-lambda';
import { Readable } from 'stream';
import { readableToString } from '../../../core/util/streams';

export interface FileContents<TPayload> {
  authorizationToken: string;
  payload: TPayload;
}

export const readS3File = async <TPayload>(
  s3Client: S3Client,
  record: S3EventRecord,
): Promise<FileContents<TPayload>> => {
  console.log(
    `Attempting to fetch s3 object ${record.s3.object.key} from ${record.s3.bucket.name}`,
  );
  const s3File = await s3Client.send(
    new GetObjectCommand({
      Bucket: record.s3.bucket.name,
      Key: record.s3.object.key,
    }),
  );

  console.log(
    `Fetched s3 object ${record.s3.object.key} from ${record.s3.bucket.name}`,
  );

  return await parseS3File(s3File);
};

const parseS3File = async <TPayload>(
  s3File: GetObjectCommandOutput,
): Promise<FileContents<TPayload>> => {
  const contents = await readableToString(s3File.Body as Readable);
  const parsed = JSON.parse(contents);
  if (!parsed.authorizationToken) {
    throw new Error('Missing authorization in file contents');
  }
  if (!parsed.payload) {
    throw new Error('Missing payload in file contents');
  }
  return parsed as FileContents<TPayload>;
};
