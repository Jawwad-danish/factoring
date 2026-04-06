import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { AuditBaseModel } from '../common/audit-base.model';

export class QuickbooksAccount extends AuditBaseModel<QuickbooksAccount> {
  @IsUUID()
  @Expose()
  @ApiProperty({
    title: 'Quickbooks account ID',
    description: 'The quickbooks account ID',
    format: 'uuid',
  })
  id!: string;

  @IsOptional()
  @IsString()
  @Expose()
  @ApiProperty({
    title: 'Account Name',
    description: 'Account name',
    type: 'string',
  })
  name!: string;
}
