import { User } from '@core/data';
import { EmployeeRole } from '@module-persistence/entities';
import { Expose } from 'class-transformer';

export class Employee extends User {
  @Expose()
  role: EmployeeRole | null;

  @Expose()
  extension: string | null;
}
