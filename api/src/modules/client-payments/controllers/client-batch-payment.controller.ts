import { ClientBatchPayment } from '@fs-bobtail/factoring/data';
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  HttpCode,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { CreateClientBatchPaymentRequest } from '../data';
import { ClientBatchPaymentService } from '../services/client-batch-payments.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('client-batch-payment')
export class ClientBatchPaymentController {
  constructor(
    private readonly clientBatchPaymentService: ClientBatchPaymentService,
  ) {}
  @Post()
  @HttpCode(201)
  async create(
    @Body() createClientBatchPaymentRequest: CreateClientBatchPaymentRequest,
  ): Promise<ClientBatchPayment> {
    return this.clientBatchPaymentService.create(
      createClientBatchPaymentRequest,
    );
  }
}
