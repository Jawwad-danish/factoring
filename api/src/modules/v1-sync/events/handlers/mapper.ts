import {
  InvoiceDocumentEntity,
  InvoiceDocumentType,
} from '@module-persistence/entities';

export class InvoiceDocumentMapper {
  static v1DocumentToEntity(documentData: any): InvoiceDocumentEntity {
    const entity = new InvoiceDocumentEntity();
    entity.id = documentData.id;
    entity.name = documentData.name;
    entity.type = InvoiceDocumentType.Generated;
    entity.internalUrl = documentData.url;
    entity.externalUrl = documentData.filestack_url || documentData.url;
    return entity;
  }
}
