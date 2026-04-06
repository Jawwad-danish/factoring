import { BaseModel } from '@core/data';
import { TransformFromBig, TransformToBig } from '@core/decorators';
import Big from 'big.js';
import { Expose, Type } from 'class-transformer';
import { IsArray, IsOptional, IsUUID, ValidateNested } from 'class-validator';

export class ClientAccountPayments extends BaseModel<ClientAccountPayments> {
  @IsUUID()
  @Expose()
  clientBankAccountId: string;
}
export class ClientAccountPaymentAttributions extends BaseModel<ClientAccountPaymentAttributions> {
  @IsUUID()
  @Expose()
  invoiceId: string;

  @TransformToBig()
  @TransformFromBig()
  @Type(() => String)
  amount: Big = Big(0);
}

export class ClientPaymentRequest extends BaseModel<ClientPaymentRequest> {
  @IsUUID()
  @Expose()
  id: string;

  @IsUUID()
  @Expose()
  clientId: string;

  @TransformToBig()
  @TransformFromBig()
  @Type(() => String)
  @Expose()
  amount: Big = Big(0);

  @IsOptional()
  @TransformToBig()
  @TransformFromBig()
  @Type(() => String)
  @Expose()
  transferFee: Big = Big(0);

  @IsArray()
  @ValidateNested()
  @Type(() => ClientAccountPayments)
  @Expose()
  clientAccountPayments: ClientAccountPayments[] = [];

  @IsArray()
  @ValidateNested()
  @Type(() => ClientAccountPaymentAttributions)
  @Expose()
  clientAccountPaymentAttributions: ClientAccountPaymentAttributions[] = [];
}
