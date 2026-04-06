import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { S3EventRecord } from 'aws-lambda';
import axios, { AxiosResponse } from 'axios';
import { AxiosCommand } from '../axios-command';
import { readS3File } from './util';

interface Payload {
  user_id: string;
  email: string;
}

export class UpdateUserActivityCommand implements AxiosCommand {
  private readonly baseUrl: string;
  private readonly s3Event: S3EventRecord;
  private readonly s3Client: S3Client;

  constructor(record: S3EventRecord) {
    this.baseUrl = `${process.env.API_URL}`;
    this.s3Event = record;
    this.s3Client = new S3Client({ region: record.awsRegion });
  }

  async run(): Promise<AxiosResponse<any, any> | null> {
    const { authorizationToken, payload } = await readS3File<Payload>(
      this.s3Client,
      this.s3Event,
    );

    const url = `${this.baseUrl}/users/${payload.user_id}`;
    const requestBody = {
      email: payload.email,
    };
    try {
      const result = await axios.patch(url, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          authorization: !authorizationToken.startsWith('Bearer ')
            ? `Bearer ${authorizationToken}`
            : authorizationToken,
        },
      });
      return result;
    } catch (e) {
      throw new Error(`Error sending request to ${url}`);
    } finally {
      const key = this.s3Event.s3.object.key;
      const bucket = this.s3Event.s3.bucket.name;
      const deleteResult = await this.s3Client.send(
        new DeleteObjectCommand({
          Key: key,
          Bucket: bucket,
        }),
      );
      console.debug(
        `Delete s3 object ${key} from bucket ${bucket}`,
        deleteResult.$metadata,
      );
    }
  }
}
