import { IsEnum, IsString } from 'class-validator';
import { BaseModel } from '../common';
import { Expose } from 'class-transformer';

export enum SortingOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class SortCriteria extends BaseModel<SortCriteria> {
  @Expose()
  @IsString()
  name: string;

  @Expose()
  @IsEnum(SortingOrder)
  order: SortingOrder;
}
