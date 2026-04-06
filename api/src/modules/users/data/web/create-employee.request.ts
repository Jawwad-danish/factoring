import { V1AwareBaseModel } from '@core/data';
import { IsEnum, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { EmployeeRole } from '@module-persistence/entities';
import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmployeeRequest extends V1AwareBaseModel<CreateEmployeeRequest> {
  @IsNotEmpty()
  @IsEnum(EmployeeRole)
  @Expose()
  @ApiProperty({
    title: 'Role',
    description: 'The role of the employee',
    required: true,
    enum: EmployeeRole,
  })
  role: EmployeeRole;

  @IsString()
  @IsOptional()
  @Expose()
  @ApiProperty({
    title: 'Extension',
    description: 'The extension of the employee',
    required: false,
  })
  extension?: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty({
    title: 'First Name',
    description: 'The first name of the employee',
    required: true,
  })
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty({
    title: 'Last Name',
    description: 'The last name of the employee',
    required: true,
  })
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty({
    title: 'Email',
    description: 'The email of the employee',
    required: true,
  })
  email: string;
}
