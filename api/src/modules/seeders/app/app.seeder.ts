import { environment } from '@core/environment';
import { UserRepository } from '@module-persistence';
import {
  ClientFactoringConfigsEntity,
  InvoiceEntity,
  UserEntity,
} from '@module-persistence/entities';
import { Injectable } from '@nestjs/common';
import pLimit from 'p-limit';
import { UUID } from '@core/uuid';
import * as broker from '../../../scripts/mock-server/resources/broker.json';
import * as client from '../../../scripts/mock-server/resources/clients/client.json';
import { PartialClientFactoringConfigsEntity } from '../../persistence/test';
import { PendingBuyoutBatchSeeder } from '../buyouts';
import { ClientFactoringConfigsSeeder } from '../client-factoring-config';
import { ClientSuccessTeamsSeeder } from '../client-success-teams';
import { randomLoadNumber } from '../common/random';
import * as e2eUserData from '../common/resources/e2e-user.json';
import { FactoringCompanySeeder } from '../factoring-company';
import { InvoiceSeeder } from '../invoices';
import { UserSeeder } from '../users';

export interface AppSeederOptions {
  numberOfInvoices: number;
  numberOfPendingBuyouts: number;
}

export interface SeedResult {
  invoices: InvoiceEntity[];
}

@Injectable()
export class AppSeeder {
  constructor(
    private readonly invoiceSeeder: InvoiceSeeder,
    private readonly clientSuccessTeamSeeder: ClientSuccessTeamsSeeder,
    private readonly clientFactoringConfigsSeeder: ClientFactoringConfigsSeeder,
    private readonly pendingBuyoutBatchSeeder: PendingBuyoutBatchSeeder,
    private readonly factoringCompanySeeder: FactoringCompanySeeder,
    private readonly userSeeder: UserSeeder,
    private readonly userRepository: UserRepository,
  ) {}

  async default(): Promise<SeedResult> {
    return this.seed({
      numberOfInvoices: 100,
      numberOfPendingBuyouts: 0,
    });
  }

  async seed(options: AppSeederOptions): Promise<SeedResult> {
    const limit = pLimit(5);
    const invoicePromises: Promise<InvoiceEntity>[] = [];
    const systemUser = await this.userRepository.findOneById(
      environment.core.systemId(),
    );

    if (!systemUser) {
      throw new Error(
        'System user could not be found. Please run the migrations before seeding the database',
      );
    }
    const systemUserAuditData = {
      createdBy: systemUser,
      updatedBy: systemUser,
    };

    let userData: Partial<UserEntity> = {
      email: client.clientContacts[0].email!,
      firstName: client.name,
      lastName: client.shortName,
      ...systemUserAuditData,
    };

    if (environment.isTest()) {
      userData = { ...systemUserAuditData, ...e2eUserData };
    }

    const factoringConfigData: Partial<ClientFactoringConfigsEntity> = {
      ...systemUserAuditData,
      clientId: client.id,
    };

    const factoringUser = await this.userSeeder.create(userData);
    factoringConfigData.user = factoringUser;

    for (let i = 0; i < options.numberOfInvoices; i++) {
      const clientID = client.id;
      const brokerID = broker.id;

      const loadNumber = randomLoadNumber();
      invoicePromises.push(
        limit(() =>
          this.invoiceSeeder.createInvoice(
            {
              ...systemUserAuditData,
              loadNumber: loadNumber,
            },
            clientID,
            brokerID,
          ),
        ),
      );
    }
    const invoices: InvoiceEntity[] = await Promise.all(invoicePromises);
    const clientSuccessTeam = await this.clientSuccessTeamSeeder.create({
      ...systemUserAuditData,
      name: `Team 101 - seeder ${UUID.get()}`,
    });

    factoringConfigData.clientSuccessTeam = clientSuccessTeam;

    await this.clientFactoringConfigsSeeder.create(
      factoringConfigData as PartialClientFactoringConfigsEntity,
    );

    const factoringCompany = await this.factoringCompanySeeder.create({
      ...systemUserAuditData,
    });

    await this.pendingBuyoutBatchSeeder.create(
      { ...systemUserAuditData, factoringCompany: factoringCompany },
      client.id,
      options.numberOfPendingBuyouts,
    );

    return {
      invoices,
    };
  }
}
