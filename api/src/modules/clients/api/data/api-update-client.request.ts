import { BaseModel } from '@core/data';
import { Expose, Type } from 'class-transformer';

export class ApiUpdateClientRequest extends BaseModel<ApiUpdateClientRequest> {
  @Expose()
  name?: string;

  @Expose()
  shortName?: string;

  @Expose()
  mc?: string;

  @Expose()
  dot?: string;

  @Expose()
  ein?: string;

  @Expose()
  doingBusinessAs?: string;

  @Expose()
  corporationType?: string;

  @Expose()
  languages?: string[];

  @Expose()
  @Type(() => Date)
  authorityDate?: Date;
}
