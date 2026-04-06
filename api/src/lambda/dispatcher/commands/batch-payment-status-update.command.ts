import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { S3EventRecord } from 'aws-lambda';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { Readable } from 'stream';
import { AxiosCommand } from '../axios-command';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 5000;

// Simulate a transfer service webhook for transfer status update via a message from v1
// This will be replaced with a real webhook from transfers service in the future
// Only for ACH payments - wire status is already sent directly from transfers service
export class BatchPaymentStatusUpdateCommand implements AxiosCommand {
  private readonly url: string;
  private authToken: string;
  private readonly s3Event: S3EventRecord;
  private readonly s3Client: S3Client;

  constructor(record: S3EventRecord) {
    this.url = `${process.env.API_URL}/transfers/update-status`;
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
    const jsonPayload: SourcePayloadWrapper = JSON.parse(payload);
    if (!jsonPayload.authorizationToken) {
      throw new Error('Payload missing authorization');
    }
    this.authToken = jsonPayload.authorizationToken;

    const sourceData = jsonPayload.payload;

    // Only process ACH payments - wire status is sent from transfers service
    if (sourceData.transfer_type === 'ach') {
      const request = this.mapToWebhookRequest(sourceData);
      return this.postWithRetry(request);
    } else if (sourceData.transfer_type === 'wire') {
      console.log(
        `Not sending POST request with payload due to wire transfer type [${sourceData.transfer_type}]. Transfer status [${sourceData.status}].`,
        sourceData,
      );
      return null;
    } else {
      console.log(
        `Not sending POST request with payload due to transfer type [${sourceData.transfer_type}]. Transfer status [${sourceData.status}].`,
        sourceData,
      );
      return null;
    }
  }

  private async postWithRetry(request: any): Promise<AxiosResponse<any, any>> {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(
          `Sending to ${this.url} POST request with payload (attempt ${
            attempt + 1
          }/${MAX_RETRIES + 1})`,
          JSON.stringify(request, null, 2),
        );
        return await axios.post(this.url, request, {
          headers: {
            'Content-Type': 'application/json',
            authorization: !this.authToken.startsWith('Bearer ')
              ? `Bearer ${this.authToken}`
              : this.authToken,
          },
        });
      } catch (error) {
        if (this.isBatchPaymentNotFound(error) && attempt < MAX_RETRIES) {
          const delay = BASE_DELAY_MS * Math.pow(3, attempt);
          console.log(
            `Batch payment not found (attempt ${attempt + 1}/${
              MAX_RETRIES + 1
            }). Retrying in ${delay / 1000}s...`,
          );
          await this.sleep(delay);
          continue;
        }
        console.log('Entered catch with error:', error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        throw new Error(
          `Failed to call update transfer status endpoint: ${errorMessage}`,
        );
      }
    }
    throw new Error('Exhausted all retries for update transfer status');
  }

  private isBatchPaymentNotFound(error: unknown): boolean {
    if (!(error instanceof AxiosError) || !error.response) {
      return false;
    }
    return (
      error.response.status === 400 &&
      error.response.data?.id === 'batch-payment-not-found'
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private mapToWebhookRequest(source: SourcePayload): any {
    const webhookTypeStatus = v1StatusToWebhookTypeStatus(
      source.status as V1Status,
    );
    const batchState = v1StatusToBatchState(source.status as V1Status);
    const transferState = v1StatusToTransferState(source.status as V1Status);
    return {
      id: source.id,
      type: `BatchTransfer.${webhookTypeStatus}`,
      timestamp: new Date().toISOString(),
      data: {
        id: source.id,
        externalId: source.id,
        state: batchState,
        amount: source.amount,
        metadata: {
          fromV1: true,
          v1TransferTime: source.transfer_time,
          v1CreatedAt: source.created_at,
        },
        transfers: [
          {
            id: source.id,
            state: transferState,
            amount: source.amount,
            direction: 'credit',
            paymentType: 'ach',
            originatingAccountId: 'unknown',
            receivingAccountId: 'unknown',
            createdAt: source.created_at,
            modifiedAt: source.updated_at,
          },
        ],
      },
    };
  }
}

export enum WebhookBatchState {
  Completed = 'completed',
  Processing = 'processing',
}

enum WebhookTypeStatus {
  Pending = 'pending',
  Completed = 'completed',
  Processing = 'processing',
}

export enum WebhookTransferState {
  Completed = 'completed',
  Processing = 'processing',
  Sent = 'sent',
  Failed = 'failed',
}

type V1Status =
  | 'sent'
  | 'declined1'
  | 'declined2'
  | 'declined3'
  | 'declined4'
  | 'declined5'
  | 'not-sent-0-dollars'
  | 'in-calculation'
  | 'accepted';

interface SourcePayloadWrapper {
  authorizationToken: string;
  payload: SourcePayload;
}

interface SourcePayload {
  id: string;
  status: V1Status;
  amount: number;
  transfer_type: string;
  metadata: any;
  client_payments: ClientPayment[];
  [key: string]: any;
}

interface ClientPayment {
  id: string;
  amount: number;
  created_at: string;
  updated_at: string;
  clientaccountpayments: ClientAccountPayment[];
  [key: string]: any;
}

interface ClientAccountPayment {
  status: string;
  client_bank_account_id: string;
  [key: string]: any;
}

function readableToString(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}

function v1StatusToWebhookTypeStatus(status: V1Status): WebhookTypeStatus {
  switch (status) {
    // even if the transfer fails, the webhook type status is completed (nothing more to be done)
    case 'sent':
    case 'declined1':
    case 'declined2':
    case 'declined3':
    case 'declined4':
    case 'declined5':
    case 'accepted':
    case 'not-sent-0-dollars':
      return WebhookTypeStatus.Completed;
    case 'in-calculation':
      return WebhookTypeStatus.Processing;
    default:
      return WebhookTypeStatus.Pending;
  }
}

function v1StatusToBatchState(status: V1Status): WebhookBatchState {
  switch (status) {
    // even if the transfer fails, the batch status is completed (nothing more to be done)
    case 'sent':
    case 'declined1':
    case 'declined2':
    case 'declined3':
    case 'declined4':
    case 'declined5':
    case 'accepted':
    case 'not-sent-0-dollars':
      return WebhookBatchState.Completed;
    default:
      return WebhookBatchState.Processing;
  }
}

function v1StatusToTransferState(status: V1Status): WebhookTransferState {
  switch (status) {
    case 'declined1':
    case 'declined2':
    case 'declined3':
    case 'declined4':
    case 'declined5':
      return WebhookTransferState.Failed;
    case 'in-calculation':
      return WebhookTransferState.Processing;
    default:
      return WebhookTransferState.Completed;
  }
}
