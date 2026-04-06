import { BaseModel } from '@core/data';
import { IsString } from 'class-validator';
import { PeruseJobStatus } from '../common';
import { PeruseJobResponse } from '../peruse-classification-job';

export class PeruseJob<T> extends BaseModel<T> {
  @IsString()
  jobId: string;

  @IsString()
  jobType: string;

  @IsString()
  jobStatus: PeruseJobStatus = PeruseJobStatus.Pending;

  setPeruseJobData(data: Partial<PeruseJob<T>>) {
    Object.assign(this, data);
    return this;
  }

  static fromResponse(
    response: PeruseJobResponse,
    status: PeruseJobStatus,
  ): PeruseJob<any> {
    return new PeruseJob({
      jobId: response.jobId,
      jobType: response.jobType,
      jobStatus: status,
    });
  }
}
