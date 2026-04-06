import {
  Criteria,
  FilterCriteria,
  FilterOperator,
  Identity,
  PageResult,
  QueryCriteria,
  SortCriteria,
  SortingOrder,
} from '@core/data';
import {
  ApiIdentityParam,
  ApiPaginatedResponse,
  ApiQueryCriteria,
} from '@core/web';
import { CreateInvoiceRequest, Invoice } from '@fs-bobtail/factoring/data';
import { RequiredPermissions } from '@module-auth';
import { Permissions } from '@module-common';
import { InvoiceStatus } from '@module-persistence/entities';
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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import {
  AssignInvoiceActivityPathParam,
  AssignInvoiceActivityRequest,
  CompleteInvoiceKpiResponse,
  DeleteInvoiceActivityRequest,
  DeleteInvoiceRequest,
  InvoiceDuplicate,
  InvoiceKpiResponse,
  InvoiceMapper,
  InvoiceRisk,
  PurchaseInvoiceRequest,
  PurchaseVolume,
  RegenerateInvoiceDocumentRequest,
  RejectInvoiceRequest,
  RevertInvoiceRequest,
  ShareInvoiceRequest,
  UpdateInvoiceRequest,
  VerifyInvoiceRequest,
} from '../data';
import { InvoicePrePurchaseCheck } from '../data/invoice-pre-purchase-check.model';
import { InvoicesGuard } from '../guards';
import { InvoiceService } from '../services';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('invoices')
export class InvoiceController {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly invoiceMapper: InvoiceMapper,
  ) {}

  @Post()
  @HttpCode(201)
  @ApiCreatedResponse({
    description: 'Invoice was created successfully',
    type: Invoice,
  })
  @ApiBadRequestResponse({
    description: 'Invoice payload validation failed',
  })
  async create(@Body() request: CreateInvoiceRequest): Promise<Invoice> {
    const result = await this.invoiceService.create(request);
    const model = this.invoiceMapper.contextToModel(result);
    return model;
  }

  @Post(':id/reject')
  @HttpCode(200)
  @RequiredPermissions([Permissions.RejectInvoice])
  @ApiIdentityParam()
  @ApiOkResponse({
    description: 'Invoice was rejected successfully',
    type: Invoice,
  })
  async reject(
    @Param() identity: Identity,
    @Body() payload: RejectInvoiceRequest,
  ): Promise<Invoice> {
    const result = await this.invoiceService.reject(identity.id, payload);
    return this.invoiceMapper.contextToModel(result);
  }

  @Post(':id/purchase')
  @HttpCode(200)
  @RequiredPermissions([Permissions.PurchaseInvoice])
  @ApiIdentityParam()
  @ApiOkResponse({
    description: 'Invoice was purchased successfully',
    type: Invoice,
  })
  async purchase(
    @Param() identity: Identity,
    @Body() payload: PurchaseInvoiceRequest,
  ): Promise<Invoice> {
    const result = await this.invoiceService.purchase(identity.id, payload);
    return this.invoiceMapper.contextToModel(result);
  }

  @Post(':id/revert')
  @HttpCode(200)
  @RequiredPermissions([Permissions.RevertInvoice])
  @ApiIdentityParam()
  @ApiCreatedResponse({
    description: 'Invoice was reverted successfully',
    type: Invoice,
  })
  async revert(
    @Param() identity: Identity,
    @Body() payload: RevertInvoiceRequest,
  ): Promise<Invoice> {
    const result = await this.invoiceService.revert(identity.id, payload);
    return this.invoiceMapper.contextToModel(result);
  }

  @Post(':id/verify')
  @HttpCode(200)
  @RequiredPermissions([Permissions.VerifyInvoice])
  @ApiIdentityParam()
  @ApiOkResponse({
    description: 'Invoice was verified successfully',
    type: Invoice,
  })
  async verify(
    @Param() identity: Identity,
    @Body() payload: VerifyInvoiceRequest,
  ): Promise<Invoice> {
    const result = await this.invoiceService.verify(identity.id, payload);
    return this.invoiceMapper.contextToModel(result);
  }

  @Post(':id/regenerate-docs')
  @HttpCode(202)
  @RequiredPermissions([Permissions.RegenerateInvoiceDocuments])
  @ApiIdentityParam()
  @ApiOkResponse({
    description:
      'Invoice Documents regeneration process was started successfully',
  })
  async regenerateDocs(
    @Param() identity: Identity,
    @Body() payload: RegenerateInvoiceDocumentRequest,
  ): Promise<void> {
    return this.invoiceService.regenerateDocs(identity.id, payload);
  }

  @Patch(':id')
  @HttpCode(200)
  @ApiIdentityParam()
  @ApiOkResponse({
    description: 'Invoice was updated successfully',
    type: Invoice,
  })
  async update(
    @Param() identity: Identity,
    @Body() payload: UpdateInvoiceRequest,
  ): Promise<Invoice> {
    const result = await this.invoiceService.update(identity.id, payload);
    return this.invoiceMapper.contextToModel(result);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiIdentityParam()
  @ApiOkResponse({ description: 'Invoice was deleted successfully' })
  async delete(
    @Param() identity: Identity,
    @Body() payload: DeleteInvoiceRequest,
  ): Promise<void> {
    await this.invoiceService.delete(identity.id, payload);
  }

  @Post('/possible-duplicate-check')
  @HttpCode(200)
  @ApiOkResponse({ description: 'Invoice was verified successfully' })
  async isPossibleDuplicate(
    @Body() createInvoice: CreateInvoiceRequest,
  ): Promise<InvoiceDuplicate> {
    const result = await this.invoiceService.possibleDuplicateCheck(
      createInvoice,
    );
    return {
      result: result.length > 0,
      items: result,
    };
  }

  @Post(':id/pre-purchase-check')
  @HttpCode(200)
  @ApiOkResponse({
    description: 'Invoice purchase possibility checked successfully',
  })
  async checkInvoiceForPurchase(
    @Param() identity: Identity,
    @Body() request: PurchaseInvoiceRequest,
  ): Promise<InvoicePrePurchaseCheck> {
    return this.invoiceService.checkInvoiceForPurchase(identity.id, request);
  }

  @Get('/purchase-volume')
  @HttpCode(200)
  @ApiOkResponse({ description: 'Purchase volume fetched successfully' })
  purchaseVolume(): Promise<PurchaseVolume> {
    return this.invoiceService.getPurchaseVolume();
  }

  @Get('/rejected')
  @HttpCode(200)
  @ApiPaginatedResponse(Invoice, 'Rejected invoices fetched successfully')
  async findAllRejected(
    @Criteria() criteria: QueryCriteria,
  ): Promise<PageResult<Invoice>> {
    const rejectedFilter = new FilterCriteria({
      name: 'status',
      operator: FilterOperator.EQ,
      value: InvoiceStatus.Rejected,
    });
    criteria.filters.push(rejectedFilter);
    const sortByRejectedDate = new SortCriteria({
      name: 'rejectedDate',
      order: SortingOrder.DESC,
    });
    criteria.sort.push(sortByRejectedDate);
    return this.invoiceService.findAll(criteria);
  }

  @Get(':id/risk')
  @HttpCode(200)
  @ApiOkResponse({ description: 'Client / Broker risk for this invoice' })
  @ApiIdentityParam()
  @ApiNotFoundResponse({
    description: 'Invoice not found',
  })
  async getRisk(@Param() identity: Identity): Promise<InvoiceRisk> {
    return await this.invoiceService.getRisk(identity.id);
  }

  @Get(':id')
  @UseGuards(InvoicesGuard)
  @HttpCode(200)
  @ApiOkResponse({ description: 'Invoice was found successfully' })
  @ApiIdentityParam()
  @ApiNotFoundResponse({
    description: 'Invoice or client or broker were not found',
  })
  async getById(@Param() identity: Identity): Promise<Invoice> {
    const invoice = await this.invoiceService.getOneById(identity.id);
    return invoice;
  }

  @Get()
  @HttpCode(200)
  @ApiPaginatedResponse(Invoice, 'Invoices fetched successfully')
  @ApiQueryCriteria()
  async findAll(
    @Criteria({
      parseFilterValues: false,
    })
    criteria: QueryCriteria,
  ): Promise<PageResult<Invoice>> {
    return this.invoiceService.findAll(criteria);
  }

  @Get('/client/:id/kpi/invoices')
  @HttpCode(200)
  @ApiIdentityParam()
  @ApiOkResponse({ description: 'Fetch processing invoices KPIs' })
  async getInvoiceKpis(
    @Param() identity: Identity,
  ): Promise<InvoiceKpiResponse> {
    return this.invoiceService.getProcessingInvoicesKpis(identity.id);
  }

  @Patch(':id/activity')
  @HttpCode(200)
  @ApiIdentityParam()
  @ApiOkResponse({ description: 'Invoice activity was assigned with success' })
  async assignInvoiceActivity(
    @Param() identity: Identity,
    @Body() request: AssignInvoiceActivityRequest,
  ): Promise<Invoice> {
    return await this.invoiceService.assignInvoiceActivity(
      identity.id,
      request,
    );
  }

  @Delete(':invoiceId/activity/:activityId')
  @HttpCode(204)
  @ApiIdentityParam()
  @ApiOkResponse({ description: 'Invoice activity was deleted successfully' })
  async deleteTag(
    @Param() { invoiceId, activityId }: AssignInvoiceActivityPathParam,
    @Body() request: DeleteInvoiceActivityRequest,
  ): Promise<void> {
    return this.invoiceService.deleteActivity(invoiceId, activityId, request);
  }

  @Get('client/:id/kpi/completed-invoices')
  @HttpCode(200)
  @ApiIdentityParam()
  @ApiOkResponse({ description: 'Fetch completed invoices KPIs' })
  async getCompleteInvoiceKpis(
    @Param('id') id: string,
  ): Promise<CompleteInvoiceKpiResponse> {
    return this.invoiceService.getCompletedInvoiceKpisByClientId(id);
  }

  @Post(':id/share')
  @HttpCode(200)
  @ApiIdentityParam()
  @ApiOkResponse({ description: 'Share invoice document' })
  async share(
    @Param() { id }: Identity,
    @Body() request: ShareInvoiceRequest,
  ): Promise<void> {
    await this.invoiceService.share(id, request);
  }
}
