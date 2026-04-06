import { DataMapper } from '@core/mapping';
import { UserMapper } from '@module-common';
import { InvoiceDocumentEntity } from '@module-persistence/entities';

import {
  CreateInvoiceDocumentsRequest,
  UpdateInvoiceDocumentRequest,
} from '../web';
import { Injectable } from '@nestjs/common';
import {
  InvoiceDocument,
  LiteInvoiceDocument,
} from '@fs-bobtail/factoring/data';

@Injectable()
export class InvoiceDocumentMapper
  implements DataMapper<InvoiceDocumentEntity, InvoiceDocument>
{
  constructor(private readonly userMapper: UserMapper) {}

  async entityToModel(entity: InvoiceDocumentEntity): Promise<InvoiceDocument> {
    const document = new InvoiceDocument();
    document.id = entity.id;
    document.internalUrl = entity.internalUrl;
    document.externalUrl = entity.externalUrl;
    document.thumbnailUrl = entity.thumbnailUrl;
    document.createdBy = await this.userMapper.createdByToModel(entity);
    document.name = entity.name;
    document.type = entity.type;
    document.fileHash = entity.fileHash;
    document.recordStatus = entity.recordStatus;
    document.label = entity.label;
    return document;
  }

  async createRequestToEntity(
    request: CreateInvoiceDocumentsRequest,
  ): Promise<InvoiceDocumentEntity> {
    const document = new InvoiceDocumentEntity();
    if (request.id) {
      document.id = request.id;
    }
    document.externalUrl = request.externalUrl;
    document.internalUrl = request.internalUrl;
    document.thumbnailUrl = request.thumbnailUrl;
    document.name = request.name;
    document.type = request.type;
    document.label = request.label;
    return document;
  }

  async updateRequestToEntity(
    request: UpdateInvoiceDocumentRequest,
  ): Promise<InvoiceDocumentEntity> {
    const document = new InvoiceDocumentEntity();
    if (request.id) {
      document.id = request.id;
    }
    document.externalUrl = request.externalUrl;
    document.internalUrl = request.internalUrl;
    document.thumbnailUrl = request.thumbnailUrl;
    document.name = request.name;
    document.type = request.type;
    return document;
  }

  async mapDocumentsForProcessing(
    documents: InvoiceDocument[],
  ): Promise<LiteInvoiceDocument[]> {
    const liteDocuments: LiteInvoiceDocument[] = [];
    documents.forEach((document) => {
      liteDocuments.push({
        id: document.id,
        internalUrl: document.internalUrl,
        externalUrl: document.externalUrl,
        name: document.name,
        type: document.type,
        label: document.label,
        createdBy: document.createdBy,
        createdAt: document.createdAt,
        updatedBy: document.updatedBy,
        updatedAt: document.updatedAt,
      });
    });
    return liteDocuments;
  }
}
