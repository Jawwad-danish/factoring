import { Criteria, PageResult, QueryCriteria } from '@core/data';
import { ApiPaginatedResponse } from '@core/web';
import { Reserve, ReserveTotal } from '@fs-bobtail/factoring/data';
import { RequiredPermissions } from '@module-auth';
import { Permissions } from '@module-common';
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import Big from 'big.js';
import {
  CreateReserveRequest,
  DeleteReserveRequest,
  ReserveMapper,
} from '../data';
import { ReservesService } from '../services';

@Controller('/clients/:clientId/reserves')
@UseInterceptors(ClassSerializerInterceptor)
export class ReservesController {
  constructor(
    private readonly reserveService: ReservesService,
    private readonly mapper: ReserveMapper,
  ) {}

  @Post()
  @HttpCode(201)
  @RequiredPermissions([Permissions.CreateReserve])
  async create(
    @Param('clientId') clientId: string,
    @Body() body: CreateReserveRequest,
  ) {
    const reserve = await this.reserveService.create(clientId, body);
    const total = await this.reserveService.getTotal(clientId);
    return await this.mapper.entityToModel(reserve, total);
  }

  @Delete(':reserveId')
  @HttpCode(204)
  @RequiredPermissions([Permissions.DeleteReserve])
  async delete(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('reserveId', ParseUUIDPipe) reserveId: string,
    @Body() body: DeleteReserveRequest,
  ): Promise<Reserve> {
    const reserve = await this.reserveService.delete(clientId, reserveId, body);
    return await this.mapper.entityToModel(reserve);
  }

  @Get('/total')
  @HttpCode(200)
  async total(
    @Param('clientId', ParseUUIDPipe) clientId: string,
  ): Promise<ReserveTotal> {
    const total = await this.reserveService.getTotal(clientId);
    return new ReserveTotal({
      amount: new Big(total),
    });
  }

  @Get()
  @HttpCode(200)
  @ApiPaginatedResponse(Reserve, 'Reserves fetched successfully')
  async findAll(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Criteria({
      parseFilterValues: true,
    })
    criteria: QueryCriteria,
  ): Promise<PageResult<Reserve>> {
    const [result, totalAmount] = await this.reserveService.findAll(
      clientId,
      criteria,
    );
    let currentAmount = Big(totalAmount);
    const reserves = await Promise.all(
      result.items.map(async (entity) => {
        const model = await this.mapper.entityToModel(entity);
        model.total = currentAmount;
        currentAmount = currentAmount.minus(model.amount);
        return model;
      }),
    );
    return new PageResult(reserves, result.pagination);
  }

  @Get(':reserveId')
  @HttpCode(200)
  @ApiPaginatedResponse(Reserve, 'Reserves fetched successfully')
  async findOne(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('reserveId', ParseUUIDPipe) reserveId: string,
  ): Promise<Reserve> {
    const [reserveEntity, totalAmount] = await this.reserveService.findOne(
      clientId,
      reserveId,
    );
    const reserve = await this.mapper.entityToModel(reserveEntity);
    reserve.total = new Big(totalAmount);
    return reserve;
  }
}
