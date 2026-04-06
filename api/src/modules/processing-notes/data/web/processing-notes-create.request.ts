import { V1AwareBaseModel } from '@core/data';
import { IsNotEmpty, IsString, IsUUID, ValidateIf } from 'class-validator';

export class ProcessingNotesCreateRequest extends V1AwareBaseModel<ProcessingNotesCreateRequest> {
  @ValidateIf((obj: ProcessingNotesCreateRequest) => !obj.brokerId)
  @IsNotEmpty()
  @IsUUID()
  clientId?: string;

  @ValidateIf((obj: ProcessingNotesCreateRequest) => !obj.clientId)
  @IsNotEmpty()
  @IsUUID()
  brokerId?: string;

  @IsNotEmpty()
  @IsString()
  notes: string;
}
