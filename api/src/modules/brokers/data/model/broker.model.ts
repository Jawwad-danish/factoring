import { AuditBaseModel } from '@core/data';
import { TagDefinition } from '@fs-bobtail/factoring/data';
import { Expose } from 'class-transformer';
import { IsArray } from 'class-validator';
import { BrokerRating } from '../../lib/types';
import { BrokerAddress } from './broker-address.model';
import { BrokerContact } from './broker-contacts.model';
import { BrokerEmail } from './broker-email.model';
import { BrokerFactoringConfig } from './broker-factoring-config.model';
import { BrokerFactoringStats } from './broker-factoring-stats.model';

export enum AuthorityStatus {
  Active = 'Active',
  Inactive = 'Inactive',
}

export enum BrokerStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Sandbox = 'Sandbox',
}

export class Broker extends AuditBaseModel<Broker> {
  @Expose()
  id: string;

  @Expose()
  legalName: string;

  @Expose()
  phone: string;

  @Expose()
  rating: BrokerRating;

  @Expose()
  externalRating: BrokerRating;

  @Expose()
  status: BrokerStatus;

  @Expose()
  authorityStatus: AuthorityStatus;

  @Expose()
  @IsArray()
  tags: TagDefinition[] = [];

  @Expose()
  @IsArray()
  emails: BrokerEmail[] = [];

  @Expose()
  @IsArray()
  addresses: BrokerAddress[];

  @Expose()
  @IsArray()
  contacts: BrokerContact[];

  @Expose()
  displayRating(): string {
    return this.rating.toString() === BrokerRating.NoRating
      ? this.externalRating.toString()
      : this.rating.toString();
  }

  @Expose()
  mc: string;

  @Expose()
  dot: string;

  @Expose()
  portalUrl: string;

  @Expose()
  doingBusinessAs: string;

  @Expose()
  authorityDate: Date;

  @Expose()
  factoringStats: BrokerFactoringStats;

  @Expose()
  factoringConfig: BrokerFactoringConfig;
}
