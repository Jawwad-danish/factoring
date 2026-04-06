import { ValidationError } from '@core/validation';
import {
  CreatePaymentOrderRequest,
  PaymentOrder,
} from '@fs-bobtail/factoring/data';
import {
  Client,
  ClientBankAccountService,
  ClientService,
} from '@module-clients';
import { BasicCommandHandler } from '@module-cqrs';
import { PaymentOrderEntity } from '@module-persistence';
import { Logger } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import Big from 'big.js';
import {
  BatchTransferResponseV2,
  BofaTransferRequest,
  TransfersApi,
  TransferType,
} from '../../../../api';
import {
  TransferDataAccess,
  TransferDataMapper,
  TransferDestination,
  TransferEntitiesUtil,
} from '../../common';
import { CreatePaymentOrderCommand } from '../../create-payment-order.command';

interface Context {
  paymentId: string;
  paymentOrder: PaymentOrderEntity;
  validBankAccount: TransferDestination;
  client: Client;
  amount: number;
  transferType: TransferType;
}

@CommandHandler(CreatePaymentOrderCommand)
export class CreatePaymentOrderCommandHandler
  implements BasicCommandHandler<CreatePaymentOrderCommand>
{
  private logger = new Logger(CreatePaymentOrderCommandHandler.name);

  constructor(
    private readonly clientService: ClientService,
    private readonly clientBankAccountService: ClientBankAccountService,
    private readonly transfersAPI: TransfersApi,
    readonly dataAccess: TransferDataAccess,
  ) {}

  async execute({ request }: CreatePaymentOrderCommand): Promise<PaymentOrder> {
    const context = await this.createContext(request);
    const paymentResponse = await this.initiatePayment(context);
    this.dataAccess.persist(context.paymentOrder);
    return TransferDataMapper.bofaExpediteTransferToPaymentOrder(
      paymentResponse,
    );
  }

  private async createContext(
    request: CreatePaymentOrderRequest,
  ): Promise<Context> {
    const client = await this.clientService.getOneById(request.clientId);
    const bankAccount =
      await this.clientBankAccountService.getPrimaryFactoringBankAccountById(
        request.clientId,
        request.bankAccountId,
      );

    const validBankAccount = TransferDataMapper.asTransferDestination(
      client,
      bankAccount,
    );

    if (!validBankAccount) {
      throw new ValidationError(
        'expedite-transfer',
        'Client does not have a valid bank account',
      );
    }

    const paymentOrder = TransferEntitiesUtil.createClientPaymentOrder(
      Big(request.amount),
      {
        id: request.clientId,
        bankAccountId: bankAccount.id,
        lastFourDigits: bankAccount.modernTreasuryAccount.account.slice(-4),
      },
      request.transferType,
    );
    return {
      paymentId: paymentOrder.id,
      paymentOrder,
      validBankAccount,
      client,
      amount: request.amount,
      transferType: request.transferType,
    };
  }

  private async initiatePayment({
    paymentId,
    validBankAccount,
    client,
    amount,
    transferType,
  }: Context): Promise<BatchTransferResponseV2> {
    const payload: BofaTransferRequest =
      TransferDataMapper.paymentOrderToBankOfAmericaTransfer(
        paymentId,
        validBankAccount,
        client,
        amount,
        transferType,
      );
    this.logger.log(
      `Sending payment request to transfer service for clientId ${
        client.id
      }, transfer type ${transferType}, payload ${JSON.stringify(payload)}`,
    );
    let paymentResponse;
    switch (transferType) {
      case TransferType.Wire:
        paymentResponse = await this.transfersAPI.createBankOfAmericaWire(
          paymentId,
          payload,
        );
        break;
      case TransferType.Rtp:
        paymentResponse = await this.transfersAPI.createBankOfAmericaExpedite(
          paymentId,
          payload,
        );
        break;
      case TransferType.ACH:
      case TransferType.SameDayACH:
        paymentResponse = await this.transfersAPI.createBankOfAmericaAch(
          paymentId,
          payload,
        );
        break;
      default:
        this.logger.error(`Unsupported payment type ${transferType}`);
        throw new ValidationError(
          'create-payment-order',
          `Payment order failed for clientId ${client.id}, Unsupported payment type ${transferType}`,
        );
    }

    this.logger.log(
      `Payment order processed successfully for clientId ${client.id} with transfer type ${transferType}`,
    );
    return paymentResponse;
  }
}
