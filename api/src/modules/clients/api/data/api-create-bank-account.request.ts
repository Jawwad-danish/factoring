import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { BaseModel } from '@core/data';

export enum ProductName {
  FACTORING = 'FACTORING',
  CARD = 'CARD',
}

export class PlaidAccount extends BaseModel<PlaidAccount> {
  @ApiProperty({ description: 'Bank name' })
  @IsString()
  bankName: string;

  @ApiProperty({ description: 'Bank account name' })
  @IsString()
  bankAccountName: string;

  @ApiProperty({ description: 'Plaid link session id' })
  @IsString()
  linkSessionId: string;

  @ApiProperty({ description: 'Plaid public token' })
  @IsString()
  publicToken: string;

  @ApiProperty({ description: 'Plaid verification status' })
  @IsString()
  @IsOptional()
  verificationStatus?: string;

  @ApiProperty({ description: 'Plaid account id' })
  @IsString()
  accountId: string;
}

export class CreateBankAccountRequest extends BaseModel<CreateBankAccountRequest> {
  @ApiProperty({ enum: ProductName, description: 'Product type' })
  @IsEnum(ProductName)
  product: ProductName;

  @ApiProperty({ description: 'Client Id' })
  @IsString()
  clientId: string;

  @ApiProperty({
    description: 'Plaid account details',
    type: () => PlaidAccount,
  })
  @ValidateNested()
  @Type(() => PlaidAccount)
  plaidAccount: PlaidAccount;

  @ApiProperty({ description: 'Create by user Id' })
  @Expose()
  createdBy?: string;
}
