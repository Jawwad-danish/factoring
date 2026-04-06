import { monthDayYear } from '@core/formatting';
import { ReserveReason } from '@module-persistence';
import {
  CreateReserveRequest,
  DirectPaymentByClientPayload,
  NonFactoredPaymentReservePayload,
  ReleaseOfFundsTo3rdPartyReservePayload,
  ReservePayloadType,
} from '@module-reserves/data';
import Big from 'big.js';
import { UnknownReserveTypeError } from '../../../errors';

interface ReserveData {
  amount: Big;
  reason: ReserveReason;
  note: string;
}

export const reserveDataFromRequest = (
  request: CreateReserveRequest,
): ReserveData => {
  switch (request.payload.payloadType) {
    case ReservePayloadType.ReleaseOfFunds:
      return {
        amount: requestAmountToNegatedAmount(request),
        reason: ReserveReason.ReleaseOfFunds,
        note: request.note || '',
      };

    case ReservePayloadType.ReleaseOfFundsTo3rdParty:
      const rofpPayload =
        request.payload as ReleaseOfFundsTo3rdPartyReservePayload;
      return {
        amount: requestAmountToNegatedAmount(request),
        reason: ReserveReason.ReleaseToThirdParty,
        note: rofpPayload.thirdParty,
      };

    case ReservePayloadType.NonFactoredPayment:
      const nfpPayload = request.payload as NonFactoredPaymentReservePayload;
      return {
        amount: request.amount,
        reason: ReserveReason.NonFactoredPayment,
        note: `${nfpPayload.brokerName}, load ${nfpPayload.loadNumber} via ${
          nfpPayload.type
        } on ${monthDayYear(nfpPayload.batchDate)}`,
      };

    case ReservePayloadType.Overadvance:
      return {
        amount: requestAmountToNegatedAmount(request),
        reason: ReserveReason.OverAdvance,
        note: ``,
      };

    case ReservePayloadType.DirectPaymentByClient:
      const dpPayload = request.payload as DirectPaymentByClientPayload;
      return {
        amount: request.amount,
        reason: ReserveReason.DirectPaymentByClient,
        note: `Received on ${monthDayYear(dpPayload.receivedDate)}`,
      };

    case ReservePayloadType.ClientCredit:
      return {
        amount: request.amount,
        reason: ReserveReason.ClientCredit,
        note: request.note || '',
      };

    case ReservePayloadType.WriteOff:
      return {
        amount: request.amount,
        reason: ReserveReason.WriteOff,
        note: request.note || '',
      };

    case ReservePayloadType.Fee:
      return {
        amount: requestAmountToNegatedAmount(request),
        reason: ReserveReason.Fee,
        note: request.note || '',
      };

    case ReservePayloadType.BrokerClaim:
      return {
        amount: requestAmountToNegatedAmount(request),
        reason: ReserveReason.BrokerClaim,
        note: request.note || '',
      };
    case ReservePayloadType.TransferFromPositive:
      return {
        amount: requestAmountToNegatedAmount(request),
        reason: ReserveReason.BalanceTransferFromPositive,
        note: request.note || '',
      };

    case ReservePayloadType.TransferToPositive:
      return {
        amount: request.amount,
        reason: ReserveReason.BalanceTransferToPositive,
        note: request.note || '',
      };
    case ReservePayloadType.TransferFrom:
      return {
        amount: request.amount,
        reason: ReserveReason.BalanceTransferFrom,
        note: request.note || '',
      };

    case ReservePayloadType.TransferTo:
      return {
        amount: requestAmountToNegatedAmount(request),
        reason: ReserveReason.BalanceTransferTo,
        note: request.note || '',
      };

    default:
      throw new UnknownReserveTypeError(request.payload.payloadType);
  }
};

const requestAmountToNegatedAmount = (request: CreateReserveRequest): Big => {
  return request.amount.times(-1);
};
