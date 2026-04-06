import { environment } from '@core/environment';
import {
  RecordStatus,
  ReserveBrokerPaymentEntity,
  ReserveClientPaymentEntity,
  ReserveEntity,
  ReserveInvoiceEntity,
  ReserveReason,
} from '@module-persistence';
import { REVERSING_RESERVE_PAYLOAD_KEY } from '@module-reserves/commands';
import { ReservePayloadType } from '@module-reserves/data';
import Big from 'big.js';
import { referenceUserData } from 'src/scripts/util';

export const buildEntity = (reserve: any): ReserveEntity => {
  const amount = new Big(reserve.amount);
  const entity = new ReserveEntity();
  entity.id = reserve.id;
  entity.amount = reserve.nacha_sign === '-' ? amount.times(-1) : amount;
  entity.note = reserve.notes || '';
  entity.createdAt = new Date(reserve.created_at);
  entity.clientId = reserve.client_id;
  entity.reason = mapReserveReason(reserve.reason);
  entity.payload = mapReservePayload(reserve.metadata, reserve.reason);
  entity.recordStatus = RecordStatus.Active;
  return entity;
};

export const buildReserveClientPaymentEntity = (reserve: any, em) => {
  const reserveClientPayment = new ReserveClientPaymentEntity();

  reserveClientPayment.createdAt = new Date(reserve.created_at);
  reserveClientPayment.createdAt = new Date(reserve.created_at);
  reserveClientPayment.amount = new Big(reserve.amount);
  referenceUserData(
    reserveClientPayment,
    {
      created_by: environment.core.systemId(),
      updated_by: environment.core.systemId(),
    },
    em,
  );
  return reserveClientPayment;
};

export const buildReserveInvoiceEntity = (reserve: any, em) => {
  const reserveInvoiceEntity = new ReserveInvoiceEntity();
  reserveInvoiceEntity.createdAt = new Date(reserve.created_at);
  reserveInvoiceEntity.createdAt = new Date(reserve.created_at);
  referenceUserData(
    reserveInvoiceEntity,
    {
      created_by: environment.core.systemId(),
      updated_by: environment.core.systemId(),
    },
    em,
  );
  return reserveInvoiceEntity;
};

export const buildReserveBrokerPaymentEntity = (reserve: any, em) => {
  const reserveBrokerPayment = new ReserveBrokerPaymentEntity();

  reserveBrokerPayment.createdAt = new Date(reserve.created_at);
  reserveBrokerPayment.createdAt = new Date(reserve.created_at);
  referenceUserData(
    reserveBrokerPayment,
    {
      created_by: environment.core.systemId(),
      updated_by: environment.core.systemId(),
    },
    em,
  );
  return reserveBrokerPayment;
};

const mapReservePayload = (
  metadata: any,
  reason: string,
): Record<string, any> => {
  const payload = { ...metadata };
  if (metadata.deleted_id) {
    delete payload.deleted_id;
    payload[REVERSING_RESERVE_PAYLOAD_KEY] = metadata.deleted_id;
  }
  switch (reason) {
    case 'balance transfer to (positive)':
      payload.__payloadType = ReservePayloadType.TransferToPositive;
      return payload;
    case 'direct payment by client':
      payload.__payloadType = ReservePayloadType.DirectPaymentByClient;
      return payload;
    case 'debtor claim':
      payload.__payloadType = ReservePayloadType.BrokerClaim;
      return payload;
    case 'client credit':
      payload.__payloadType = ReservePayloadType.ClientCredit;
      return payload;
    case 'write off':
      payload.__payloadType = ReservePayloadType.WriteOff;
      return payload;
    case 'non-factored payment':
      payload.__payloadType = ReservePayloadType.NonFactoredPayment;
      return payload;
    case 'release of funds':
      payload.__payloadType = ReservePayloadType.ReleaseOfFunds;
      return payload;
    case 'release to 3rd party':
      payload.__payloadType = ReservePayloadType.ReleaseOfFundsTo3rdParty;
      return payload;
    case 'overadvance':
      payload.__payloadType = ReservePayloadType.Overadvance;
      return payload;
    case 'balance transfer from (positive)':
      payload.__payloadType = ReservePayloadType.TransferFromPositive;
      return payload;
    case 'fee':
      payload.__payloadType = ReservePayloadType.Fee;
      return payload;
    case 'balance transfer from':
      payload.__payloadType = ReservePayloadType.TransferFrom;
      return payload;
    case 'balance transfer to':
      payload.__payloadType = ReservePayloadType.TransferTo;
      return payload;
    default:
      return payload;
  }
};

const mapReserveReason = (reason: string): ReserveReason => {
  if (reason === 'debtor claim') {
    return ReserveReason.BrokerClaim;
  }
  if (reason === 'debtor claim removed') {
    return ReserveReason.BrokerClaimRemoved;
  }
  if (reason === 'reserve fee') {
    return ReserveReason.ReserveFee;
  }
  return reason as ReserveReason;
};
