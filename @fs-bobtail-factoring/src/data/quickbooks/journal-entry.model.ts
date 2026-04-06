import { ApiProperty } from '@nestjs/swagger';
import Big from 'big.js';
import { Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { TransformFromBig, TransformToBig } from '../../validators';
import { AuditBaseModel } from '../common/audit-base.model';
import { QuickbooksAccount } from './quickbooks-account.model';
import {
  QuickbooksJournalEntryStatus,
  QuickbooksJournalEntryType,
  QuickbooksJournalPostingType,
} from './types';

export class QuickbooksJournalEntryLine extends AuditBaseModel<QuickbooksJournalEntryLine> {
  @IsUUID()
  @Expose()
  @ApiProperty({
    title: 'Journal Entry Line ID',
    description: 'The journal entry line ID',
    format: 'uuid',
  })
  id!: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => QuickbooksAccount)
  @Expose()
  @ApiProperty({
    title: 'Account',
    description: 'The quickbooks account for this line',
    type: () => QuickbooksAccount,
  })
  account!: QuickbooksAccount;

  @IsEnum(QuickbooksJournalPostingType)
  @IsNotEmpty()
  @Expose()
  @ApiProperty({
    title: 'Posting Type',
    description: 'The posting type (debit or credit)',
    enum: QuickbooksJournalPostingType,
  })
  type!: QuickbooksJournalPostingType;

  @IsNotEmpty()
  @TransformToBig()
  @TransformFromBig()
  @Type(() => String)
  @Expose()
  @ApiProperty({
    title: 'Amount',
    description: 'The line amount',
    type: 'string',
    pattern: '[0-9]+',
    example: '1000',
  })
  amount: Big;
}

export class QuickbooksJournalEntry extends AuditBaseModel<QuickbooksJournalEntry> {
  @IsUUID()
  @Expose()
  @ApiProperty({
    title: 'Journal Entry ID',
    description: 'The journal entry ID',
    format: 'uuid',
  })
  id!: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty({
    title: 'Document Name',
    description: 'The journal entry document name',
    type: 'string',
  })
  docName!: string;

  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  @Expose()
  @ApiProperty({
    title: 'Synced At',
    description: 'When the journal entry was synced to Quickbooks',
    type: 'string',
    nullable: true,
  })
  syncedAt?: Date;

  @IsEnum(QuickbooksJournalEntryType)
  @IsNotEmpty()
  @Expose()
  @ApiProperty({
    title: 'Journal Entry Type',
    description: 'The journal entry type',
    enum: QuickbooksJournalEntryType,
  })
  type!: QuickbooksJournalEntryType;

  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty({
    title: 'Business Day',
    description: 'The business day for this journal entry',
    type: 'string',
  })
  businessDay!: string;

  @IsEnum(QuickbooksJournalEntryStatus)
  @IsNotEmpty()
  @Expose()
  @ApiProperty({
    title: 'Status',
    description: 'The journal entry status',
    enum: QuickbooksJournalEntryStatus,
  })
  status!: QuickbooksJournalEntryStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuickbooksJournalEntryLine)
  @Expose()
  @ApiProperty({
    title: 'Journal Entry Lines',
    description: 'The journal entry lines',
    type: [QuickbooksJournalEntryLine],
  })
  lines!: QuickbooksJournalEntryLine[];
}
