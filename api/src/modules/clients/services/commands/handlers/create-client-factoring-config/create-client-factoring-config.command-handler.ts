import {
  ClientConfigUser,
  ClientFactoringConfigMapper,
} from '@module-clients/data';
import {
  ClientFactoringConfigsEntity,
  ClientFactoringConfigsRepository,
  ClientFactoringRateReason,
  ClientFactoringRateReasonAssocEntity,
  ClientFactoringRateReasonRepository,
  ClientLimitAssocEntity,
  ClientPaymentPlanAssocEntity,
  ClientReserveRateReason,
  ClientReserveRateReasonAssocEntity,
  ClientReserveRateReasonRepository,
  ClientStatusReason,
  ClientStatusReasonAssocEntity,
  ClientStatusReasonConfigRepository,
  UserRepository,
} from '@module-persistence';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateClientFactoringConfigCommand } from '../../create-client-factoring-config.command';

@CommandHandler(CreateClientFactoringConfigCommand)
export class CreateClientFactoringConfigCommandHandler
  implements
    ICommandHandler<CreateClientFactoringConfigCommand, ClientConfigUser>
{
  constructor(
    private readonly clientFactoringConfigMapper: ClientFactoringConfigMapper,
    private readonly clientFactoringConfigsRepository: ClientFactoringConfigsRepository,
    private readonly userRepository: UserRepository,
    private readonly clientFactoringRateReasonRepository: ClientFactoringRateReasonRepository,
    private readonly clientReserveRateReasonRepository: ClientReserveRateReasonRepository,
    private readonly clientStatusReasonConfigRepository: ClientStatusReasonConfigRepository,
  ) {}

  async execute({
    request,
  }: CreateClientFactoringConfigCommand): Promise<ClientConfigUser> {
    const entities =
      await this.clientFactoringConfigMapper.buildFromCreateConfig(request);
    this.userRepository.persist(entities.user);

    await this.assignInitialHistory(entities.clientConfig);
    this.clientFactoringConfigsRepository.persist(entities.clientConfig);

    return entities;
  }

  private async assignInitialHistory(entity: ClientFactoringConfigsEntity) {
    const [
      statusHistory,
      factoringRateHistory,
      reserveRateHistory,
      clientLimitHistory,
      paymentPlanHistory,
    ] = await Promise.all([
      this.buildStatusHistory(entity),
      this.buildFactoringRateHistory(entity),
      this.buildReserveRateHistory(entity),
      this.buildClientLimitHistory(entity),
      this.buildPaymentPlanHistory(entity),
    ]);
    entity.statusHistory.add(statusHistory);
    entity.factoringRateHistory.add(factoringRateHistory);
    entity.reserveRateHistory.add(reserveRateHistory);
    entity.clientLimitHistory.add(clientLimitHistory);
    entity.paymentPlanHistory.add(paymentPlanHistory);
  }

  private async buildStatusHistory(
    clientConfigEntity: ClientFactoringConfigsEntity,
  ): Promise<ClientStatusReasonAssocEntity> {
    const reasonConfigEntity =
      await this.clientStatusReasonConfigRepository.getOneByStatusAndReason(
        ClientStatusReason.Other,
        clientConfigEntity.status,
      );
    const history = new ClientStatusReasonAssocEntity();
    history.note = '';
    history.config = clientConfigEntity;
    history.clientStatusReasonConfig = reasonConfigEntity;
    return history;
  }

  private async buildFactoringRateHistory(
    clientConfigEntity: ClientFactoringConfigsEntity,
  ): Promise<ClientFactoringRateReasonAssocEntity> {
    const reasonConfigEntity =
      await this.clientFactoringRateReasonRepository.getOneByReason(
        ClientFactoringRateReason.None,
      );
    const history = new ClientFactoringRateReasonAssocEntity();
    history.note = '';
    history.config = clientConfigEntity;
    history.reason = reasonConfigEntity;
    history.factoringRatePercentage =
      clientConfigEntity.factoringRatePercentage;
    return history;
  }

  private async buildReserveRateHistory(
    clientConfigEntity: ClientFactoringConfigsEntity,
  ): Promise<ClientReserveRateReasonAssocEntity> {
    const reasonConfigEntity =
      await this.clientReserveRateReasonRepository.getOneByReason(
        ClientReserveRateReason.None,
      );
    const history = new ClientReserveRateReasonAssocEntity();
    history.note = '';
    history.config = clientConfigEntity;
    history.reserveRateReason = reasonConfigEntity;
    history.reserveRatePercentage = clientConfigEntity.reserveRatePercentage;
    return history;
  }

  private async buildClientLimitHistory(
    clientConfigEntity: ClientFactoringConfigsEntity,
  ): Promise<ClientLimitAssocEntity> {
    const history = new ClientLimitAssocEntity();
    history.note = '';
    history.config = clientConfigEntity;
    history.clientLimitAmount = clientConfigEntity.clientLimitAmount;
    return history;
  }

  private async buildPaymentPlanHistory(
    clientConfigEntity: ClientFactoringConfigsEntity,
  ): Promise<ClientPaymentPlanAssocEntity> {
    const history = new ClientPaymentPlanAssocEntity();
    history.note = '';
    history.config = clientConfigEntity;
    history.paymentPlan = clientConfigEntity.paymentPlan;
    return history;
  }
}
