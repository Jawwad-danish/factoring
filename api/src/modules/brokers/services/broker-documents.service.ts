import { Injectable } from '@nestjs/common';
import { Transactional } from '@module-database';
import { CrossCuttingConcerns } from '@core/util';
import { BrokerDocumentsError } from './errors';
import { CommandRunner } from '@module-cqrs';
import { BrokerDocumentRequest } from '../data/web';
import { BrokerDocument } from '../data/model';
import {
  CreateBrokerDocumentCommand,
  DeleteBrokerDocumentCommand,
  UpdateBrokerDocumentCommand,
} from './commands';

const OBSERVABILITY_TAG = 'broker-documents-service';

@Injectable()
export class BrokerDocumentsService {
  constructor(private readonly commandRunner: CommandRunner) {}

  @Transactional('create-broker-document')
  @CrossCuttingConcerns({
    error: {
      errorSupplier: (cause) =>
        new BrokerDocumentsError('Could not create broker documents', cause),
    },
    logging: () => {
      return {
        message: 'Creating broker documents',
      };
    },
    observability: {
      tag: [OBSERVABILITY_TAG, 'create-broker-document'],
    },
  })
  async createBrokerDocument(
    brokerId: string,
    request: BrokerDocumentRequest,
  ): Promise<BrokerDocument> {
    return await this.commandRunner.run(
      new CreateBrokerDocumentCommand(brokerId, request),
    );
  }

  @Transactional('update-broker-document')
  @CrossCuttingConcerns({
    error: {
      errorSupplier: (cause) =>
        new BrokerDocumentsError('Could not update broker documents', cause),
    },
    logging: () => {
      return {
        message: 'Updating broker documents',
      };
    },
    observability: {
      tag: [OBSERVABILITY_TAG, 'update-broker-document'],
    },
  })
  async updateBrokerDocument(
    brokerId: string,
    documentId: string,
    request: BrokerDocumentRequest,
  ): Promise<BrokerDocument> {
    return await this.commandRunner.run(
      new UpdateBrokerDocumentCommand(brokerId, documentId, request),
    );
  }

  @Transactional('delete-broker-document')
  @CrossCuttingConcerns({
    error: {
      errorSupplier: (cause) =>
        new BrokerDocumentsError('Could not delete broker documents', cause),
    },
    logging: () => {
      return {
        message: 'Deleting broker documents',
      };
    },
    observability: {
      tag: [OBSERVABILITY_TAG, 'delete-broker-document'],
    },
  })
  async deleteBrokerDocument(
    brokerId: string,
    documentId: string,
  ): Promise<void> {
    await this.commandRunner.run(
      new DeleteBrokerDocumentCommand(brokerId, documentId),
    );
  }
}
