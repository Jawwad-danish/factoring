import {
  Criteria,
  Identity,
  PageResult,
  PaginationResult,
  QueryCriteria,
} from '@core/data';
import { Arrays } from '@core/util';
import {
  ClientBatchPayment,
  CreatePaymentOrderRequest,
  ListTransfersPaymentsResponse,
  PaymentOrder,
} from '@fs-bobtail/factoring/data';
import { ClientBatchPaymentMapper } from '@module-client-payments';
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import {
  CompleteTransfer,
  InitiateDebitRegularTransferRequest,
  InitiateExpediteTransferRequest,
  InitiateRegularTransferRequest,
  UpcomingExpediteTransfer,
  UpcomingRegularTransfer,
  UpdateTransferStatusWebhookRequest,
} from '../data';
import { TransfersMapper } from '../data/mappers/transfers.mapper';
import { TransferService } from '../services';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('/transfers')
export class TransfersController {
  constructor(
    private readonly transferService: TransferService,
    private clientBatchPaymentMapper: ClientBatchPaymentMapper,
    private transfersMapper: TransfersMapper,
  ) {}

  @Post('verify-rtp')
  @HttpCode(200)
  async verifyRtp(@Body() clientIds: string[]): Promise<string[]> {
    return this.transferService.verifyRtp(clientIds);
  }

  @Get('completed')
  @HttpCode(200)
  async findAllCompleted(
    @Criteria({
      parseFilterValues: false,
    })
    criteria: QueryCriteria,
  ): Promise<PageResult<CompleteTransfer>> {
    const result = await this.transferService.findAllCompleted(criteria);
    return new PageResult(
      await Arrays.mapAsync(
        result.batchPayments,
        async (batchPayment) =>
          await this.transfersMapper.entityToModel(batchPayment),
      ),
      new PaginationResult(
        criteria.page.page,
        criteria.page.limit,
        result.count,
      ),
    );
  }

  @Get('completed/:id')
  @HttpCode(200)
  async findOneCompleted(
    @Param() identity: Identity,
  ): Promise<CompleteTransfer> {
    const result = await this.transferService.getOneById(identity.id);
    return await this.transfersMapper.entityToModel(result);
  }

  @Get('/upcoming-expedites')
  @HttpCode(200)
  upcomingExpedite(): Promise<UpcomingExpediteTransfer[]> {
    return this.transferService.getUpcomingExpediteTransfers();
  }

  @Get('/upcoming-regulars')
  @HttpCode(200)
  upcomingRegular(): Promise<UpcomingRegularTransfer> {
    return this.transferService.getUpcomingRegularTransfers();
  }

  @Post('/initiate-expedite')
  @HttpCode(200)
  async initiateExpedite(
    @Body() request: InitiateExpediteTransferRequest,
  ): Promise<ClientBatchPayment> {
    const batchPayment = await this.transferService.initiateExpediteTransfer(
      request,
    );
    return this.clientBatchPaymentMapper.entityToModel(batchPayment);
  }

  @Post('/initiate-debit-regular')
  @HttpCode(200)
  async initiateDebitRegular(
    @Body() request: InitiateDebitRegularTransferRequest,
  ): Promise<ClientBatchPayment> {
    const entity = await this.transferService.initiateDebitRegularTransfer(
      request,
    );
    return this.clientBatchPaymentMapper.entityToModel(entity);
  }

  @Post('/update-status')
  @HttpCode(200)
  updateTransferStatus(
    @Body() request: UpdateTransferStatusWebhookRequest,
  ): Promise<void> {
    return this.transferService.updateTransferStatus(request);
  }

  @Post('/initiate-regular')
  @HttpCode(202)
  async initiateRegular(
    @Body() request: InitiateRegularTransferRequest,
  ): Promise<ClientBatchPayment> {
    const batchPayment = await this.transferService.initiateRegularTransfer(
      request,
    );
    return this.clientBatchPaymentMapper.entityToModel(batchPayment);
  }

  @Get('/payments')
  @HttpCode(200)
  async listTransfers(
    @Criteria({
      parseFilterValues: false,
    })
    criteria: QueryCriteria,
  ): Promise<ListTransfersPaymentsResponse> {
    return await this.transferService.listTransfers(criteria);
  }

  @Get(':id')
  @HttpCode(200)
  async getBatchPayment(
    @Param() identity: Identity,
  ): Promise<ClientBatchPayment> {
    const entity = await this.transferService.getOneById(identity.id);
    return this.clientBatchPaymentMapper.entityToModel(entity);
  }

  @Post('/payment-order')
  @HttpCode(200)
  async createPaymentOrder(
    @Body() request: CreatePaymentOrderRequest,
  ): Promise<PaymentOrder> {
    return await this.transferService.createPaymentOrder(request);
  }
}
