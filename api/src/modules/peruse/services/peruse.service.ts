import { Transactional } from '@module-database';
import {
  PeruseJobEntity,
  PeruseJobType,
  PeruseStatus,
} from '@module-persistence/entities';
import { PeruseRepository } from '@module-persistence/repositories';
import { Injectable, Logger } from '@nestjs/common';
import { PeruseJobStatus } from '../data';
import { CreateLoadInput, PeruseClient } from './peruse-client';

@Injectable()
export class PeruseService {
  private logger = new Logger(PeruseService.name);

  constructor(
    private readonly peruseClient: PeruseClient,
    private readonly peruseRepository: PeruseRepository,
  ) {}

  @Transactional('peruse-sync')
  async sync() {
    const jobs = await this.peruseRepository.find(
      {
        status: PeruseStatus.InProgress,
      },
      { limit: 50 },
    );
    if (jobs.length === 0) {
      this.logger.warn(`No Peruse jobs need synchronization`);
      return;
    }

    const responses = await Promise.all(
      jobs.map((job) => this.peruseClient.getJob(job.jobId)),
    );
    for (const response of responses) {
      const job = jobs.find((job) => job.jobId === response.jobId);
      if (!job) {
        this.logger.warn(
          `Could not find job with id ${response.jobId} in our system`,
        );
        continue;
      }

      switch (response.status) {
        case PeruseJobStatus.Error:
          job.status = PeruseStatus.Error;
          break;
        case PeruseJobStatus.Success:
          job.status = PeruseStatus.Done;
          job.response = response.raw;
          break;
      }

      if (
        job.type === PeruseJobType.BulkClassification &&
        job.status === PeruseStatus.Done
      ) {
        await this.createLoad(job);
      }
    }
  }

  private async createLoad(classificationJob: PeruseJobEntity) {
    const createLoadInput: CreateLoadInput = {
      items: classificationJob.response?.result?.child_jobs?.map(
        (childJob: any) => {
          return {
            externalId: childJob.external_id,
            peruseDocumentId: childJob.document_id,
          };
        },
      ),
    };
    if (createLoadInput.items.length === 0) {
      this.logger.warn(
        `Will not create load from classification job ${classificationJob.id} because no documents are found`,
      );
      return;
    }

    const createLoadResult = await this.peruseClient.createLoad(
      createLoadInput,
    );
    const entity = new PeruseJobEntity();
    entity.invoiceId = classificationJob.invoiceId;
    entity.jobId = createLoadResult.jobId;
    entity.type = PeruseJobType.CreateLoad;
    entity.request = createLoadResult.input as any;
    entity.response = null;
    entity.status = PeruseStatus.InProgress;
    this.peruseRepository.persist(entity);
  }
}
