import { V1AwareBaseModel } from '@core/data';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateFirebaseTokenRequest extends V1AwareBaseModel<CreateFirebaseTokenRequest> {
  @Expose()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    title: 'Firebase Token',
    description: "The user's device token of firebase cloud messaging service",
  })
  firebaseDeviceToken: string;
}
