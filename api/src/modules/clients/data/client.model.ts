import { AuditBaseModel } from '@core/data';
import { ClientBankAccount, TagDefinition } from '@fs-bobtail/factoring/data';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import Big from 'big.js';
import { Expose, Type } from 'class-transformer';
import { TransformFromBig } from '../../../core';
import { ClientContact, ClientContactType } from './client-contact.model';
import { ClientDocument } from './client-document.model';
import { ClientFactoringConfig } from './client-factoring-config.model';
import { CorporationType } from './web';

export enum AuthorityState {
  Active = 'Active',
  Inactive = 'Inactive',
}

export enum InsuranceStatus {
  Active = 'Active',
  Inactive = 'Inactive',
}

export class ChargebackReserve extends AuditBaseModel<ChargebackReserve> {
  @Expose()
  @TransformFromBig()
  @ApiProperty({
    title: 'Chargeback amount',
    description: 'Chargeback amount',
  })
  amount: Big;

  @Expose()
  @ApiProperty({
    title: 'Chargeback creation date',
    description: 'Chargeback creation date',
  })
  createdAt: Date;
}

export class Client extends AuditBaseModel<Client> {
  @Expose()
  @ApiProperty({
    title: 'Client ID',
    description: 'The client ID',
  })
  id: string;

  @Expose()
  @ApiProperty({
    title: 'Client name',
    description: 'The client name',
  })
  name: string;

  @Expose()
  @ApiProperty({
    title: 'Client short name',
    description: 'The client short name',
  })
  shortName: string;

  @Expose()
  @ApiProperty({
    title: 'Client MC',
    description: 'The client MC',
  })
  mc: string;

  @Expose()
  @ApiProperty({
    title: 'Client DOT',
    description: 'The client DOT',
  })
  dot: string;

  @Expose()
  @ApiProperty({
    title: 'Authority Date',
    description: 'The client authority date',
  })
  authorityDate: string;

  @Expose()
  @ApiProperty({
    title: 'Client EIN',
    description: 'The client EIN',
  })
  ein: string;

  @Expose()
  @ApiProperty({
    title: 'last login',
    description: 'The client last login date',
  })
  lastLogin: Date;

  @Expose()
  @ApiProperty({
    enum: CorporationType,
    enumName: 'CorporationType',
  })
  corporationType: CorporationType | null;

  @Expose()
  @ApiProperty({
    title: 'Client Email',
    description: 'The client email',
  })
  email: string;

  @Expose()
  @ApiProperty({
    title: 'Client doing business as',
    description: 'The doing business as field',
  })
  doingBusinessAs: string;

  @Expose()
  @ApiProperty({
    title: 'Client account executive phone number',
    description: 'The client account executive phone number',
  })
  accountExecutivePhoneNumber: string;

  @Expose()
  @ApiProperty({
    title: 'Client authority state',
    description: 'The client authority state',
    enum: AuthorityState,
  })
  commonAuthorityStatus: AuthorityState;

  @Expose()
  @ApiProperty({
    title: 'Client insurance status',
    description: 'The client insurance status',
    enum: InsuranceStatus,
  })
  insuranceStatus: InsuranceStatus;

  @Expose()
  @ApiProperty({
    title: 'Client documents',
    description: 'The client documents',
    type: [ClientDocument],
  })
  documents: ClientDocument[];

  @Expose()
  @ApiProperty({
    title: 'Tags',
    description:
      'The client tags that represent additional information, metadata',
    type: [TagDefinition],
  })
  tags: TagDefinition[];

  @Expose()
  @ApiProperty({
    title: 'Factoring config',
    description: 'The client factoring config',
  })
  factoringConfig: ClientFactoringConfig;

  @ApiProperty({
    title: 'Bank accounts',
    description: 'The client bank accounts',
  })
  bankAccounts?: ClientBankAccount[];

  @Expose()
  @ApiProperty({
    title: 'Client contacts',
    description: 'The client contacts',
  })
  @Type(() => ClientContact)
  clientContacts?: ClientContact[];

  @Expose()
  @ApiProperty({
    title: 'Languages',
    description: 'The client languages',
  })
  languages?: string[];

  @Expose()
  @TransformFromBig({ decimals: 2 })
  @ApiProperty({
    title: 'Dilution rate',
    description: 'The client dilution rate',
  })
  dilutionRate?: Big;

  @Expose()
  @Type(() => ChargebackReserve)
  @ApiPropertyOptional({
    title: 'Chargebacks',
    description: 'List of client chargebacks (usually 7 days)',
  })
  chargebacks?: ChargebackReserve[];

  getPrimaryContact(): ClientContact | undefined {
    return this.clientContacts?.find((c) => c.primary);
  }

  getOwnerContact(): ClientContact | undefined {
    return this.clientContacts?.find((c) => c.type === ClientContactType.OWNER);
  }

  getBusinessContact(): ClientContact | undefined {
    return this.clientContacts?.find(
      (c) => c.type === ClientContactType.BUSINESS,
    );
  }
}

export class Pagination {
  @Expose()
  totalPages: number;

  @Expose()
  page: number;

  @Expose()
  itemsPerPage: number;

  @Expose()
  totalItems: number;
}
