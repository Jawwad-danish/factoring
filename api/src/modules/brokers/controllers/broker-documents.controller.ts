import {
  Body,
  ClassSerializerInterceptor,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  UseInterceptors,
} from '@nestjs/common';
import { Controller, Post } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { BrokerDocumentsService } from '../services';
import { Identity } from '@core/data';
import { BrokerDocumentRequest, BrokerDocument } from '../data';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('brokers/:id/documents')
@ApiExcludeController()
export class BrokerDocumentsController {
  constructor(
    private readonly brokerDocumentsService: BrokerDocumentsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createBrokerDocument(
    @Param() identity: Identity,
    @Body() request: BrokerDocumentRequest,
  ): Promise<BrokerDocument> {
    return await this.brokerDocumentsService.createBrokerDocument(
      identity.id,
      request,
    );
  }

  @Patch(':documentId')
  @HttpCode(HttpStatus.OK)
  async updateBrokerDocument(
    @Param() identity: Identity,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Body() request: BrokerDocumentRequest,
  ): Promise<BrokerDocument> {
    return await this.brokerDocumentsService.updateBrokerDocument(
      identity.id,
      documentId,
      request,
    );
  }

  @Delete(':documentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBrokerDocument(
    @Param() identity: Identity,
    @Param('documentId', ParseUUIDPipe) documentId: string,
  ): Promise<void> {
    return await this.brokerDocumentsService.deleteBrokerDocument(
      identity.id,
      documentId,
    );
  }
}
