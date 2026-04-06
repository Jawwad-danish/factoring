import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from '../services';
import { CreateEmployeeRequest, EmployeeQuery, Employee } from '../data';
import { ApiOkResponse } from '@nestjs/swagger';
import { RequiredPermissions } from '@module-auth';
import { Permissions } from '@module-common';
import { Identity } from '@core/data';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('employees')
export class EmployeesController {
  constructor(private userService: UserService) {}

  @Get()
  @HttpCode(200)
  @ApiOkResponse({ type: Employee, isArray: true })
  async getEmployees(@Query() query: EmployeeQuery): Promise<Employee[]> {
    return await this.userService.getEmployees(query);
  }

  @Post()
  @HttpCode(200)
  @RequiredPermissions([Permissions.SuperUser])
  async createEmployee(
    @Body() payload: CreateEmployeeRequest,
  ): Promise<Employee> {
    return await this.userService.createEmployee(payload);
  }

  @Post(':id/send-reset-password-request')
  @HttpCode(204)
  @RequiredPermissions([Permissions.ResetEmployeePassword])
  async sendResetEmployeePasswordRequest(
    @Param() identity: Identity,
  ): Promise<void> {
    await this.userService.sendResetEmployeePasswordRequest(identity.id);
  }
}
