import {
  Criteria,
  Identities,
  Identity,
  PageResult,
  QueryCriteria,
} from '@core/data';
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiExcludeController, ApiOkResponse } from '@nestjs/swagger';
import {
  Broker,
  BrokerContact,
  BrokerFactoringConfig,
  BrokerFactoringStats,
} from '../data/model';
import { BrokerService } from '../services';
import {
  BrokerFactoringConfigMapper,
  CreateBrokerContactRequest,
  CreateBrokerRequest,
  UpdateBrokerContactRequest,
  UpdateBrokerFactoringConfigRequest,
  UpdateBrokerRequest,
} from '../data';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('brokers')
@ApiExcludeController()
export class BrokersController {
  constructor(
    private readonly brokerService: BrokerService,
    private readonly brokerFactoringConfigMapper: BrokerFactoringConfigMapper,
  ) {}

  @Patch(':id')
  @HttpCode(200)
  async update(
    @Param('id') id: string,
    @Body() payload: UpdateBrokerFactoringConfigRequest,
  ): Promise<BrokerFactoringConfig> {
    const entity = await this.brokerService.updateBrokerFactoringConfig(
      id,
      payload,
    );
    return this.brokerFactoringConfigMapper.entityToModel(entity);
  }

  @Patch(':id/update')
  @HttpCode(200)
  async updateBroker(
    @Param() identity: Identity,
    @Body() request: UpdateBrokerRequest,
  ): Promise<Broker> {
    const config = await this.brokerService.updateBroker(identity.id, request);
    return await this.brokerService.getOneById(config.brokerId);
  }

  @Get(`:id/factoring-stats`)
  @HttpCode(200)
  async getFactoringStatsByBrokerId(
    @Param() identity: Identity,
  ): Promise<BrokerFactoringStats> {
    return await this.brokerService.getFactoringStatsByBrokerId(identity.id);
  }

  @Post('/factoring-stats/fetch')
  @HttpCode(200)
  async getFactoringStatsByBrokerIds(
    @Body() identity: Identities,
  ): Promise<BrokerFactoringStats[]> {
    return await this.brokerService.getFactoringStatsByBrokerIds(identity.ids);
  }

  @Get()
  @HttpCode(200)
  @ApiOkResponse({ type: PageResult<Broker> })
  async findAll(
    @Criteria() criteria: QueryCriteria,
  ): Promise<PageResult<Broker>> {
    return await this.brokerService.findAll(criteria);
  }

  @Get(':id')
  @HttpCode(200)
  async getBrokerById(@Param() identity: Identity): Promise<Broker | null> {
    return await this.brokerService.findOneById(identity.id);
  }

  @Post()
  @HttpCode(201)
  async createBroker(@Body() request: CreateBrokerRequest): Promise<Broker> {
    const config = await this.brokerService.createBroker(request);
    return await this.brokerService.getOneById(config.brokerId);
  }

  @Post(':id/contacts')
  @HttpCode(HttpStatus.CREATED)
  async createBrokerContact(
    @Param() identity: Identity,
    @Body() request: CreateBrokerContactRequest,
  ): Promise<BrokerContact> {
    return await this.brokerService.createBrokerContact(identity.id, request);
  }

  @Patch(':id/contacts/:contactId')
  @HttpCode(HttpStatus.OK)
  async updateBrokerContact(
    @Param() identity: Identity,
    @Param('contactId', ParseUUIDPipe) contactId: string,
    @Body() request: UpdateBrokerContactRequest,
  ): Promise<BrokerContact> {
    return await this.brokerService.updateBrokerContact(
      identity.id,
      contactId,
      request,
    );
  }
}
