import { V1AwareBaseModel } from '@core/data';
import { ProcessingNotesStatus } from '@module-persistence/entities';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class ProcessingNotesUpdateRequest extends V1AwareBaseModel<ProcessingNotesUpdateRequest> {
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  brokerId?: string;

  @IsOptional()
  @IsEnum(ProcessingNotesStatus)
  status?: ProcessingNotesStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
