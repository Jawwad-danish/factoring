import { Arrays } from '@core/util';
import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  UseInterceptors,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { ClientSuccessTeam, ClientSuccessTeamMapper } from '../data';
import { ClientService } from '../services';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('client-success-teams')
@ApiExcludeController()
export class ClientSuccessTeamController {
  constructor(
    private readonly clientService: ClientService,
    private readonly mapper: ClientSuccessTeamMapper,
  ) {}

  @Get('')
  @HttpCode(200)
  async get(): Promise<ClientSuccessTeam[]> {
    const entities = await this.clientService.getClientSuccessTeams();
    return Arrays.mapAsync(entities, (entity) =>
      this.mapper.entityToModel(entity),
    );
  }
}
