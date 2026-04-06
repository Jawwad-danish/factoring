import { DataMapperUtil } from '@common/mappers';
import { DataMapper } from '@core/mapping';
import { UserMapper } from '@module-common';
import {
  ClientFactoringConfigsEntity,
  ClientFactoringConfigsRepository,
  ClientFactoringStatus,
  EmployeeRepository,
  UserEntity,
} from '@module-persistence';
import { Injectable } from '@nestjs/common';
import Big from 'big.js';
import { ClientFactoringConfig } from '../client-factoring-config.model';
import { ClientFactoringRateHistory } from '../client-factoring-rate-history.model';
import { ClientFactoringUnderwritingNotes } from '../client-factoring-underwriting-notes.model';
import { ClientLimitHistory } from '../client-limit-history.model';
import { ClientPaymentPlanHistory } from '../client-payment-plan-history.model';
import { ClientReserveRateHistory } from '../client-reserve-rate-history.model';
import { ClientSalesRep } from '../client-sales-rep.model';
import { ClientStatusHistory } from '../client-status-history.model';
import { ClientSuccessTeam } from '../client-success-team.model';
import { ClientConfigUser } from '../create-client-factoring-config-and-user.model';
import { CreateClientFactoringConfigRequest } from '../web';

@Injectable()
export class ClientFactoringConfigMapper
  implements DataMapper<ClientFactoringConfigsEntity, ClientFactoringConfig>
{
  constructor(
    private readonly userMapper: UserMapper,
    private readonly clientFactoringConfigsRepository: ClientFactoringConfigsRepository,
    private readonly employeeRepository: EmployeeRepository,
  ) {}

  async entityToModel(
    entity: ClientFactoringConfigsEntity,
  ): Promise<ClientFactoringConfig> {
    let salesRep: ClientSalesRep | null = null;
    if (entity.salesRep) {
      const employee = await this.employeeRepository.getOneById(
        entity.salesRep.id,
      );
      salesRep = new ClientSalesRep({
        id: entity.salesRep.id,
        name: employee.user.getFullName(),
        email: employee.user.email,
      });
    }
    const model = new ClientFactoringConfig({
      factoringRatePercentage: entity.factoringRatePercentage,
      clientLimitAmount: entity.clientLimitAmount,
      verificationPercentage: entity.verificationPercentage,
      reserveRatePercentage: entity.reserveRatePercentage,
      leadAttribution: entity.leadAttribution,
      vip: entity.vip,
      requiresVerification: entity.requiresVerification,
      status: entity.status,
      createdAt: entity.createdAt,
      createdBy: await this.userMapper.createdByToModel(entity),
      updatedAt: entity.updatedAt,
      updatedBy: await this.userMapper.updatedByToModel(entity),
      clientSuccessTeam: new ClientSuccessTeam({
        id: entity.clientSuccessTeam.id,
        name: entity.clientSuccessTeam.name,
      }),
      clientSalesRep: salesRep,
      expediteTransferOnly: entity.expediteTransferOnly,
      doneSubmittingInvoices: entity.doneSubmittingInvoices,
      acceptedFeeIncrease: entity.acceptedFeeIncrease,
      ccInEmails: entity.ccInEmails,
      paymentPlan: entity.paymentPlan,

      // Insurance
      insuranceAgency: entity.insuranceAgency,
      insuranceCompany: entity.insuranceCompany,
      insuranceMonthlyPaymentPerTruck: entity.insuranceMonthlyPaymentPerTruck,
      insuranceRenewalDate: entity.insuranceRenewalDate,

      // Underwriting
      ofacVerified: entity.ofacVerified,
      carrier411Alerts: entity.carrier411Alerts,
      taxGuardAlerts: entity.taxGuardAlerts,

      // Fleet
      dryvanTrucksAmount: entity.dryvanTrucksAmount,
      refrigeratedTrucksAmount: entity.refrigeratedTrucksAmount,
      flatbedTrucksAmount: entity.flatbedTrucksAmount,
      stepdeckTrucksAmount: entity.stepdeckTrucksAmount,
      otherTrucksAmount: entity.otherTrucksAmount,
      leasedTrucksAmount: entity.leasedTrucksAmount,
      totalTrucksAmount: entity.totalTrucksAmount,
      factoringRateHistory: await DataMapperUtil.asyncMapCollections(
        entity.factoringRateHistory,
        async (item) =>
          new ClientFactoringRateHistory({
            id: item.id,
            factoringRatePercentage: item.factoringRatePercentage,
            factoringRateReason: item.reason.reason,
            createdBy: await this.userMapper.createdByToModel(item),
            createdAt: item.createdAt,
            note: item.note,
          }),
      ),
      reserveRateHistory: await DataMapperUtil.asyncMapCollections(
        entity.reserveRateHistory,
        async (item) =>
          new ClientReserveRateHistory({
            id: item.id,
            reserveRatePercentage: item.reserveRatePercentage,
            reserveRateReason: item.reserveRateReason.reason,
            createdBy: await this.userMapper.createdByToModel(item),
            createdAt: item.createdAt,
            note: item.note,
          }),
      ),
      statusHistory: await DataMapperUtil.asyncMapCollections(
        entity.statusHistory,
        async (item) =>
          new ClientStatusHistory({
            id: item.id,
            status: item.clientStatusReasonConfig.status,
            statusReason: item.clientStatusReasonConfig.reason,
            createdBy: await this.userMapper.createdByToModel(item),
            createdAt: item.createdAt,
            note: item.note,
          }),
      ),
      clientLimitHistory: await DataMapperUtil.asyncMapCollections(
        entity.clientLimitHistory,
        async (item) =>
          new ClientLimitHistory({
            id: item.id,
            createdBy: await this.userMapper.createdByToModel(item),
            createdAt: item.createdAt,
            amount: item.clientLimitAmount,
            note: item.note,
          }),
      ),
      paymentPlanHistory: await DataMapperUtil.asyncMapCollections(
        entity.paymentPlanHistory,
        async (item) =>
          new ClientPaymentPlanHistory({
            id: item.id,
            createdBy: await this.userMapper.createdByToModel(item),
            createdAt: item.createdAt,
            paymentPlan: item.paymentPlan,
            note: item.note,
          }),
      ),
      underwritingNotes: await DataMapperUtil.asyncMapCollections(
        entity.underwriting,
        async (item) =>
          new ClientFactoringUnderwritingNotes({
            id: item.id,
            createdBy: await this.userMapper.createdByToModel(item),
            createdAt: item.createdAt,
            notes: item.notes,
            subject: item.subject,
          }),
      ),
    });

    return model;
  }

  async buildFromCreateConfig(
    payload: CreateClientFactoringConfigRequest,
  ): Promise<ClientConfigUser> {
    const userEntity = new UserEntity();
    userEntity.email = payload.user.email;
    userEntity.id = payload.user.id;
    let firstName;
    let lastName;
    if (payload.user.employee?.firstName || payload.user.employee?.lastName) {
      firstName = payload.user.employee.firstName;
      lastName = payload.user.employee.lastName;
    } else if (payload.user.client?.shortenedName) {
      firstName = payload.user.client.shortenedName;
      lastName = null;
    } else {
      console.log(
        `Could not find name for user ${payload.user.id}. Null will be used`,
      );
      firstName = null;
      lastName = null;
    }
    userEntity.firstName = firstName;
    userEntity.lastName = lastName;
    userEntity.createdAt = payload.user.createdAt;
    userEntity.updatedAt = payload.user.updatedAt;

    const clientConfigEntity = new ClientFactoringConfigsEntity();
    clientConfigEntity.clientId = payload.client.clientId;
    clientConfigEntity.status =
      this.clientFactoringStatusMapping[payload.client.status];
    clientConfigEntity.factoringRatePercentage = new Big(
      payload.client.factoringRatePercentage,
    );
    clientConfigEntity.reserveRatePercentage = new Big(
      payload.client.reserveRatePercentage,
    );
    clientConfigEntity.verificationPercentage = new Big(0);
    clientConfigEntity.vip = payload.client.vip;
    clientConfigEntity.requiresVerification =
      payload.client.requiresVerification;
    clientConfigEntity.ccInEmails = payload.client.ccInEmails;
    clientConfigEntity.acceptedFeeIncrease = payload.client.acceptedFeeIncrease;
    clientConfigEntity.leadAttribution = payload.client.leadAttribution;
    clientConfigEntity.expediteTransferOnly =
      payload.client.expediteTransferOnly;
    clientConfigEntity.doneSubmittingInvoices =
      payload.client.doneSubmittingInvoices;
    clientConfigEntity.createdAt = payload.client.createdAt;
    clientConfigEntity.updatedAt = payload.client.updatedAt;

    // Initialize insurance fields with defaults
    clientConfigEntity.insuranceAgency = payload.client.insuranceAgency ?? null;
    clientConfigEntity.insuranceCompany =
      payload.client.insuranceCompany ?? null;
    clientConfigEntity.insuranceMonthlyPaymentPerTruck = new Big(
      payload.client.insuranceMonthlyPaymentPerTruck ?? 0,
    );
    clientConfigEntity.insuranceRenewalDate =
      payload.client.insuranceRenewalDate ?? null;

    // Initialize underwriting fields
    clientConfigEntity.ofacVerified = payload.client.ofacVerified;
    clientConfigEntity.carrier411Alerts = payload.client.carrier411Alerts;
    clientConfigEntity.taxGuardAlerts = payload.client.taxGuardAlerts;

    // Initialize fleet fields with defaults
    clientConfigEntity.dryvanTrucksAmount = payload.client.dryvanTrucksAmount;
    clientConfigEntity.refrigeratedTrucksAmount =
      payload.client.refrigeratedTrucksAmount;
    clientConfigEntity.flatbedTrucksAmount = payload.client.flatbedTrucksAmount;
    clientConfigEntity.stepdeckTrucksAmount =
      payload.client.stepdeckTrucksAmount;
    clientConfigEntity.leasedTrucksAmount = payload.client.leasedTrucksAmount;
    clientConfigEntity.otherTrucksAmount = payload.client.otherTrucksAmount;
    if (payload.client.successTeamId) {
      this.clientFactoringConfigsRepository.assign(clientConfigEntity, {
        clientSuccessTeam: payload.client.successTeamId,
      });
    }
    if (payload.client.userId) {
      this.clientFactoringConfigsRepository.assign(clientConfigEntity, {
        createdBy: payload.client.userId,
      });
      this.clientFactoringConfigsRepository.assign(clientConfigEntity, {
        updatedBy: payload.client.userId,
      });
    }

    if (payload.client.salesRepId) {
      this.clientFactoringConfigsRepository.assign(clientConfigEntity, {
        salesRep: payload.client.salesRepId,
      });
    }
    clientConfigEntity.user = userEntity;

    return {
      clientConfig: clientConfigEntity,
      user: userEntity,
    };
  }

  clientFactoringStatusMapping: {
    [key: string]: ClientFactoringStatus;
  } = {
    pending: ClientFactoringStatus.Onboarding,
    active: ClientFactoringStatus.Active,
    'on hold': ClientFactoringStatus.Hold,
    'out of business': ClientFactoringStatus.Hold,
    released: ClientFactoringStatus.Released,
  };
}
