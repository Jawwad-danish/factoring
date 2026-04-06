import { Criteria, Identity, PageResult, QueryCriteria } from '@core/data';
import { ApiPaginatedResponse, ApiQueryCriteria } from '@core/web';
import { Broker, BrokerService } from '@module-brokers';
import { Client, ClientService } from '@module-clients';
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
  UseInterceptors,
} from '@nestjs/common';
import { Arrays } from '../../../core';
import {
  ProcessingNotes,
  ProcessingNotesCreateRequest,
  ProcessingNotesDeleteRequest,
  ProcessingNotesMapper,
  ProcessingNotesUpdateRequest,
} from '../data';
import { ProcessingNotesService } from '../services';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('processing-notes')
export class ProcessingNotesController {
  constructor(
    private readonly service: ProcessingNotesService,
    private readonly clientService: ClientService,
    private readonly brokerService: BrokerService,
    private readonly mapper: ProcessingNotesMapper,
  ) {}

  @Post()
  @HttpCode(200)
  async create(
    @Body() payload: ProcessingNotesCreateRequest,
  ): Promise<ProcessingNotes> {
    const entity = await this.service.create(payload);
    const model = await this.mapper.entityToModel(entity);
    const { clients, brokers } = await this.loadClientsAndBrokers([model]);
    model.client = clients.get(model.clientId || '');
    model.broker = brokers.get(model.brokerId || '');
    return model;
  }

  @Patch(':id')
  @HttpCode(200)
  async update(
    @Param() identity: Identity,
    @Body() payload: ProcessingNotesUpdateRequest,
  ): Promise<ProcessingNotes> {
    const entity = await this.service.update(identity.id, payload);
    const model = await this.mapper.entityToModel(entity);
    const { clients, brokers } = await this.loadClientsAndBrokers([model]);
    model.client = clients.get(model.clientId || '');
    model.broker = brokers.get(model.brokerId || '');
    return model;
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(
    @Param() identity: Identity,
    @Body() payload: ProcessingNotesDeleteRequest,
  ): Promise<void> {
    return this.service.delete(identity.id, payload);
  }

  @Get()
  @HttpCode(200)
  @ApiPaginatedResponse(
    ProcessingNotes,
    'Processing notes fetched successfully',
  )
  @ApiQueryCriteria()
  async findAll(
    @Criteria({
      parseFilterValues: true,
    })
    criteria: QueryCriteria,
  ): Promise<PageResult<ProcessingNotes>> {
    const result = await this.service.findAll(criteria);

    const models = await Arrays.mapAsync(result.entities, async (entity) =>
      this.mapper.entityToModel(entity),
    );
    const { clients, brokers } = await this.loadClientsAndBrokers(models);

    const enrichedModels = models.map((model) => {
      model.client = clients.get(model.clientId || '');
      model.broker = brokers.get(model.brokerId || '');
      return model;
    });

    return PageResult.from(enrichedModels, result.count, criteria);
  }

  private async loadClientsAndBrokers(models: ProcessingNotes[]): Promise<{
    clients: Map<string, Client>;
    brokers: Map<string, Broker>;
  }> {
    const clientIds = new Set<string>();
    const brokerIds = new Set<string>();
    models.forEach((model) => {
      if (model.clientId) clientIds.add(model.clientId);
      if (model.brokerId) brokerIds.add(model.brokerId);
    });
    const [clients, brokers] = await Promise.all([
      this.clientService.findByIds([...clientIds]),
      this.brokerService.findByIds([...brokerIds]),
    ]);
    const clientMap = new Map<string, Client>();
    const brokerMap = new Map<string, Broker>();
    clients.forEach((client) => clientMap.set(client.id, client));
    brokers.forEach((broker) => brokerMap.set(broker.id, broker));
    return { clients: clientMap, brokers: brokerMap };
  }
}
