import { Expose } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseModel } from '@core/data';
import { BrokerDocumentType } from '../model/broker-documents.model';

export class BrokerDocumentRequest extends BaseModel<BrokerDocumentRequest> {
  @Expose()
  @IsString()
  @ApiProperty({
    description: 'The internal URL of the broker document',
  })
  internalUrl: string;

  @Expose()
  @IsString()
  @ApiProperty({
    description: 'The external URL of the broker document',
  })
  externalUrl: string;

  @Expose()
  @IsEnum(BrokerDocumentType)
  @ApiProperty({
    enum: BrokerDocumentType,
    enumName: 'BrokerDocumentType',
    description: 'The type of the broker document',
  })
  type: BrokerDocumentType;

  @Expose()
  @IsString()
  @ApiProperty({
    description: 'The user who created the broker document',
  })
  createdBy: string;

  @Expose()
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'The user who updated the broker document',
  })
  updatedBy?: string;
}
