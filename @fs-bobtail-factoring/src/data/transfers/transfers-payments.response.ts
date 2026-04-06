import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsOptional } from "class-validator";

export class TransfersPaymentsResponse {
  @Expose()
  @ApiProperty({
    title: 'Client payment id',
    description: 'ID of the client payment',
    required: true,
    format: 'uuid',
  })
  id!: string;

  @Expose()
  @ApiProperty({
    title: 'Transfers id',
    description: 'Transfer id from transfers service',
    required: true,
  })
  transfersId!: string;

  @Expose()
  @ApiProperty({
    title: 'Amount',
    description: 'Amount of the transfer',
    required: true,
  })
  amount!: number;

  @Expose()
  @ApiProperty({
    title: 'Counterparty name - client name',
    description: 'Name of the counterparty - client name',
    required: true,
  })
  counterpartyName!: string;

  @Expose()
  @ApiProperty({
    title: 'Transfer type',
    description: 'Type of the transfer',
    required: true,
  })
  transferType!: string;

  @Expose()
  @ApiProperty({
    title: 'Status',
    description: 'Status of the transfer',
    required: true,
  })
  status!: string;

  @Expose()
  @IsOptional()
  @ApiPropertyOptional({
    title: 'Failure reason',
    description: 'Failure reason of the transfer',
    required: false,
  })
  failureReason!: string;

  @Expose()
  @ApiProperty({
    title: 'Payment date',
    description: 'Date of the payment',
    required: true,
  })
  paymentDate!: Date;

  @Expose()
  @ApiProperty({
    title: 'Receiving bank account name',
    description: 'Receiving bank account name of the transfer',
    required: true,
  })
  receivingAccount!: string;

  @Expose()
  @ApiProperty({
    title: 'Last four digits',
    description: 'Last four digits of the bank account',
    required: true,
  })
  lastFourDigits!: string;

  @Expose()
  @ApiProperty({
    title: 'Bank account id',
    description: 'Bank account id of the transfer',
    required: true,
  })
  bankAccountId!: string;

  @Expose()
  @IsOptional()
  @ApiPropertyOptional({
    title: 'Counterparty bank name',
    description: 'Name of the counterparty bank',
    required: false,
  })
  counterpartyBankName?: string;
}

export class ListTransfersPaymentsResponse {
  @Expose()
  @ApiProperty({
    title: 'Items',
    description: 'List of transfers payments',
    required: true,
  })
  items!: TransfersPaymentsResponse[];

  @Expose()
  @ApiProperty({
    title: 'Next cursor',
    description: 'Cursor for the next page of results',
    required: false,
  })
  nextCursor?: string;
}