import { Criteria, PageResult, QueryCriteria } from '@core/data';
import { ApiPaginatedResponse, ApiQueryCriteria } from '@core/web';
import { RequiredPermissions } from '@module-auth';
import { Permissions } from '@module-common';
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { Arrays } from '../../../core';
import {
  CreateReserveAccountFundsRequest,
  ReserveAccountFundsMapper,
} from '../data';
import { ReserveAccountFundsService } from '../services';
import {
  ReserveAccountFunds,
  ReserveAccountFundsTotal,
} from '@fs-bobtail/factoring/data';

@Controller('/clients/:clientId/reserve-account-funds')
@UseInterceptors(ClassSerializerInterceptor)
export class ReserveAccountFundsController {
  constructor(
    private readonly reserveAccountFundsService: ReserveAccountFundsService,
    private readonly mapper: ReserveAccountFundsMapper,
  ) {}

  @Post()
  @HttpCode(201)
  @RequiredPermissions([Permissions.CreateReserveAccountFunds])
  async create(
    @Param('clientId') clientId: string,
    @Body() request: CreateReserveAccountFundsRequest,
  ): Promise<ReserveAccountFunds> {
    const reserveAccountFunds = await this.reserveAccountFundsService.create(
      clientId,
      request,
    );
    return this.mapper.entityToModel(reserveAccountFunds);
  }

  @Get('/total')
  @HttpCode(200)
  async total(
    @Param('clientId', ParseUUIDPipe) clientId: string,
  ): Promise<ReserveAccountFundsTotal> {
    const total = await this.reserveAccountFundsService.getTotal(clientId);
    return new ReserveAccountFundsTotal({
      amount: total,
    });
  }

  @Get()
  @HttpCode(200)
  @ApiPaginatedResponse(
    ReserveAccountFunds,
    'Reserve account funds fetched successfully',
  )
  @ApiQueryCriteria()
  async findAll(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Criteria({
      parseFilterValues: true,
    })
    criteria: QueryCriteria,
  ): Promise<PageResult<ReserveAccountFunds>> {
    const result = await this.reserveAccountFundsService.findAll(
      clientId,
      criteria,
    );
    return PageResult.from(
      await Arrays.mapAsync(result[0], (entity) =>
        this.mapper.entityToModel(entity),
      ),
      result[1],
      criteria,
    );
  }
}
