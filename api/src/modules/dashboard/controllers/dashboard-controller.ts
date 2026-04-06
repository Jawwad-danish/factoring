import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  Param,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOkResponse, ApiParam } from '@nestjs/swagger';
import { NotificationsResponse } from '../data';
import { DashboardService } from '../services';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('/notifications/:clientId')
  @HttpCode(200)
  @ApiOkResponse({
    description: 'Dashboard notifications',
  })
  @ApiParam({ name: 'clientId', type: 'string', format: 'uuid' })
  async getNotifications(
    @Param('clientId') clientId: string,
  ): Promise<NotificationsResponse> {
    return this.service.getNotificationsData(clientId);
  }
}
