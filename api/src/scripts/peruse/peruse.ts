import { HttpService } from '@nestjs/axios';
import { plainToInstance } from 'class-transformer';
import { firstValueFrom } from 'rxjs';
import {
  ClassifyRequest,
  CreateLoadRequest,
  PeruseJobResult as PeruseJobResult,
  PeruseJobResponse,
  VerifyLoadRequest,
} from './data';

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
    url: string;
  }[];
}

export class Peruse {
  constructor(
    private readonly httpService: HttpService,
    private readonly peruseUrl: string,
    private readonly peruseKey: string,
  ) {}

  async createLoad(input: CreateLoadInput): Promise<PeruseJobResponse> {
    const body: CreateLoadRequest = {
      documents: input.items.map((item) => {
        return {
          external_id: item.externalId,
          document_ref: item.url,
        };
      }),
    };

    const response = await firstValueFrom(
      this.httpService.post(`${this.peruseUrl}/v2/create-load`, body, {
        headers: { 'x-api-key': this.peruseKey },
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
      this.httpService.post(`${this.peruseUrl}/v2/verify-load`, body, {
        headers: { 'x-api-key': this.peruseKey },
      }),
    );

    return plainToInstance(PeruseJobResponse, response.data);
  }

  async classifyDocument({
    externalId,
    url,
    extract,
  }: ClassifyInput): Promise<PeruseJobResponse> {
    return await this.classify(externalId, url, extract);
  }

  async getJobAsRaw(jobId: string): Promise<any> {
    const response = await firstValueFrom(
      this.httpService.get(`${this.peruseUrl}/v2/job/${jobId}`, {
        headers: { 'x-api-key': this.peruseKey },
      }),
    );

    return response.data;
  }

  async getJob(jobId: string): Promise<PeruseJobResult> {
    const response = await firstValueFrom(
      this.httpService.get(`${this.peruseUrl}/v2/job/${jobId}`, {
        headers: { 'x-api-key': this.peruseKey },
      }),
    );

    return plainToInstance(PeruseJobResult, response.data);
  }

  private async classify(
    externalId: string,
    documentUrl: string,
    extract: boolean,
  ): Promise<PeruseJobResponse> {
    const body: ClassifyRequest = {
      document: {
        external_id: externalId,
        url: documentUrl,
      },
      extract: extract,
    };

    const response = await firstValueFrom(
      this.httpService.post(`${this.peruseUrl}/v2/classify`, body, {
        headers: { 'x-api-key': this.peruseKey },
      }),
    );

    return plainToInstance(PeruseJobResponse, response.data);
  }
}
