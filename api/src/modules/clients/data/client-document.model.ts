import { AuditBaseModel } from '@core/data';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export enum ClientDocumentType {
  NOTICE_OF_ASSIGNMENT = 'assignment letter',
  FACTORING_AGREEMENT = 'factoring_agreement',
  W9 = 'w9',
  CERTIFICATE_OF_INSURANCE = 'certificate_of_insurance',
  FILED_UCC = 'filed_ucc',
  LIEN_SNAPSHOT = 'lien_snapshot',
  CORPORATION_DOCUMENT = 'corporation_document',
  FORM_8821 = 'form_8821',
  MC_AUTHORITY = 'mc_authority',
  RELEASE_LETTER = 'release_letter',
  OTHER = 'other',
  RATE_CONFIRMATION = 'rate_confirmation',
}
export class ClientDocument extends AuditBaseModel<ClientDocument> {
  @Expose()
  @ApiProperty({
    title: 'Client document ID',
    description: 'The client document ID',
  })
  id: string;

  @Expose()
  @ApiProperty({
    title: 'Client document internal URL',
    description: 'The client internal URL',
  })
  internalUrl: string;

  @Expose()
  @ApiProperty({
    title: 'Client document external URL',
    description: 'The client external URL',
  })
  externalUrl: string;

  @Expose()
  @ApiProperty({
    title: 'Client document type',
    description: 'The client document type',
    enum: ClientDocumentType,
  })
  type: ClientDocumentType;
}
