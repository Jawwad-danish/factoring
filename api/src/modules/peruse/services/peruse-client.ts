import { HttpService } from '@nestjs/axios';
import { plainToInstance } from 'class-transformer';
import { firstValueFrom } from 'rxjs';
import {
  ClassifyRequest,
  ClassifyRequestDocument,
  CreateLoadRequest,
  PeruseJobResponse,
  PeruseJobResult,
  VerifyLoadRequest,
} from '../data';

export interface BulkClassifyInput {
  documents: {
    externalId: string;
    url: string;
  }[];
}

export interface ClassifyInput {
  externalId: string;
  url: string;
  extract: boolean;
}

export interface VerifyLoadInput {
  billOfLadingUrl: string;
  rateConfirmationUrl: string;
  structuredLoadData?: object;
}

export interface CreateLoadInput {
  items: {
    externalId: string;
    url?: string;
    peruseDocumentId?: string;
  }[];
}

export class PeruseClient {
  constructor(
    private readonly httpService: HttpService,
    private readonly url: string,
    private readonly key: string,
  ) {}

  async createLoad(input: CreateLoadInput): Promise<PeruseJobResponse> {
    const body: CreateLoadRequest = {
      documents: input.items.map((item) => {
        return {
          external_id: item.externalId,
          document_ref: item.url || item.peruseDocumentId,
        };
      }),
    };

    const response = await firstValueFrom(
      this.httpService.post(`${this.url}/v2/create-load`, body, {
        headers: { 'x-api-key': this.key },
      }),
    );

    return plainToInstance(PeruseJobResponse, response.data);
  }

  async verifyLoad(input: VerifyLoadInput): Promise<PeruseJobResponse> {
    const body: VerifyLoadRequest = {
      BOL: {
        document_ref: input.billOfLadingUrl,
        classify: false,
      },
      rate_confirmation: {
        document_ref: input.rateConfirmationUrl,
        classify: false,
      },
    };

    const response = await firstValueFrom(
      this.httpService.post(`${this.url}/v2/verify-load`, body, {
        headers: { 'x-api-key': this.key },
      }),
    );

    return plainToInstance(PeruseJobResponse, response.data);
  }

  async getJobAsRaw(jobId: string): Promise<any> {
    const response = await firstValueFrom(
      this.httpService.get(`${this.url}/v2/job/${jobId}`, {
        headers: { 'x-api-key': this.key },
      }),
    );

    return response.data;
  }

  async getJob(jobId: string): Promise<PeruseJobResult> {
    const response = await firstValueFrom(
      this.httpService.get(`${this.url}/v2/job/${jobId}`, {
        headers: { 'x-api-key': this.key },
      }),
    );

    const result = plainToInstance(PeruseJobResult, response.data);
    result.raw = response.data;
    return result;
  }

  async bulkClassifyDocuments(input: BulkClassifyInput) {
    const body = {
      documents: input.documents.map((document) => {
        return {
          external_id: document.externalId,
          url: document.url,
        } as ClassifyRequestDocument;
      }),
      extract: true,
    };

    const response = await firstValueFrom(
      this.httpService.post(`${this.url}/v2/bulk-classify`, body, {
        headers: { 'x-api-key': this.key },
      }),
    );

    return plainToInstance(PeruseJobResponse, response.data);
  }

  async classifyDocument({
    externalId,
    url,
    extract,
  }: ClassifyInput): Promise<PeruseJobResponse> {
    const body: ClassifyRequest = {
      document: {
        external_id: externalId,
        url,
      },
      extract: extract,
    };

    const response = await firstValueFrom(
      this.httpService.post(`${this.url}/v2/classify`, body, {
        headers: { 'x-api-key': this.key },
      }),
    );

    return plainToInstance(PeruseJobResponse, response.data);
  }
}
