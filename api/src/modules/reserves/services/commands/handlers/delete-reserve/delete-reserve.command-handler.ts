import { formatToDollars, monthDayYear } from '@core/formatting';
import { penniesToDollars } from '@core/formulas';
import { UUID } from '@core/uuid';
import { BasicCommandHandler } from '@module-cqrs';
import {
  ReserveEntity,
  ReserveReason,
  ReserveRepository,
} from '@module-persistence';
import { CommandHandler } from '@nestjs/cqrs';
import { DeleteReserveCommand } from '../../delete-reserve.command';
import { DeleteReserveValidationService } from './validation';

export const REVERSING_RESERVE_PAYLOAD_KEY = 'reversesReserveId';
export const REVERSED_RESERVE_PAYLOAD_KEY = 'reversedByReserveId';

@CommandHandler(DeleteReserveCommand)
export class DeleteReserveCommandHandler
  implements BasicCommandHandler<DeleteReserveCommand>
{
  constructor(
    private readonly repository: ReserveRepository,
    private readonly validationService: DeleteReserveValidationService,
  ) {}

  async execute(command: DeleteReserveCommand): Promise<ReserveEntity> {
    const reserve = await this.repository.getOneById(command.reserveId);
    await this.validationService.validate({
      command,
      reserve,
    });

    const toSaveReserve = this.buildReserve(reserve);
    reserve.payload = {
      ...reserve.payload,
      [REVERSED_RESERVE_PAYLOAD_KEY]: toSaveReserve.id,
    };
    this.repository.persist(toSaveReserve);
    return toSaveReserve;
  }

  private buildReserve(foundReserve: ReserveEntity): ReserveEntity {
    const entity = new ReserveEntity();
    entity.id = UUID.get();
    entity.clientId = foundReserve.clientId;
    entity.amount = foundReserve.amount.times(-1);
    entity.payload = {
      [REVERSING_RESERVE_PAYLOAD_KEY]: foundReserve.id,
    };
    entity.reason = this.getReason(foundReserve);
    entity.note = `Removed reserve of ${formatToDollars(
      penniesToDollars(foundReserve.amount),
    )} from ${monthDayYear(foundReserve.createdAt)}`;
    return entity;
  }

  private getReason(reserve: ReserveEntity): ReserveReason {
    switch (reserve.reason) {
      case ReserveReason.Fee:
        return ReserveReason.FeeRemoved;
      case ReserveReason.NonFactoredPayment:
        return ReserveReason.NonFactoredPaymentRemoved;
      case ReserveReason.OverAdvance:
        return ReserveReason.OverAdvanceRemoved;
      case ReserveReason.ClientCredit:
        return ReserveReason.ClientCreditRemoved;
      case ReserveReason.ReleaseOfFunds:
        return ReserveReason.ReleaseOfFundsRemoved;
      case ReserveReason.ReleaseToThirdParty:
        return ReserveReason.ReleaseToThirdPartyRemoved;
      case ReserveReason.DirectPaymentByClient:
        return ReserveReason.DirectPaymentByClientRemoved;
      case ReserveReason.BrokerClaim:
        return ReserveReason.BrokerClaimRemoved;
      case ReserveReason.WriteOff:
        return ReserveReason.WriteOffRemoved;
      case ReserveReason.ReserveFee:
        return ReserveReason.ReserveFeeRemoved;
      case ReserveReason.Chargeback:
        return ReserveReason.ChargebackRemoved;
    }
    return ReserveReason.PaymentRemoved;
  }
}
