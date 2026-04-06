import { AppContextHolder } from '@core/app-context';
import { Criteria, Identity, PageResult, QueryCriteria } from '@core/data';
import { DevelopmentEnvironmentGuard, Permissions } from '@module-common';
import { RequiredPermissions } from '@module-auth';
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiExcludeController, ApiOkResponse } from '@nestjs/swagger';
import {
  Client,
  ClientDocument,
  ClientFactoringConfig,
  ClientFactoringConfigMapper,
  ClientOverview,
  CreateClientFactoringConfigRequest,
  UpdateClientDocumenRequest,
  UpdateClientFactoringConfigRequest,
  UpdateClientRequest,
} from '../data';
import { CreateClientRequest } from '../data/web/create-client.request';
import { ClientService, SyncClientStatusCronJob } from '../services';
import {
  ClientBankAccount,
  FactoringBankAccountsQuery,
} from '@fs-bobtail/factoring/data';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('clients')
@ApiExcludeController()
export class ClientsController {
  constructor(
    private readonly clientService: ClientService,
    private readonly clientFactoringConfigMapper: ClientFactoringConfigMapper,
    private readonly syncClientStatusCronJob: SyncClientStatusCronJob,
  ) {}

  @Get('/me')
  @HttpCode(HttpStatus.OK)
  async getUserData(): Promise<Client> {
    const { email } = AppContextHolder.get().getAuthentication().principal;
    return await this.clientService.getMe(email);
  }

  @Get(':id/overview')
  @HttpCode(HttpStatus.OK)
  async overview(@Param() identity: Identity): Promise<ClientOverview> {
    return await this.clientService.overview(identity.id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: PageResult<Client> })
  async findAll(
    @Criteria({
      parseFilterValues: false,
    })
    criteria: QueryCriteria,
  ): Promise<PageResult<Client>> {
    return await this.clientService.findAll(criteria);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getOneById(@Param('id') id: string): Promise<Client> {
    return await this.clientService.getOneById(id, {
      includeHistory: true,
      includeAudit: true,
    });
  }

  @Get(':id/bank-accounts')
  @HttpCode(HttpStatus.OK)
  async getBankAccounts(
    @Param() identity: Identity,
    @Query() query: FactoringBankAccountsQuery,
  ): Promise<ClientBankAccount[]> {
    return await this.clientService.getFactoringBankAccounts(identity.id, {
      includeSensitive: query.includeSensitive ?? false,
    });
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async updateClientFactoringConfig(
    @Param('id') id: string,
    @Body() payload: UpdateClientFactoringConfigRequest,
  ): Promise<ClientFactoringConfig> {
    const entity = await this.clientService.updateFactoringConfig(id, payload);
    return this.clientFactoringConfigMapper.entityToModel(entity);
  }

  @Patch(':id/client-document/:documentId')
  @HttpCode(HttpStatus.OK)
  async updateClientDocument(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @Body() payload: UpdateClientDocumenRequest,
  ): Promise<ClientDocument> {
    return await this.clientService.updateClientDocument(
      id,
      documentId,
      payload,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() payload: CreateClientFactoringConfigRequest,
  ): Promise<ClientFactoringConfig> {
    const entity = await this.clientService.createClientFactoringConfig(
      payload,
    );
    return this.clientFactoringConfigMapper.entityToModel(entity.clientConfig);
  }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async createClient(@Body() request: CreateClientRequest): Promise<Client> {
    const config = await this.clientService.createClient(request);
    return await this.clientService.getOneById(config.clientId, {
      includeHistory: true,
      includeAudit: true,
    });
  }

  @Patch(':id/update')
  @HttpCode(HttpStatus.OK)
  async updateClient(
    @Param('id') id: string,
    @Body() request: UpdateClientRequest,
  ): Promise<Client> {
    const config = await this.clientService.updateClient(id, request);
    return await this.clientService.getOneById(config.clientId, {
      includeHistory: true,
      includeAudit: true,
    });
  }

  @Post('cron/sync-client-status')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(DevelopmentEnvironmentGuard)
  async cronSyncClientStatus(): Promise<void> {
    await this.syncClientStatusCronJob.execute();
  }

  @Post(':id/send-reset-password-request')
  @HttpCode(204)
  @RequiredPermissions([Permissions.ResetClientPassword])
  async sendResetClientPasswordRequest(
    @Param() identity: Identity,
  ): Promise<void> {
    await this.clientService.sendResetClientPasswordRequest(identity.id);
  }
}
