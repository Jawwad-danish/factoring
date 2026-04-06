import { V1AwareBaseModel } from '@core/data';
import { VerificationStatus } from '@module-persistence/entities';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsIn, IsNotEmpty, IsString } from 'class-validator';

export enum ContactType {
  Email = 'email',
  Phone = 'phone',
}
export class VerifyInvoiceRequest extends V1AwareBaseModel<VerifyInvoiceRequest> {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    title: 'Verification contact',
    description:
      'The person contacted to set the appropiate verification status',
    required: true,
  })
  contactPerson: string;

  @IsEnum(ContactType)
  @ApiProperty({
    title: 'Verification contact type',
    description: 'The type of communication used to contact the person',
    enum: ContactType,
    required: true,
  })
  contactType: ContactType;

  @IsIn([
    VerificationStatus.Verified,
    VerificationStatus.Bypassed,
    VerificationStatus.Failed,
    VerificationStatus.InProgress,
  ])
  @ApiProperty({
    title: 'Verification status',
    description:
      'The status of the invoice after talking with the contact person',
    enum: VerificationStatus,
  })
  status: VerificationStatus;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    title: 'Verification notes',
    description: 'The notes for marking an invoice as verified',
  })
  notes: string;
}
