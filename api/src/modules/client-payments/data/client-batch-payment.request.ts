import { BaseModel } from '@core/data';
import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

export class CreateClientBatchPaymentRequest extends BaseModel<CreateClientBatchPaymentRequest> {
  @IsString()
  @Expose()
  s3FileKey: string;

  @IsString()
  @Expose()
  bucketName: string;
}
