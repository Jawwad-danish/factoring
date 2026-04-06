import { EntityNotFoundError } from '@core/errors';
import { Paths } from '@core/types';
import { FindOptions, raw } from '@mikro-orm/core';
import {
  ClientFactoringConfigsEntity,
  ClientFactoringStatus,
  RecordStatus,
} from '@module-persistence/entities';
import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { BasicRepository } from './basic-repository';

interface ClientFactoringConfigFindOptions {
  history?: boolean;
  audit?: boolean;
  user?: boolean;
}

@Injectable()
export class ClientFactoringConfigsRepository extends BasicRepository<ClientFactoringConfigsEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, ClientFactoringConfigsEntity);
  }

  async get90DaysInactiveClientFactoringConfigs(): Promise<
    ClientFactoringConfigsEntity[]
  > {
    const qb = this.entityManager.createQueryBuilder(
      ClientFactoringConfigsEntity,
      'cfc',
    );

    const result = await qb
      .select('*')
      .where({ status: ClientFactoringStatus.Active })
      .andWhere(raw("cfc.created_at <= NOW() - INTERVAL '90 days'"))
      .andWhere(
        raw(`NOT EXISTS (
          SELECT 1
          FROM invoices i
          WHERE i.client_id = cfc.client_id
          AND i.created_at > NOW() - INTERVAL '90 days'
          AND i.record_status = '${RecordStatus.Active}'
        )`),
      )
      .getResultList();

    return result;
  }

  findOneByClientId(
    clientId: string,
    options?: ClientFactoringConfigFindOptions,
  ): Promise<ClientFactoringConfigsEntity | null> {
    return this.repository.findOne(
      {
        clientId: clientId,
      },
      this.buildFindOptions(options),
    );
  }

  async findByClientIds(
    clientIds: string[],
    options?: ClientFactoringConfigFindOptions,
  ): Promise<ClientFactoringConfigsEntity[]> {
    const result = await this.find(
      {
        clientId: { $in: clientIds },
      },
      this.buildFindOptions(options),
    );
    return result;
  }

  async getOneByClientId(
    clientId: string,
    options?: ClientFactoringConfigFindOptions,
  ): Promise<ClientFactoringConfigsEntity> {
    const found = await this.findOneByClientId(clientId, options);
    if (found === null) {
      throw EntityNotFoundError.byId(clientId, 'client factoring config');
    }
    return found;
  }

  async getOneByUserId(
    userId: string,
    options?: ClientFactoringConfigFindOptions,
  ): Promise<ClientFactoringConfigsEntity> {
    const found = await this.repository.findOne(
      {
        user: userId,
      },
      this.buildFindOptions(options),
    );
    if (found === null) {
      throw EntityNotFoundError.byId(userId, 'client factoring config');
    }
    return found;
  }

  async getOneByUserEmail(
    email: string,
  ): Promise<ClientFactoringConfigsEntity> {
    const found = await this.repository.findOne({
      user: {
        email: email,
      },
    });
    if (found === null) {
      throw new EntityNotFoundError(`Could not find entity for email ${email}`);
    }
    return found;
  }

  async findAllVipClients(): Promise<ClientFactoringConfigsEntity[]> {
    const result = await this.find({
      vip: true,
    });
    return result;
  }

  async findAllByClientSuccessTeams(
    clientSuccessTeamIds: string[],
  ): Promise<ClientFactoringConfigsEntity[]> {
    const result = await this.find({
      clientSuccessTeam: { id: { $in: clientSuccessTeamIds } },
    });
    return result;
  }

  async findClientSuccessTeamNameByClientId(
    clientId: string,
  ): Promise<string | null> {
    const result = await this.repository.findOne(
      {
        clientId,
      },
      {
        populate: ['clientSuccessTeam.name'],
      },
    );
    return result?.clientSuccessTeam?.name ?? null;
  }

  updateClientSuccessTeam(
    entity: ClientFactoringConfigsEntity,
    clientSuccessTeamId: string,
  ) {
    this.assign(entity, { clientSuccessTeam: clientSuccessTeamId });
  }

  updateClientSalesRep(
    entity: ClientFactoringConfigsEntity,
    salesRepId: string,
  ) {
    this.assign(entity, { salesRep: salesRepId });
  }

  private buildFindOptions(
    options?: ClientFactoringConfigFindOptions,
  ): FindOptions<ClientFactoringConfigsEntity, any> {
    const populate: Paths<ClientFactoringConfigsEntity>[] = [];
    if (options?.history) {
      populate.push(
        'clientLimitHistory',
        'statusHistory',
        'statusHistory.clientStatusReasonConfig',
        'statusHistory.config',
        'reserveRateHistory',
        'reserveRateHistory.reserveRateReason',
        'factoringRateHistory',
        'paymentPlanHistory',
        'underwriting',
      );
      if (options?.audit) {
        populate.push('reserveRateHistory.createdBy');
      }
    }
    if (options?.audit) {
      populate.push('createdBy', 'updatedBy');
    }

    if (options?.user) {
      populate.push('user');
    }

    return {
      populate,
    };
  }
}
