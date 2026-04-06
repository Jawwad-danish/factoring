import { BaseModel } from '@core/data';
import { Expose } from 'class-transformer';
import { IsString, IsUUID } from 'class-validator';

export class FactoringCompany extends BaseModel<FactoringCompany> {
  @IsUUID()
  @Expose()
  id: string;

  @IsString()
  @Expose()
  name: string;
}
