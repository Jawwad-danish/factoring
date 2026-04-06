import { IsEnum, IsOptional } from 'class-validator';
import { EmployeeRole } from '@module-persistence/entities';

export class EmployeeQuery {
  @IsEnum(EmployeeRole)
  @IsOptional()
  role?: EmployeeRole;
}
