import { IsString, IsUUID } from 'class-validator';

export class AssignInvoiceActivityPathParam {
  @IsString()
  @IsUUID()
  invoiceId: string;

  @IsString()
  @IsUUID()
  activityId: string;
}
