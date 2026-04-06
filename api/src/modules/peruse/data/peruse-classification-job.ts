import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { BaseModel } from '@core/data';
import { Input, PeruseJobStatus } from './common';
import { Expose, Type } from 'class-transformer';
import { PeruseJobType } from './peruse-job-types';

export class PeruseJobResponse extends BaseModel<PeruseJobResponse> {
  @Expose({ name: 'job_id' })
  @IsNotEmpty()
  jobId: string;

  @Expose({ name: 'job_type' })
  @IsNotEmpty()
  @IsEnum(PeruseJobType)
  jobType: PeruseJobType;

  @Expose({ name: 'status' })
  @IsEnum(PeruseJobStatus)
  status: PeruseJobStatus;

  @Expose({ name: 'input' })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => Input)
  input: Input;

  @Expose({ name: 'result' })
  result: null;

  @Expose({ name: 'message' })
  @IsOptional()
  message?: string;
}
