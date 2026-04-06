import { RequestBuilderMixin } from '@core/test';
import { BrokerPaymentType } from '@module-persistence/entities';
import Big, { BigSource } from 'big.js';
import { UUID } from '@core/uuid';
import {
  BrokerClaimPayload,
  ClientCreditReservePayload,
  CreateReserveRequest,
  DirectPaymentByClientPayload,
  FeeReservePayload,
  NonFactoredPaymentReservePayload,
  OveradvanceReservePayload,
  ReleaseOfFundsPayload,
  ReleaseOfFundsTo3rdPartyReservePayload,
  ReservePayloadType,
  TransferFromPayload,
  TransferToPayload,
  WriteOffPayload,
} from '../data';
export class CreateReserveRequestBuilder extends RequestBuilderMixin<CreateReserveRequest>(
  () => {
    return new CreateReserveRequest();
  },
) {
  static releaseOfFunds(amount?: BigSource) {
    return CreateReserveRequestBuilder.from({
      amount: amount ? new Big(amount) : new Big(100),
      note: 'Release of funds',
      payload: new ReleaseOfFundsPayload({
        payloadType: ReservePayloadType.ReleaseOfFunds,
      }),
    });
  }

  static releaseOfFundsTo3rdParty(amount?: BigSource) {
    return CreateReserveRequestBuilder.from({
      amount: amount ? new Big(amount) : new Big(100),
      note: 'Release of funds to 3rd party',
      payload: new ReleaseOfFundsTo3rdPartyReservePayload({
        payloadType: ReservePayloadType.ReleaseOfFundsTo3rdParty,
        thirdParty: 'Third party',
      }),
    });
  }

  static nonFactoredPayment(amount?: BigSource) {
    return CreateReserveRequestBuilder.from({
      amount: amount ? new Big(amount) : new Big(100),
      note: 'Non factored payment',
      payload: new NonFactoredPaymentReservePayload({
        batchDate: new Date(),
        brokerName: 'Broker',
        checkNumber: '01',
        loadNumber: 'inv01',
        payloadType: ReservePayloadType.NonFactoredPayment,
        type: BrokerPaymentType.Ach,
      }),
    });
  }

  static clientCredit(amount?: BigSource) {
    return CreateReserveRequestBuilder.from({
      amount: amount ? new Big(amount) : new Big(100),
      note: 'Client Credit',
      payload: new ClientCreditReservePayload({
        payloadType: ReservePayloadType.ClientCredit,
      }),
    });
  }
  static overadvance(amount?: BigSource) {
    return CreateReserveRequestBuilder.from({
      amount: amount ? new Big(amount) : new Big(100),
      note: 'Overadvance',
      payload: new OveradvanceReservePayload({
        payloadType: ReservePayloadType.Overadvance,
      }),
    });
  }
  static fee(amount?: BigSource) {
    return CreateReserveRequestBuilder.from({
      amount: amount ? new Big(amount) : new Big(100),
      note: 'Fee',
      payload: new FeeReservePayload({
        payloadType: ReservePayloadType.Fee,
      }),
    });
  }

  static directPayment(amount?: BigSource) {
    return CreateReserveRequestBuilder.from({
      amount: amount ? new Big(amount) : new Big(100),
      note: 'DirectPayment',
      payload: new DirectPaymentByClientPayload({
        receivedDate: new Date(),
        payloadType: ReservePayloadType.DirectPaymentByClient,
      }),
    });
  }

  static writeOff(amount?: BigSource) {
    return CreateReserveRequestBuilder.from({
      amount: amount ? new Big(amount) : new Big(100),
      note: 'Write off',
      payload: new WriteOffPayload({
        payloadType: ReservePayloadType.WriteOff,
      }),
    });
  }

  static brokerClaim(amount?: BigSource) {
    return CreateReserveRequestBuilder.from({
      amount: amount ? new Big(amount) : new Big(100),
      note: 'Broker claim',
      payload: new BrokerClaimPayload({
        payloadType: ReservePayloadType.BrokerClaim,
        brokerId: UUID.get(),
      }),
    });
  }

  static transferToPositive(amount?: BigSource) {
    return CreateReserveRequestBuilder.from({
      amount: amount ? new Big(amount) : new Big(100),
      note: 'Transfer to positive',
      payload: new TransferToPayload({
        payloadType: ReservePayloadType.TransferToPositive,
      }),
    });
  }

  static transferFromPositive(amount?: BigSource) {
    return CreateReserveRequestBuilder.from({
      amount: amount ? new Big(amount) : new Big(100),
      note: 'Transfer from positive',
      payload: new TransferFromPayload({
        payloadType: ReservePayloadType.TransferFromPositive,
        transferClientId: UUID.get(),
      }),
    });
  }

  static transferTo(amount?: BigSource) {
    return CreateReserveRequestBuilder.from({
      amount: amount ? new Big(amount) : new Big(100),
      note: 'Transfer to',
      payload: new TransferToPayload({
        payloadType: ReservePayloadType.TransferTo,
      }),
    });
  }

  static transferFrom(amount?: BigSource) {
    return CreateReserveRequestBuilder.from({
      amount: amount ? new Big(amount) : new Big(100),
      note: 'Transfer from',
      payload: new TransferFromPayload({
        payloadType: ReservePayloadType.TransferFrom,
        transferClientId: UUID.get(),
      }),
    });
  }
}
