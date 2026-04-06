import { Criteria, Identity, PageResult, QueryCriteria } from '@core/data';
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
import { CreateClientDebtorAssignmentRequest } from '@fs-bobtail/factoring/data';
import {
  ClientBrokerAssignment,
  ReleaseBrokerRequest,
  SendNoaBombRequest,
  SendNoaRequest,
} from '../data';
import { ClientBrokerAssignmentService } from '../services';
import { Arrays } from '@core/util';
import { ClientBrokerAssignmentMapper } from '../mappers';
import { ApiPaginatedResponse, ApiQueryCriteria } from '@core/web';
import { ApiOkResponse } from '@nestjs/swagger';
import { Broker, BrokerService } from '@module-brokers';
import { Client, ClientService } from '@module-clients';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('client-broker-assignments')
export class ClientBrokerAssignmentController {
  constructor(
    private readonly service: ClientBrokerAssignmentService,
    private readonly clientService: ClientService,
    private readonly brokerService: BrokerService,
    private readonly mapper: ClientBrokerAssignmentMapper,
  ) {}

  @Post()
  @HttpCode(200)
  async create(@Body() payload: CreateClientDebtorAssignmentRequest) {
    return this.service.create(payload);
  }

  @Post('release')
  @HttpCode(200)
  async release(@Body() payload: ReleaseBrokerRequest) {
    return this.service.release(payload);
  }

  @Post('send-noa-bomb')
  @HttpCode(200)
  async sendNoaBomb(@Body() payload: SendNoaBombRequest) {
    return this.service.sendNoaBomb(payload.clientId);
  }

  @Post('resend-noa')
  @HttpCode(200)
  async resendNoa(@Body() payload: SendNoaRequest) {
    return this.service.reSendNoa(payload.id, payload.to);
  }

  @Get()
  @HttpCode(200)
  @ApiPaginatedResponse(
    ClientBrokerAssignment,
    'Client broker assignments fetched successfully',
  )
  @ApiQueryCriteria()
  async findAll(
    @Criteria({
      parseFilterValues: true,
    })
    criteria: QueryCriteria,
  ): Promise<PageResult<ClientBrokerAssignment>> {
    const result = await this.service.findAll(criteria);

    const models = await Arrays.mapAsync(result.entities, (entity) =>
      this.mapper.entityToModel(entity),
    );

    const { clients, brokers } = await this.loadClientsAndBrokers(models);

    return PageResult.from(
      models.map((model) => {
        model.client = clients.get(model.clientId || '');
        model.broker = brokers.get(model.brokerId || '');
        return model;
      }),
      result.count,
      criteria,
    );
  }

  @Get(':id')
  @HttpCode(200)
  @ApiOkResponse({ description: 'Client broker assignment found successfully' })
  async getOneById(
    @Param() identity: Identity,
  ): Promise<ClientBrokerAssignment> {
    const result = await this.service.getOneById(identity.id);
    return this.mapper.entityToModel(result.entity);
  }

  private async loadClientsAndBrokers(
    models: ClientBrokerAssignment[],
  ): Promise<{ clients: Map<string, Client>; brokers: Map<string, Broker> }> {
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
