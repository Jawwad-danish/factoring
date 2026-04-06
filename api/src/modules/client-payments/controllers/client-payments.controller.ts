import { Criteria, PageResult, QueryCriteria } from '@core/data';
import {
  ApiIdentityParam,
  ApiPaginatedResponse,
  ApiQueryCriteria,
} from '@core/web';
import { ClientPayment } from '@fs-bobtail/factoring/data';
import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  UseInterceptors,
} from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse } from '@nestjs/swagger';
import { ClientPaymentService } from '../services';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('/clients/:clientId/payments/')
export class ClientPaymentsController {
  constructor(private readonly clientPaymentsService: ClientPaymentService) {}

  @Get()
  @HttpCode(200)
  @ApiPaginatedResponse(ClientPayment, 'Client payments fetched successfully')
  @ApiQueryCriteria()
  async findAll(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Criteria({
      parseFilterValues: true,
    })
    criteria: QueryCriteria,
  ): Promise<PageResult<ClientPayment>> {
    return this.clientPaymentsService.findAll(clientId, criteria);
  }

  @Get(':paymentId')
  @HttpCode(200)
  @ApiOkResponse({ description: 'Client payment found successfully' })
  @ApiIdentityParam()
  @ApiNotFoundResponse({
    description: 'Client payment was not found',
  })
  async findOne(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
  ): Promise<ClientPayment> {
    return await this.clientPaymentsService.findOne(clientId, paymentId);
  }
}
