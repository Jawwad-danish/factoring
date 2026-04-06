import { TransformFromBig } from '@core/decorators';
import { AuditBaseModel } from '@core/data';
import {
  ClientFactoringStatus,
  LeadAttributionType,
} from '@module-persistence/entities';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import Big from 'big.js';
import { Exclude, Expose } from 'class-transformer';
import { ProcessingNotes } from '@module-processing-notes';
import { ClientFactoringRateHistory } from './client-factoring-rate-history.model';
import { ClientLimitHistory } from './client-limit-history.model';
import { ClientReserveRateHistory } from './client-reserve-rate-history.model';
import { ClientStatusHistory } from './client-status-history.model';
import { ClientSuccessTeam } from './client-success-team.model';
import { ClientPaymentPlanHistory } from './client-payment-plan-history.model';
import { ClientSalesRep } from './client-sales-rep.model';
import { ClientFactoringUnderwritingNotes } from './client-factoring-underwriting-notes.model';

@Exclude()
export class ClientFactoringConfig extends AuditBaseModel<ClientFactoringConfig> {
  @Expose()
  @TransformFromBig()
  @ApiProperty({
    title: 'Factoring percentage',
    description: 'The client factoring percentage used in invoices',
    type: 'string',
    pattern: '^d+((.)|(.d{0,1})?)$',
    example: '3.0',
  })
  factoringRatePercentage: Big;

  @Expose()
  @TransformFromBig()
  @ApiProperty({
    title: 'Reserve rate percentage',
    description: 'The client reserve rate percentage used in invoices',
    type: 'string',
    pattern: '^d+((.)|(.d{0,1})?)$',
    example: '3.0',
  })
  reserveRatePercentage: Big;

  @Expose()
  @TransformFromBig()
  @ApiProperty({
    title: 'Client limit',
    description: `Threshold for a client's invoice amount in aging`,
    type: 'string',
    pattern: '^d+((.)|(.d{0,1})?)$',
    example: '3000.0',
    nullable: true,
  })
  clientLimitAmount: null | Big;

  @Expose()
  @TransformFromBig()
  @ApiProperty({
    title: 'Verification percentage',
    description: 'The client verification percentage',
    type: 'string',
    pattern: '^d+((.)|(.d{0,1})?)$',
    example: '1.0',
  })
  verificationPercentage: Big;

  @Expose()
  @ApiProperty({
    title: 'Factoring status',
    description: 'The client factoring status',
    enum: ClientFactoringStatus,
  })
  status: ClientFactoringStatus;

  @Expose()
  @ApiProperty({
    title: 'VIP status',
    description: 'The client VIP status',
  })
  vip: boolean;

  @Expose()
  @ApiProperty({
    title: 'Requires Verification',
    description: 'The client requires verification status',
  })
  requiresVerification: boolean;

  @Expose()
  @ApiProperty({
    title: 'Client Success Team',
    description: 'The Client Success Team assignated to this client',
  })
  clientSuccessTeam: ClientSuccessTeam;

  @Expose()
  @ApiPropertyOptional({
    title: 'Client Sales Rep',
    description: 'The Client Sales Rep assignated to this client',
  })
  clientSalesRep: ClientSalesRep | null;

  @Expose()
  @ApiProperty({
    title: 'Expedite Transfer flag',
    description:
      'The clients wants invoices to be transfered through expedite or ach',
  })
  expediteTransferOnly: boolean;

  @Expose()
  @ApiProperty({
    title: 'Lead attribution',
    description: 'Lead attribution of client',
  })
  leadAttribution?: LeadAttributionType | null;

  @Expose()
  @ApiProperty({
    title: 'Done submitting invoices',
    description: 'The client is done submitting invoices status',
  })
  doneSubmittingInvoices: boolean;

  @Expose()
  @ApiProperty({
    title: 'Client accepted fee increase',
    description: 'The clients accept for the fee increase by Bobtail',
  })
  acceptedFeeIncrease: boolean;

  @Expose()
  @ApiProperty({
    title: 'Factoring rate history',
    description: 'The history of factoring rate changes applied to the client',
  })
  factoringRateHistory: ClientFactoringRateHistory[];

  @Expose()
  @ApiProperty({
    title: 'Reserve rate history',
    description: 'The history of reserve rate changes applied to the client',
  })
  reserveRateHistory: ClientReserveRateHistory[];

  @Expose()
  @ApiProperty({
    title: 'Reserve status history',
    description: 'The history of status changes applied to the client',
  })
  statusHistory: ClientStatusHistory[];

  @Expose()
  @ApiProperty({
    title: 'Client limit amount history',
    description: 'The history of client limit amount applied to the client',
  })
  clientLimitHistory: ClientLimitHistory[];

  @Expose()
  @ApiProperty({
    title: 'Underwriting notes',
    description: 'Underwriting notes related to this client',
  })
  underwritingNotes: ClientFactoringUnderwritingNotes[];

  @Expose()
  @ApiProperty({
    title: 'Client accepted fee increase',
    description: 'The clients accept for the fee increase by Bobtail',
  })
  ccInEmails: boolean;

  @Expose()
  @ApiProperty({
    title: 'Processing notes',
    description: 'Processing notes related to this client',
  })
  processingNotes: ProcessingNotes[] = [];

  @Expose()
  @ApiProperty({
    title: 'Payment plan',
    description: 'Payment plan related to this client',
  })
  paymentPlan: null | string;

  @Expose()
  @ApiProperty({
    title: 'Payment plan history',
    description: 'The history of payment plan changes applied to the client',
  })
  paymentPlanHistory: ClientPaymentPlanHistory[];

  // Insurance
  @Expose()
  @ApiProperty({
    title: 'Insurance Agency',
    description: 'The client insurance agency name',
  })
  insuranceAgency: string | null;

  @Expose()
  @ApiProperty({
    title: 'Insurance Company',
    description: 'The client insurance company name',
  })
  insuranceCompany: string | null;

  @Expose()
  @TransformFromBig()
  @ApiProperty({
    title: 'Insurance Monthly Payment Per Truck',
    description: 'The monthly insurance payment amount per truck',
    type: 'string',
    pattern: '^d+((.)|(.d{0,1})?)$',
  })
  insuranceMonthlyPaymentPerTruck: Big | null;

  @Expose()
  @ApiProperty({
    title: 'Insurance Renewal Date',
    description: 'The date when insurance needs to be renewed',
    type: 'string',
    format: 'date-time',
  })
  insuranceRenewalDate: Date | null;

  // Underwriting
  @Expose()
  @ApiProperty({
    title: 'OFAC Verified',
    description: 'Whether the client has been verified against OFAC',
  })
  ofacVerified: boolean;

  @Expose()
  @ApiProperty({
    title: 'Carrier 411 Alerts',
    description: 'Whether there are Carrier 411 alerts for this client',
  })
  carrier411Alerts: boolean;

  @Expose()
  @ApiProperty({
    title: 'Tax Guard Alerts',
    description: 'Whether there are Tax Guard alerts for this client',
  })
  taxGuardAlerts: boolean;

  // Fleet
  @Expose()
  @ApiProperty({
    title: 'Dry Van Trucks Amount',
    description: 'Number of dry van trucks in the fleet',
  })
  dryvanTrucksAmount: number;

  @Expose()
  @ApiProperty({
    title: 'Refrigerated Trucks Amount',
    description: 'Number of refrigerated trucks in the fleet',
  })
  refrigeratedTrucksAmount: number;

  @Expose()
  @ApiProperty({
    title: 'Flatbed Trucks Amount',
    description: 'Number of flatbed trucks in the fleet',
  })
  flatbedTrucksAmount: number;

  @Expose()
  @ApiProperty({
    title: 'Stepdeck Trucks Amount',
    description: 'Number of stepdeck trucks in the fleet',
  })
  stepdeckTrucksAmount: number;

  @Expose()
  @ApiProperty({
    title: 'Other Trucks Amount',
    description: 'Number of other types of trucks in the fleet',
  })
  otherTrucksAmount: number;

  @Expose()
  @ApiProperty({
    title: 'Leased Trucks Amount',
    description: 'Number of leased trucks in the fleet',
  })
  leasedTrucksAmount: number;

  @Expose()
  @ApiProperty({
    title: 'Total Trucks Amount',
    description: 'Total number of trucks in the fleet (calculated)',
  })
  totalTrucksAmount: number;
}
