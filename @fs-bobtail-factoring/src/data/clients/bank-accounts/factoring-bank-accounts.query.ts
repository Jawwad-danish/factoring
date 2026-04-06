import { Expose } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { TransformToBoolean } from '../../../validators';

export class FactoringBankAccountsQuery {
  @IsOptional()
  @Expose()
  @IsBoolean()
  @TransformToBoolean()
  includeSensitive?: boolean;
}
