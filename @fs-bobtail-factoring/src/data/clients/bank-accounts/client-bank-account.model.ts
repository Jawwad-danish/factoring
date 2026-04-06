import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { BaseModel } from '../../common';
import { ModernTreasuryAccount } from './modern-treasury-account.model';
import { PlaidAccount } from './plaid-account.model';
import { AuditBaseModel } from '../../common/audit-base.model';

export enum ClientBankAccountStatus {
  Active = 'active',
  Archived = 'archived',
  Inactive = 'inactive',
}

export enum ProductName {
  Card = 'CARD',
  Factoring = 'FACTORING',
}

export class Product extends BaseModel<Product> {
  @Expose()
  @ApiProperty({ required: false })
  id?: string;

  @Expose()
  @ApiProperty({ enum: ProductName, enumName: 'ProductName' })
  name!: ProductName;
}

export class ClientBankAccount extends AuditBaseModel<ClientBankAccount> {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  name!: string;

  @Expose()
  @ApiProperty({
    enum: ClientBankAccountStatus,
    enumName: 'ClientBankAccountStatus',
  })
  status!: ClientBankAccountStatus;

  @Expose()
  @Type(() => PlaidAccount)
  @ApiProperty({ type: () => PlaidAccount })
  plaidAccount!: PlaidAccount;

  @Expose()
  @Type(() => ModernTreasuryAccount)
  @ApiProperty({ type: () => ModernTreasuryAccount })
  modernTreasuryAccount!: ModernTreasuryAccount;

  @Expose()
  @ApiProperty()
  wireRoutingNumber?: string;

  @Expose()
  @Type(() => Product)
  @ApiProperty({ type: Product, isArray: true })
  products?: Product[];

  @Expose()
  getRoutingNumber(): string | undefined {
    return this.plaidAccount?.routingNumber ??
      this.modernTreasuryAccount?.routingNumber ??
      undefined;
  }

  @Expose()
  getWireRoutingNumber(): string | undefined {
    return this.wireRoutingNumber ??
      this.plaidAccount?.wireRoutingNumber ??
      this.modernTreasuryAccount?.wireRoutingNumber ??
      undefined;
  }

  @Expose()
  getAccountNumber(): string | undefined {
    return this.plaidAccount?.accountNumber ??
      this.modernTreasuryAccount?.account ??
      undefined;
  }
}

export class ClientBankAccountMap {
  @Expose()
  @ApiProperty()
  clientId!: string;

  @Expose()
  @ApiProperty()
  @Type(() => ClientBankAccount)
  bankAccounts!: ClientBankAccount[];
}
