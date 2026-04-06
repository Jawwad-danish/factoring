import { dollarsToPennies } from '@core/formulas';
import { DataMapper } from '@core/mapping';
import { UserMapper } from '@module-common';
import { ReserveEntity } from '@module-persistence/entities';
import { Injectable } from '@nestjs/common';
import Big from 'big.js';
import { CreateReserveRequest } from '../create-reserve.request';
import {
  BaseReservePayload,
  ReservePayloadType,
} from '../reserve-payload.request';
import { Reserve } from '@fs-bobtail/factoring/data';
@Injectable()
export class ReserveMapper implements DataMapper<ReserveEntity, Reserve> {
  constructor(private userMapper: UserMapper) {}

  async entityToModel(entity: ReserveEntity, total?: Big): Promise<Reserve> {
    const reserve = new Reserve({
      id: entity.id,
      clientId: entity.clientId,
      amount: entity.amount,
      note: entity.note,
      payload: entity.payload,
      reason: entity.reason,
      createdAt: entity.createdAt,
      updatedAt: entity.createdAt,
      createdBy: await this.userMapper.createdByToModel(entity),
      updatedBy: await this.userMapper.createdByToModel(entity),
    });

    if (entity.reserveInvoice) {
      reserve.invoiceId = entity.reserveInvoice.invoice.id;
    }
    if (entity.reserveBrokerPayment) {
      reserve.brokerPaymentId = entity.reserveBrokerPayment.brokerPayment.id;
    }
    if (entity.reserveClientPayments.isInitialized()) {
      reserve.clientPaymentIds = entity.reserveClientPayments.map(
        (item) => item.clientPayment?.id ?? '',
      );
    }
    if (total) {
      reserve.total = total;
    }
    return reserve;
  }

  async mapReferralRewardToReserveRequest(
    amount: number,
    referralDisplayName: string | null,
    rewardId: string,
  ): Promise<CreateReserveRequest> {
    const createReserveRequest = new CreateReserveRequest();
    createReserveRequest.amount = dollarsToPennies(amount);
    createReserveRequest.note = `reward for referring ${referralDisplayName} reward ID ${rewardId}`;
    createReserveRequest.payload = {} as BaseReservePayload<ReservePayloadType>;
    createReserveRequest.payload.payloadType = ReservePayloadType.ClientCredit;

    return createReserveRequest;
  }
}
