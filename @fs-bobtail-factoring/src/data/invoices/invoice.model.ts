import { ApiProperty } from '@nestjs/swagger';
import Big from 'big.js';
import { Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import {
  TransformFromBig,
  TransformGetterFromBig as TransformMethodFromBig,
  TransformToBig,
} from '../../validators';
import { AuditBaseModel } from '../common';
import { Reserve } from '../reserves';
import { ClientBrokerAssignmentStatus } from '../client-broker-assignments/client-broker-assignment-status';
import { totalAmount } from './amounts';
import { ActivityLog } from './activity-log.model';
import { ApprovedLoad } from './approved-load.model';
import { BrokerPaymentStatus } from './broker-payment-status.enum';
import { ClientPaymentStatus } from './client-payment-status.enum';
import { InvoiceBuyout } from './invoice-buyout.model';
import { InvoiceDocument } from './invoice-document.model';
import { InvoiceStatus } from './invoice-status.enum';
import { VerificationStatus } from './verification-status.enum';
import { TagDefinition } from '../tag-definitions';

export class Invoice extends AuditBaseModel<Invoice> {
  @IsUUID()
  @Expose()
  @ApiProperty({
    title: 'Invoice ID',
    description: 'The invoice ID',
    format: 'uuid',
  })
  id!: string;

  @IsUUID()
  @IsNotEmpty()
  @Expose()
  @ApiProperty({
    title: 'Client ID',
    description: 'The ID of a Client',
    format: 'uuid',
  })
  clientId!: string;

  @IsUUID()
  @IsNotEmpty()
  @Expose()
  @ApiProperty({
    title: 'Broker ID',
    description: 'The ID of a Broker',
    format: 'uuid',
    nullable: true,
  })
  brokerId?: string | null;

  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty({
    title: 'Invoice display ID',
    description: 'The display ID of the invoice',
  })
  displayId!: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty({
    title: 'Invoice load number',
    description: 'The ID of a Broker',
  })
  loadNumber!: string;

  @IsNotEmpty()
  @TransformToBig()
  @TransformFromBig()
  @Type(() => String)
  @Expose()
  @ApiProperty({
    title: 'Invoice line haul rate',
    description:
      'This is the value of the invoice i.e. the agreed amount between the Client and Broker.',
    type: 'string',
    pattern: '[0-9]+',
    example: '1000',
  })
  lineHaulRate!: Big;

  @IsOptional()
  @TransformToBig()
  @TransformFromBig()
  @Type(() => String)
  @ApiProperty({
    title: 'Invoice lumper',
    description: 'The amount paid by the Client to unload heavy material.',
    type: 'string',
    pattern: '[0-9]+',
    example: '100',
  })
  lumper: Big = Big(0);

  @IsOptional()
  @TransformToBig()
  @TransformFromBig()
  @Type(() => String)
  @ApiProperty({
    title: 'Invoice value',
    description: 'The invoice total value',
    type: 'string',
    pattern: '[0-9]+',
    example: '1000',
  })
  value: Big = Big(0);

  @IsOptional()
  @TransformToBig()
  @TransformFromBig()
  @Type(() => String)
  @ApiProperty({
    title: 'Invoice detention',
    description:
      'Any fee which the Client has to pay while moving the load and is not accounted for in the Line Haul Rate e.g. waiting fee.',
    type: 'string',
    pattern: '[0-9]+',
    example: '100',
  })
  detention: Big = Big(0);

  @IsOptional()
  @TransformToBig()
  @TransformFromBig()
  @Type(() => String)
  @ApiProperty({
    title: 'Invoice advance',
    description:
      'Any amount which the Client has taken in advance from the Broker from the agreed Invoice amount before moving a load.',
    type: 'string',
    pattern: '[0-9]+',
    example: '100',
  })
  advance: Big = Big(0);

  @TransformFromBig()
  @Type(() => String)
  @Expose()
  @ApiProperty({
    title: 'Invoice approved factor fee',
    description: 'The invoice factor fee',
    type: 'string',
    pattern: '[0-9]+',
    example: '2.2',
  })
  approvedFactorFee: Big = Big(0);

  @TransformFromBig()
  @Type(() => String)
  @Expose()
  @ApiProperty({
    title: 'Invoice approved factor fee percentage',
    description: 'The invoice factor fee percentage',
    type: 'string',
    pattern: '^d+((.)|(.d{0,1})?)$',
    example: '2.25',
  })
  approvedFactorFeePercentage: Big = Big(0);

  @TransformToBig()
  @TransformFromBig()
  @Type(() => String)
  @Expose()
  @ApiProperty({
    title: 'Invoice reserve fee',
    description: 'The actual amount of the invoice deposited in the Reserve',
    type: 'string',
    pattern: '[0-9]+',
    example: '2.2',
  })
  reserveFee: Big = Big(0);

  @TransformToBig()
  @TransformFromBig()
  @Type(() => String)
  @Expose()
  @ApiProperty({
    title: 'Invoice reserve rate percentage',
    description:
      'The invoice reserve rate percentage used to calculate the reserve fee at the moment of purchase',
    type: 'string',
    pattern: '^d+((.)|(.d{0,1})?)$',
    example: '2.25',
  })
  reserveRatePercentage: Big = Big(0);

  @TransformToBig()
  @Type(() => String)
  @Expose()
  @ApiProperty({
    title: 'Invoice A/R Amount',
    description:
      'The amount of the invoice at the time Bobtail paid the Client for purchasing the invoice.  The A/R amount is a fixed amount after the Client is paid for the invoice.',
    type: 'number',
    pattern: '[0-9]+',
    example: '1000',
  })
  accountsReceivableValue: Big = Big(0);

  @IsOptional()
  @TransformToBig()
  @TransformFromBig()
  @Type(() => String)
  @ApiProperty({
    title: 'Invoice deduction',
    description: 'The invoice deduction value',
    type: 'number',
    pattern: '[0-9]+',
    example: '100',
  })
  deduction: Big = Big(0);

  @IsEnum(InvoiceStatus)
  @Expose()
  @ApiProperty({
    title: 'Invoice status',
    description: 'The invoice purchase status',
    enum: InvoiceStatus,
  })
  status!: InvoiceStatus;

  @IsOptional()
  @TransformToBig()
  @TransformFromBig()
  @Type(() => String)
  @ApiProperty({
    title: 'Invoice client payment transfer fee',
    description: 'The invoice client payment transfer fee',
  })
  clientPaymentTransferFee: Big = Big(0);

  @IsOptional()
  @IsString()
  @Expose()
  @Type(() => String)
  @ApiProperty({
    title: 'Invoice client payment bank account last digits',
    description: 'The invoice client payment bank account last digits',
  })
  clientPaymentBankAccountLastDigits!: string;

  @IsOptional()
  @IsDateString()
  @Expose()
  @ApiProperty({
    title: 'Invoice client payment date',
    description: 'The invoice client payment date',
  })
  clientPaymentTransferDate!: Date;

  @IsEnum(ClientPaymentStatus)
  @Expose()
  @ApiProperty({
    title: 'Invoice client payment status',
    description: 'The invoice last client payment status',
    enum: ClientPaymentStatus,
  })
  clientPaymentStatus!: ClientPaymentStatus;

  @IsEnum(BrokerPaymentStatus)
  @Expose()
  @ApiProperty({
    title: 'Invoice broker payment status',
    description: 'The invoice broker payment status',
    enum: BrokerPaymentStatus,
  })
  brokerPaymentStatus!: BrokerPaymentStatus;

  @IsEnum(VerificationStatus)
  @Expose()
  @ApiProperty({
    title: 'Invoice verification status',
    description: 'The invoice verification status',
    enum: InvoiceStatus,
  })
  verificationStatus!: VerificationStatus;

  @IsEnum(ClientBrokerAssignmentStatus)
  @Expose()
  @ApiProperty({
    title: 'Invoice client broker assignment status',
    description: 'The invoice client broker assignment status',
    enum: ClientBrokerAssignmentStatus,
  })
  clientBrokerAssignmentStatus!: ClientBrokerAssignmentStatus;

  @IsDateString()
  @Expose()
  @ApiProperty({
    title: 'Invoice client broker assignment NOA sent date',
    description: 'Invoice client broker assignment NOA document sent date',
  })
  clientBrokerAssignmentNoaSentDate!: Date;

  @IsOptional()
  @IsDateString()
  @Expose()
  @ApiProperty({
    title: 'Invoice rejected date',
    description: 'The invoice rejected date',
  })
  rejectedDate?: Date;

  @IsOptional()
  @IsDateString()
  @Expose()
  @ApiProperty({
    title: 'Invoice purchased date',
    description: 'The invoice purchased date',
  })
  purchasedDate?: Date;

  @IsOptional()
  @IsDateString()
  @Expose()
  @ApiProperty({
    title: 'Invoice broker payment date',
    description: 'When the invoice was marked as paid by the broker',
  })
  paymentDate?: Date;

  @IsBoolean()
  @Expose()
  @ApiProperty({
    title: 'Invoice expedited',
    description: 'The invoice expedited',
  })
  expedited!: boolean;

  @IsOptional()
  @IsDateString()
  @Expose()
  @ApiProperty({
    title: 'Invoice payment issue date',
    description: 'The invoice payment issue date',
  })
  paymentIssueDate!: Date;

  @IsOptional()
  @IsString()
  @ApiProperty({
    title: 'Invoice notes',
    description: 'Invoice notes for the processing team',
  })
  note!: null | string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    title: 'Invoice memo',
    description: 'Invoice internal client memo',
  })
  memo!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  @ApiProperty({
    title: 'Client',
    description: 'The client of this invoice',
  })
  client?: any;

  @IsOptional()
  @IsArray()
  @ValidateNested()
  @Type(() => InvoiceDocument)
  @Expose()
  @ApiProperty({
    title: 'Invoice documents',
    description: 'The documents generated and uploaded for this invoice',
  })
  documents: InvoiceDocument[] = [];

  @IsOptional()
  @IsArray()
  @ValidateNested()
  @Type(() => Reserve)
  @Expose()
  @ApiProperty({
    title: 'Invoice reserves',
    description: 'The reserves for this invoice',
  })
  reserves: Reserve[] = [];

  @IsOptional()
  @IsArray()
  @ValidateNested()
  @Type(() => ActivityLog)
  @Expose()
  @ApiProperty({
    title: 'Invoice activity log',
    description: 'The actions that happened on this invoice. The invoice story.',
    type: [ActivityLog],
  })
  activities: ActivityLog[] = [];

  @IsOptional()
  @IsArray()
  @ValidateNested()
  @Type(() => Object)
  @Expose()
  @ApiProperty({
    title: 'Broker payments',
    description: 'The broker payments of this invoice',
    type: [Object],
  })
  brokerPayments: any[] = [];

  @IsOptional()
  @IsArray()
  @ValidateNested()
  @Type(() => TagDefinition)
  @Expose()
  @ApiProperty({
    title: 'Tags',
    description: 'The invoice tags that represent additional information, metadata',
    type: [TagDefinition],
  })
  tags: TagDefinition[] = [];

  @IsOptional()
  @ValidateNested()
  @Type(() => InvoiceBuyout)
  @Expose()
  @ApiProperty({
    title: 'Invoice buyout',
    description: 'The invoice buyout',
  })
  buyout?: InvoiceBuyout;

  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  broker!: any | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApprovedLoad)
  @Expose()
  @ApiProperty({
    title: 'Approved loads',
    description: 'The last 3 approved invoices for this broker',
    type: [ApprovedLoad],
    nullable: true,
  })
  approvedLoads?: ApprovedLoad[];

  @TransformMethodFromBig()
  @Expose()
  @Type(() => String)
  totalAmount(): Big {
    return totalAmount(this);
  }
}
