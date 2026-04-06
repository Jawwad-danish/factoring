import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDateString, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { BaseModel } from '.';

export class User extends BaseModel<User> {
  @IsUUID()
  @Expose()
  @ApiProperty({
    title: 'User ID',
    description: 'The ID of the user',
    format: 'uuid',
  })
  id: string;

  @IsDateString()
  @Expose()
  @ApiProperty({
    title: 'Created at',
    description: 'When this entry was created',
  })
  createdAt: Date;

  @IsDateString()
  @Expose()
  @ApiProperty({
    title: 'Updated at',
    description: 'When was this entry last updated',
  })
  updatedAt: Date;

  @IsString()
  @Expose()
  @ApiProperty({
    title: 'User external ID',
    description: 'ID used in external authentication services',
  })
  externalId: string | null;

  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty({
    title: 'User email',
    description: 'The email address of the user',
  })
  email: string;

  @IsString()
  @Expose()
  @ApiProperty({
    title: 'User first name',
    description: 'The first name of the user',
  })
  firstName: string | null;

  @IsString()
  @Expose()
  @ApiProperty({
    title: 'User last name',
    description: 'The last name of the user',
  })
  lastName: string | null;
}
