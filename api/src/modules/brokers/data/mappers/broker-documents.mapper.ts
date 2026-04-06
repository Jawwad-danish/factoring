import { DataMapper } from '@core/mapping';
import { BrokerDocumentResponse } from '../../api/data';
import { BrokerDocument } from '../model';
import { UserMapper } from '@module-common';
import { UserRepository } from '@module-persistence/repositories';
import { Injectable } from '@nestjs/common';

@Injectable()
export class BrokerDocumentsMapper implements DataMapper<void, void> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userMapper: UserMapper,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  entityToModel(_entity: void): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async brokerDocumentResponseToModel(
    brokerDocumentResponse: BrokerDocumentResponse,
  ): Promise<BrokerDocument> {
    const createdByUserId = await this.userRepository.getOneById(
      brokerDocumentResponse.createdBy,
    );
    const updatedByUserId = await this.userRepository.getOneById(
      brokerDocumentResponse.updatedBy,
    );
    return {
      id: brokerDocumentResponse.id,
      internalUrl: brokerDocumentResponse.internalUrl,
      externalUrl: brokerDocumentResponse.externalUrl,
      type: brokerDocumentResponse.type,
      createdBy: await this.userMapper.entityToModel(createdByUserId),
      updatedBy: await this.userMapper.entityToModel(updatedByUserId),
      createdAt: brokerDocumentResponse.createdAt,
      updatedAt: brokerDocumentResponse.updatedAt,
    };
  }
}
