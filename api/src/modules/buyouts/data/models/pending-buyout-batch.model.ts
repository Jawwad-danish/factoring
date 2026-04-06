import { BaseModel } from '@core/data';
import { TransformFromBig } from '@core/decorators';
import { PendingBuyout } from '@fs-bobtail/factoring/data';
import Big from 'big.js';
import { Expose, Type } from 'class-transformer';
import { IsArray, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { FactoringCompany } from './factoring-company.model';

export class PendingBuyoutBatch extends BaseModel<PendingBuyoutBatch> {
  @IsUUID()
  @Expose()
  id: string;

  @ValidateNested()
  @Expose()
  @Type(() => FactoringCompany)
  factoringCompany: FactoringCompany;

  @TransformFromBig()
  @Type(() => String)
  @Expose()
  clientPayableFee: Big = Big(0);

  @TransformFromBig()
  @Type(() => String)
  @Expose()
  bobtailPayableFee: Big = Big(0);

  @IsOptional()
  @IsArray()
  @ValidateNested()
  @Type(() => PendingBuyout)
  @Expose()
  pendingBuyouts: PendingBuyout[] = [];
}
