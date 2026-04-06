import { Body, Controller, HttpCode, Param, Post, Put } from '@nestjs/common';
import { ApiParam } from '@nestjs/swagger';
import {
  InvoiceDocumentMapper,
  InvoiceMapper,
  UpdateInvoiceDocumentRequest,
} from '../data';
import { InvoiceDocumentService } from '../services';
import { Invoice, InvoiceDocument } from '@fs-bobtail/factoring/data';

@Controller('/invoices/:invoiceId/documents')
export class InvoiceDocumentController {
  constructor(
    private invoiceDocumentsService: InvoiceDocumentService,
    private mapper: InvoiceDocumentMapper,
    private invoiceMapper: InvoiceMapper,
  ) {}

  @Put()
  @HttpCode(200)
  @ApiParam({ name: 'invoiceId', type: 'string', format: 'uuid' })
  async update(
    @Body() request: UpdateInvoiceDocumentRequest,
    @Param('invoiceId') invoiceId: string,
  ): Promise<InvoiceDocument> {
    const updated = await this.invoiceDocumentsService.update(
      invoiceId,
      request,
    );
    return this.mapper.entityToModel(updated);
  }

  @Post('generation-failure')
  @HttpCode(200)
  @ApiParam({ name: 'invoiceId', type: 'string', format: 'uuid' })
  async generationFailure(
    @Param('invoiceId') invoiceId: string,
  ): Promise<Invoice> {
    const invoice = await this.invoiceDocumentsService.failGeneration(
      invoiceId,
    );
    return this.invoiceMapper.entityToModel(invoice);
  }
}
