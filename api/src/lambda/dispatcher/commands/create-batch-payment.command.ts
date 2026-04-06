import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { S3EventRecord } from 'aws-lambda';
import axios, { AxiosResponse } from 'axios';
import { Readable } from 'stream';
import { AxiosCommand } from '../axios-command';

export class CreateBatchPaymentCommand implements AxiosCommand {
  private readonly url: string;
  private authToken: string;
  private readonly s3Event: S3EventRecord;
  private readonly s3Client: S3Client;

  constructor(record: S3EventRecord) {
    this.url = `${process.env.API_URL}/transfers/initiate-regular`;
    this.s3Event = record;
    this.s3Client = new S3Client({ region: record.awsRegion });
  }

  async run(): Promise<AxiosResponse<any, any> | null> {
    console.log(
      `Attempting to fetch s3 object ${this.s3Event.s3.object.key} from ${this.s3Event.s3.bucket.name}`,
    );
    const s3File = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: this.s3Event.s3.bucket.name,
        Key: this.s3Event.s3.object.key,
      }),
    );

    console.log(
      `Fetched s3 object ${this.s3Event.s3.object.key} from ${this.s3Event.s3.bucket.name}`,
    );

    const payload = await readableToString(s3File.Body as Readable);
    const jsonPayload = JSON.parse(payload);
    if (!jsonPayload.authorizationToken) {
      throw new Error('Payload missing authorization');
    }
    this.authToken = jsonPayload.authorizationToken;

    if (
      jsonPayload.payload.transfer_type === 'ach' &&
      (jsonPayload.payload.status === 'sent' ||
        jsonPayload.payload.status === 'accepted' ||
        jsonPayload.payload.status === 'in-calculation')
    ) {
      const request = {
        id: jsonPayload.payload.id,
      };
      try {
        console.log(
          `Sending to ${this.url} POST request with payload`,
          request,
        );
        const result = await axios.post(this.url, request, {
          headers: {
            'Content-Type': 'application/json',
            authorization: !this.authToken.startsWith('Bearer ')
              ? `Bearer ${this.authToken}`
              : this.authToken,
          },
        });
        return result;
      } catch (error) {
        console.log('Entered catch with error:', error);
        throw new Error(
          'Something happened when calling create-batch-payment endpoint',
        );
      }
    } else if (jsonPayload.payload.transfer_type === 'wire') {
      console.log(
        `Not sending POST request with payload due to wire transfer type [${jsonPayload.payload.transfer_type}]. Transfer status [${jsonPayload.payload.status}].`,
        jsonPayload.payload,
      );
      return null;
    } else {
      console.log(
        `Not sending POST request with payload due to unsuccessful transfer status [${jsonPayload.payload.status}].`,
        jsonPayload.payload,
      );
      return null;
    }
  }
}

function readableToString(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}
