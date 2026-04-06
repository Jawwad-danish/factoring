import { BaseModel } from '@core/data';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEmail } from 'class-validator';

export class UpdateUserRequest extends BaseModel<UpdateUserRequest> {
  @Expose()
  @IsEmail()
  @ApiProperty({
    title: 'User Email',
    description: 'The email of the User',
    required: true,
  })
  email: string;
}
