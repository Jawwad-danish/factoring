import { BrokerDocumentType } from '@module-brokers/data';
import { ApiProperty } from '@nestjs/swagger';
import { BaseModel } from '@core/data';
import { Expose } from 'class-transformer';

export class BrokerDocumentResponse extends BaseModel<BrokerDocumentResponse> {
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

  @Expose()
  @ApiProperty()
  createdBy: string;

  @Expose()
  @ApiProperty()
  updatedBy: string;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;
}
