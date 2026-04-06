import { Identity } from '@core/data';
import {
  ApiIdentityParam,
  ApiPaginatedResponse,
  ApiQueryCriteria,
} from '@core/web';
import {
  CreateBuyoutsBatchRequest,
  DeleteBuyoutRequest,
  Invoice,
  PendingBuyout,
  UpdateBuyoutRequest,
  UploadBuyoutsBatchRequest,
} from '@fs-bobtail/factoring/data';
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBadRequestResponse, ApiOkResponse } from '@nestjs/swagger';
import { Arrays } from '../../../core';
import { InvoiceMapper } from '../../invoices';
import { BuyoutsService } from '../services';
import { CsvFileValidator } from '../validators';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('buyouts')
export class BuyoutsController {
  constructor(
    private buyoutService: BuyoutsService,
    private invoiceMapper: InvoiceMapper,
  ) {}

  @Post('upload')
  @HttpCode(201)
  @ApiBadRequestResponse({
    description: 'Buyouts payload validation failed',
  })
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @Body() body: UploadBuyoutsBatchRequest,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new CsvFileValidator()],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.buyoutService.upload(file, body);
  }

  @Post()
  @HttpCode(201)
  @ApiBadRequestResponse({
    description: 'Buyouts payload validation failed',
  })
  @UseInterceptors(FileInterceptor('file'))
  create(@Body() body: CreateBuyoutsBatchRequest) {
    return this.buyoutService.create(body);
  }

  @Get()
  @HttpCode(200)
  @ApiPaginatedResponse(PendingBuyout, 'Pending buyouts fetched successfully')
  @ApiQueryCriteria()
  async findAll(): Promise<PendingBuyout[]> {
    return this.buyoutService.findAll();
  }

  @Post('bulk-purchase')
  @HttpCode(201)
  async bulkPurchase(): Promise<Invoice[]> {
    const invoices = await this.buyoutService.bulkPurchase();
    return Arrays.mapAsync(invoices, async (invoice) => {
      return this.invoiceMapper.contextToModel(invoice);
    });
  }

  @Patch(':id')
  @HttpCode(200)
  @ApiIdentityParam()
  @ApiOkResponse({
    description: 'Buyout invoice was updated successfully',
  })
  async update(@Param() identity: Identity, @Body() body: UpdateBuyoutRequest) {
    return this.buyoutService.update(identity.id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiIdentityParam()
  @ApiOkResponse({ description: 'Buyout was deleted successfully' })
  async delete(
    @Param() identity: Identity,
    @Body() body: DeleteBuyoutRequest,
  ): Promise<void> {
    await this.buyoutService.delete(identity.id, body);
  }
}
