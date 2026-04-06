import { AuditBaseModel } from '@core/data';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export enum BrokerDocumentType {
  RATE_CONFIRMATION = 'rate confirmation',
}

export class BrokerDocument extends AuditBaseModel<BrokerDocument> {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  internalUrl: string;

  @Expose()
  @ApiProperty()
  externalUrl: string;

  @Expose()
  @ApiProperty({
    enum: BrokerDocumentType,
    enumName: 'BrokerDocumentType',
  })
  type: BrokerDocumentType;
}
