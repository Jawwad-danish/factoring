import { Expose } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { BaseModel } from '@core/data';
import { FlaggedEntity } from '../../lib/types';

export class Flag extends BaseModel<Flag> {
  @IsUUID()
  @IsOptional()
  @Expose()
  id?: string;

  @IsString()
  name: string;

  @IsEnum(FlaggedEntity)
  @IsNotEmpty()
  @Expose()
  flaggedEntity: FlaggedEntity;
}
