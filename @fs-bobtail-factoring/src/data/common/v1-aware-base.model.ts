import { Expose } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { BaseModel } from './base.model';

export class V1AwareBaseModel<T> extends BaseModel<T> {
  @Expose({ name: '__v1Payload' })
  @IsOptional()
  v1Payload?: object;

  @Expose({ name: '__ingestThrough' })
  @IsOptional()
  ingestThrough?: boolean;
}
