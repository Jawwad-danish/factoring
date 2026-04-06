import { getCurrentUTCDate } from '@core/date-time';
import { CrossCuttingConcerns } from '@core/util';
import { ValidationError } from '@core/validation';
import { ClientService } from '@module-clients';
import { TransferTimeService } from '@module-common';
import { BasicCommandHandler } from '@module-cqrs';
import {
  ClientBatchPaymentEntity,
  ClientPaymentEntity,
  PaymentType,
} from '@module-persistence/entities';
import { Logger } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import dayjs from 'dayjs';
import { TransfersApi } from '../../../../api';
import { TransferConfigurer } from '../../../transfer-configurer';
import {
  TransferDataAccess,
  TransferDataMapper,
  TransferDestination,
  TransferEntitiesUtil as TransferEntities,
  TransferEntitiesUtil,
} from '../../common';
import { InitiateDebitRegularTransferCommand } from '../../initiate-debit-regular-transfer.command';

interface Context {
  batchPayment: ClientBatchPaymentEntity;
  clientPayment: ClientPaymentEntity;
  validBankAccount: TransferDestination;
}

@CommandHandler(InitiateDebitRegularTransferCommand)
export class InitiateDebitRegularTransferCommandHandler
  implements BasicCommandHandler<InitiateDebitRegularTransferCommand>
{
  private logger = new Logger(InitiateDebitRegularTransferCommandHandler.name);

  constructor(
    private readonly clientService: ClientService,
    private readonly dataAccess: TransferDataAccess,
    private readonly transfersAPI: TransfersApi,
    private readonly transferConfigurer: TransferConfigurer,
    private readonly transferTimeService: TransferTimeService,
  ) {}

  async execute(
    command: InitiateDebitRegularTransferCommand,
  ): Promise<ClientBatchPaymentEntity> {
    const context = await this.createContext(command);
    await this.initiateTransfer(context);
    this.dataAccess.persist(context.batchPayment);
    return context.batchPayment;
  }

  private async createContext({
    request,
  }: InitiateDebitRegularTransferCommand): Promise<Context> {
    const client = await this.clientService.getOneById(request.clientId, {
      includeBankAccounts: true,
    });

    const bankAccount = client.bankAccounts?.find(
      (bankAccount) => bankAccount.id === request.bankAccountId,
    );

    if (!bankAccount) {
      throw new ValidationError(
        'debit-regular-transfer',
        `Bank account ${request.bankAccountId} could not be found for client ${request.clientId}`,
      );
    }

    const batchPayment = TransferEntities.createBatchPayment(
      PaymentType.DEBIT,
      request.id,
    );

    const transferDestination = TransferDataMapper.asTransferDestination(
      client,
      bankAccount,
    );

    if (!transferDestination) {
      this.logger.warn(
        `Client does not have a valid bank account. The debit transfer will not be executed`,
        {
          bankAccountId: bankAccount.id,
          batchPaymentId: batchPayment.id,
          clientId: client.id,
        },
      );
      throw new ValidationError(
        'debit-regular-transfer',
        'Selected bank account is not valid',
      );
    }

    const currentDate = getCurrentUTCDate().toDate();

    const expectedArrivalDate =
      this.transferTimeService.getRegularArrivalTime(currentDate);

    // Debit transfers are expected to arrive in 3 days
    batchPayment.expectedPaymentDate = dayjs(expectedArrivalDate)
      .add(3, 'days')
      .toDate();

    const clientPayment = TransferEntitiesUtil.createDebitClientPayment(
      request.amount,
      {
        id: request.clientId,
        bankAccountId: bankAccount.id,
        lastFourDigits: transferDestination.account.slice(-4),
      },
      batchPayment,
    );

    return {
      batchPayment: batchPayment,
      clientPayment: clientPayment,
      validBankAccount: transferDestination,
    };
  }

  @CrossCuttingConcerns({
    logging: (batchPayment: ClientBatchPaymentEntity) => {
      return {
        message: 'Initiating debit regular transfer',
        payload: {
          batchPaymentId: batchPayment.id,
        },
      };
    },
  })
  private async initiateTransfer({
    batchPayment,
    validBankAccount,
  }: Context): Promise<void> {
    const originatingAccountId =
      await this.transferConfigurer.internalAccountId();

    await this.transfersAPI.createAchBatch(
      batchPayment.id,
      TransferDataMapper.batchPaymentToDebitACH(
        batchPayment,
        originatingAccountId,
        validBankAccount,
        `${this.transferConfigurer.webHookUrl()}/transfers/update-status`,
      ),
    );
  }
}
