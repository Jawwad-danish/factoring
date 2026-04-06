import {
  ClientFactoringConfigsEntity,
  ClientFactoringRateReasonAssocEntity,
  ClientLimitAssocEntity,
  ClientPaymentPlanAssocEntity,
  ClientReserveRateReasonAssocEntity,
  ClientStatusReason,
  ClientStatusReasonAssocEntity,
  ClientStatusReasonConfigEntity,
} from '@module-persistence/entities';
import {
  ClientFactoringConfigsRepository,
  ClientFactoringRateReasonRepository,
  ClientReserveRateReasonRepository,
  ClientStatusReasonAssocRepository,
  ClientStatusReasonConfigRepository,
} from '@module-persistence/repositories';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateClientFactoringConfigRequest } from '../../../../data';
import { UpdateClientFactoringConfigCommand } from '../../update-client-factoring-config.command';
import { UpdateClientFactoringConfigValidationService } from './validation';

@CommandHandler(UpdateClientFactoringConfigCommand)
export class UpdateClientFactoringConfigCommandHandler
  implements
    ICommandHandler<
      UpdateClientFactoringConfigCommand,
      ClientFactoringConfigsEntity
    >
{
  constructor(
    private readonly clientFactoringConfigRepository: ClientFactoringConfigsRepository,
    private readonly clientStatusReasonAssocRepository: ClientStatusReasonAssocRepository,
    private readonly clientFactoringRateReasonRepository: ClientFactoringRateReasonRepository,
    private readonly clientReserveRateReasonRepository: ClientReserveRateReasonRepository,
    private readonly clientStatusReasonConfigRepository: ClientStatusReasonConfigRepository,
    private readonly validationService: UpdateClientFactoringConfigValidationService,
  ) {}

  async execute(
    command: UpdateClientFactoringConfigCommand,
  ): Promise<ClientFactoringConfigsEntity> {
    const { clientId, request } = command;
    const config = await this.clientFactoringConfigRepository.getOneByClientId(
      clientId,
      {
        history: true,
      },
    );
    await this.validationService.validate([request, config]);
    await this.update(config, command);
    return config;
  }

  private async update(
    config: ClientFactoringConfigsEntity,
    { request }: UpdateClientFactoringConfigCommand,
  ) {
    const {
      status,
      statusReason,
      factoringRatePercentage,
      verificationPercentage,
      note,
      vip,
      requiresVerification,
      successTeamId,
      salesRepId,
      factoringRateReason,
      reserveRatePercentage,
      reserveRateReason,
      expediteTransferOnly,
      doneSubmittingInvoices,
      leadAttribution,
      acceptedFeeIncrease,
      ccInEmails,
      insuranceAgency,
      insuranceCompany,
      insuranceMonthlyPaymentPerTruck,
      insuranceRenewalDate,
      ofacVerified,
      carrier411Alerts,
      taxGuardAlerts,
      dryvanTrucksAmount,
      refrigeratedTrucksAmount,
      flatbedTrucksAmount,
      stepdeckTrucksAmount,
      otherTrucksAmount,
      leasedTrucksAmount,
      email,
    } = request;

    if (insuranceAgency) {
      config.insuranceAgency = insuranceAgency;
    }
    if (insuranceCompany) {
      config.insuranceCompany = insuranceCompany;
    }
    if (insuranceMonthlyPaymentPerTruck) {
      config.insuranceMonthlyPaymentPerTruck = insuranceMonthlyPaymentPerTruck;
    }
    if (insuranceRenewalDate) {
      config.insuranceRenewalDate = insuranceRenewalDate;
    }
    if (ofacVerified != null) {
      config.ofacVerified = ofacVerified;
    }
    if (carrier411Alerts != null) {
      config.carrier411Alerts = carrier411Alerts;
    }
    if (taxGuardAlerts != null) {
      config.taxGuardAlerts = taxGuardAlerts;
    }
    if (dryvanTrucksAmount) {
      config.dryvanTrucksAmount = dryvanTrucksAmount;
    }
    if (refrigeratedTrucksAmount) {
      config.refrigeratedTrucksAmount = refrigeratedTrucksAmount;
    }
    if (flatbedTrucksAmount) {
      config.flatbedTrucksAmount = flatbedTrucksAmount;
    }
    if (stepdeckTrucksAmount) {
      config.stepdeckTrucksAmount = stepdeckTrucksAmount;
    }
    if (leadAttribution !== undefined) {
      config.leadAttribution = leadAttribution;
    }
    if (otherTrucksAmount) {
      config.otherTrucksAmount = otherTrucksAmount;
    }
    if (leasedTrucksAmount) {
      config.leasedTrucksAmount = leasedTrucksAmount;
    }

    if (ccInEmails) {
      config.ccInEmails = ccInEmails;
    }
    if (verificationPercentage) {
      config.verificationPercentage = verificationPercentage;
    }
    if (factoringRatePercentage) {
      config.factoringRatePercentage = factoringRatePercentage;
    }
    if (acceptedFeeIncrease != null) {
      config.acceptedFeeIncrease = acceptedFeeIncrease;
    }
    if (email != null) {
      config.user.email = email;
    }
    if (factoringRateReason) {
      const factoringRateReasonEntity =
        await this.clientFactoringRateReasonRepository.getOneByReason(
          factoringRateReason,
        );

      const factoringRateAssocEntity =
        new ClientFactoringRateReasonAssocEntity();
      factoringRateAssocEntity.reason = factoringRateReasonEntity;
      factoringRateAssocEntity.config = config;
      factoringRateAssocEntity.note = note ?? '';
      factoringRateAssocEntity.factoringRatePercentage =
        factoringRatePercentage as Big;

      config.factoringRateHistory.add(factoringRateAssocEntity);
    }
    await this.maybeAssignFactoringRate(request, config);
    this.maybeAssignClientLimit(request, config);
    this.maybeAssignPaymentPlan(request, config);
    if (vip != null) {
      config.vip = vip;
    }
    if (requiresVerification != null) {
      config.requiresVerification = requiresVerification;
    }
    if (expediteTransferOnly != null) {
      config.expediteTransferOnly = expediteTransferOnly;
      if (expediteTransferOnly === false) {
        config.doneSubmittingInvoices = false;
      }
    }
    if (doneSubmittingInvoices != null) {
      config.doneSubmittingInvoices = doneSubmittingInvoices;
      if (doneSubmittingInvoices === false) {
        config.expediteTransferOnly = true;
      }
    }
    if (successTeamId) {
      this.clientFactoringConfigRepository.updateClientSuccessTeam(
        config,
        successTeamId,
      );
    }
    if (salesRepId) {
      this.clientFactoringConfigRepository.updateClientSalesRep(
        config,
        salesRepId,
      );
    }

    if (status && status !== config.status) {
      config.status = status;
      let reasonConfigEntity: ClientStatusReasonConfigEntity;
      if (statusReason) {
        reasonConfigEntity =
          await this.clientStatusReasonConfigRepository.getOneByStatusAndReason(
            statusReason,
            status,
          );
      } else {
        reasonConfigEntity =
          await this.clientStatusReasonConfigRepository.getOneByStatusAndReason(
            ClientStatusReason.Other,
            status,
          );
      }

      const reasonAssoc = new ClientStatusReasonAssocEntity();
      reasonAssoc.note = note ?? '';
      reasonAssoc.config = config;
      reasonAssoc.clientStatusReasonConfig = reasonConfigEntity;
      this.clientStatusReasonAssocRepository.persist(reasonAssoc);
    }

    if (reserveRatePercentage) {
      config.reserveRatePercentage = reserveRatePercentage;
    }

    if (reserveRateReason) {
      const reserveReasonEntity =
        await this.clientReserveRateReasonRepository.getOneByReason(
          reserveRateReason,
        );

      const reserveReasonAssocEntity = new ClientReserveRateReasonAssocEntity();
      reserveReasonAssocEntity.note = note || '';
      reserveReasonAssocEntity.reserveRatePercentage =
        reserveRatePercentage as Big;
      reserveReasonAssocEntity.reserveRateReason = reserveReasonEntity;

      config.reserveRateHistory.add(reserveReasonAssocEntity);
    }
  }

  private async maybeAssignFactoringRate(
    {
      note,
      factoringRateReason,
      factoringRatePercentage,
    }: UpdateClientFactoringConfigRequest,
    config: ClientFactoringConfigsEntity,
  ) {
    if (!factoringRateReason || !factoringRatePercentage) {
      return;
    }

    const factoringRateReasonEntity =
      await this.clientFactoringRateReasonRepository.getOneByReason(
        factoringRateReason,
      );

    const factoringRateAssocEntity = new ClientFactoringRateReasonAssocEntity();
    factoringRateAssocEntity.reason = factoringRateReasonEntity;
    factoringRateAssocEntity.config = config;
    factoringRateAssocEntity.note = note ?? '';
    factoringRateAssocEntity.factoringRatePercentage =
      factoringRatePercentage as Big;
    config.factoringRateHistory.add(factoringRateAssocEntity);
  }

  private maybeAssignClientLimit(
    { clientLimitAmount, clientLimitNote }: UpdateClientFactoringConfigRequest,
    config: ClientFactoringConfigsEntity,
  ) {
    if (clientLimitAmount === undefined) {
      return;
    }

    const history = new ClientLimitAssocEntity();
    history.note = clientLimitNote ?? '';
    history.clientLimitAmount = clientLimitAmount;
    config.clientLimitAmount = clientLimitAmount;
    config.clientLimitHistory.add(history);
  }

  private maybeAssignPaymentPlan(
    { paymentPlan }: UpdateClientFactoringConfigRequest,
    config: ClientFactoringConfigsEntity,
  ) {
    if (paymentPlan === undefined) {
      return;
    }

    const history = new ClientPaymentPlanAssocEntity();
    history.note = '';
    history.paymentPlan = paymentPlan;
    config.paymentPlan = paymentPlan;
    config.paymentPlanHistory.add(history);
  }
}
