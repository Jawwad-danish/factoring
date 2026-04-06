import { V1AwareBaseModel } from '@core/data';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ClientDocumentType } from '../client-document.model';

export class UpdateClientDocumenRequest extends V1AwareBaseModel<UpdateClientDocumenRequest> {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  internalUrl: string;

  @IsString()
  externalUrl: string;

  @IsEnum(ClientDocumentType)
  @IsOptional()
  type?: ClientDocumentType;

  @IsString()
  updatedBy: string;
}
