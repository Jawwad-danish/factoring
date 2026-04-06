import { Identity } from '@core/data';
import { ApiIdentityParam } from '@core/web';
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import {
  BrokerPayment,
  BrokerPaymentsQuery,
  CreateBrokerPaymentRequest,
  DeleteBrokerPaymentRequest,
  UpdateBrokerPaymentRequest,
} from '../data';
import { BrokerPaymentService } from '../services';
import { RequiredPermissions } from '@module-auth';
import { Permissions } from '@module-common';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('broker-payments')
export class BrokerPaymentController {
  constructor(private readonly brokerPaymentService: BrokerPaymentService) {}

  @Post()
  @HttpCode(201)
  @RequiredPermissions([Permissions.CreateBrokerPayment])
  @ApiCreatedResponse({
    description: 'Broker payment was created successfully',
  })
  @ApiBadRequestResponse({
    description: 'Create broker payment payload validation failed',
  })
  async create(
    @Body() payload: CreateBrokerPaymentRequest,
  ): Promise<BrokerPayment> {
    return this.brokerPaymentService.create(payload);
  }

  @Patch(':id')
  @HttpCode(200)
  @RequiredPermissions([Permissions.UpdateBrokerPayment])
  @ApiIdentityParam()
  @ApiOkResponse({
    description: 'Broker payment was updated successfully',
  })
  @ApiBadRequestResponse({
    description: 'Update broker payment payload validation failed',
  })
  async update(
    @Param() identity: Identity,
    @Body() payload: UpdateBrokerPaymentRequest,
  ): Promise<BrokerPayment> {
    return this.brokerPaymentService.update(identity.id, payload);
  }

  @Delete(':id')
  @HttpCode(200)
  @RequiredPermissions([Permissions.DeleteBrokerPayment])
  @ApiIdentityParam()
  @ApiOkResponse({
    description: 'Broker payment was deleted successfully',
  })
  async delete(
    @Param() identity: Identity,
    @Body() payload: DeleteBrokerPaymentRequest,
  ): Promise<BrokerPayment> {
    return this.brokerPaymentService.delete(identity.id, payload);
  }

  @Get()
  @HttpCode(200)
  @RequiredPermissions([Permissions.ReadBrokerPayment])
  @ApiOkResponse({
    description: 'Broker payments fetched successfully',
    type: [BrokerPayment],
  })
  async getAll(@Query() query: BrokerPaymentsQuery): Promise<BrokerPayment[]> {
    return this.brokerPaymentService.findAllByInvoiceId(query);
  }

  @Post('non-factored')
  @HttpCode(201)
  @RequiredPermissions([Permissions.CreateBrokerPaymentNonFactored])
  @ApiCreatedResponse({
    description: 'Broker payment was created successfully',
  })
  @ApiBadRequestResponse({
    description: 'Create broker payment payload validation failed',
  })
  async createNonFactored(
    @Body() payload: CreateBrokerPaymentRequest,
  ): Promise<BrokerPayment> {
    return this.brokerPaymentService.createNonFactored(payload);
  }
}
