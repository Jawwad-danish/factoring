import { ChangeActions } from '@common';
import { Assignment, Note } from '@core/data';
import { formatBusinessTime, getDateInBusinessTimezone } from '@core/date-time';
import {
  payableAmount,
  penniesToDollars,
  transferableAmount,
} from '@core/formulas';
import { Arrays, CrossCuttingConcerns, formatToDollars } from '@core/util';
import { Client, ClientService } from '@module-clients';
import { BasicCommandHandler } from '@module-cqrs';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import {
  ClientBatchPaymentEntity,
  ClientBatchPaymentStatus,
  ClientPaymentEntity,
  ClientPaymentStatus,
  InvoiceEntity,
  PaymentStatus,
  PaymentType,
  TagDefinitionKey,
} from '@module-persistence';
import { CommandHandler } from '@nestjs/cqrs';
import {
  BofaTransferRequest,
  ExpediteTransferDto,
  TransfersApi,
} from '../../../../api';
import { InitiateExpediteTransferCommand } from '../../initiate-expedite-transfer.command';

import { ValidationError } from '@core/validation';
import { ExpediteConfigurer } from '@module-common';
import {
  FEATURE_TOGGLES_SERVICE,
  FeatureTogglesService,
  LDFlags,
} from '@module-feature-toggles';
import { RtpSupportService } from '@module-rtp';
import { Inject, Logger } from '@nestjs/common';
import { TransferConfigurer } from '../../../transfer-configurer';
import {
  TransferDataAccess,
  TransferDataMapper,
  TransferDestination,
  TransferEntitiesUtil,
} from '../../common';
import { ClientBankAccount } from '@fs-bobtail/factoring/data';
import { InitiateExpediteTransferRequest } from '@module-transfers/data';

interface Context {
  batchPayment: ClientBatchPaymentEntity;
  clientPayment: ClientPaymentEntity;
  invoices: InvoiceEntity[];
  validBankAccount: TransferDestination;
  client: Client;
}

@CommandHandler(InitiateExpediteTransferCommand)
export class InitiateExpediteTransferCommandHandler
  implements BasicCommandHandler<InitiateExpediteTransferCommand>
{
  private logger = new Logger(InitiateExpediteTransferCommandHandler.name);

  constructor(
    readonly dataAccess: TransferDataAccess,
    readonly clientService: ClientService,
    private readonly invoiceChangeActionsExecutor: InvoiceChangeActionsExecutor,
    private readonly transfersAPI: TransfersApi,
    private readonly transferConfigurer: TransferConfigurer,
    private readonly expediteConfigurer: ExpediteConfigurer,
    @Inject(FEATURE_TOGGLES_SERVICE)
    private readonly featureTogglesService: FeatureTogglesService,
    private readonly rtpSupportService: RtpSupportService,
  ) {}

  async execute(
    command: InitiateExpediteTransferCommand,
  ): Promise<ClientBatchPaymentEntity> {
    const context = await this.createContext(command);
    await this.updateInvoices(context);
    await this.createPayments(context);
    await this.initiateTransfer(context);
    await this.updateClient(command.request.clientId);
    this.updatePayments(context.batchPayment);
    this.dataAccess.persist(context.batchPayment);
    return context.batchPayment;
  }

  private async updateClient(clientId: string) {
    const clientFactoringConfig =
      await this.dataAccess.getClientFactoringConfig(clientId);
    clientFactoringConfig.doneSubmittingInvoices = false;
    clientFactoringConfig.expediteTransferOnly = false;
  }

  private async createContext({
    request,
  }: InitiateExpediteTransferCommand): Promise<Context> {
    const invoices = await this.dataAccess.getClientInvoicesForExpediteTransfer(
      request.clientId,
    );
    if (invoices.length === 0) {
      // only check for recent transfers when no invoices are available
      await this.checkForRecentTransfers(request);
      throw new ValidationError(
        'expedite-transfer',
        `No invoices available for expedite transfer`,
      );
    }

    const client = await this.clientService.getOneById(request.clientId);
    const bankAccount = await this.clientService.getPrimaryBankAccount(
      request.clientId,
      false,
    );

    if (!bankAccount) {
      throw new ValidationError(
        'client-bank-account',
        `Client ${client.id} does not have a factoring bank account`,
      );
    }

    const supportsWire =
      bankAccount.modernTreasuryAccount?.confirmedWire ||
      bankAccount.wireRoutingNumber ||
      bankAccount.plaidAccount?.wireRoutingNumber;

    if (!supportsWire) {
      const RTPSupportedAccountIds =
        await this.rtpSupportService.verifyAccounts([
          {
            clientId: client.id,
            accountId: bankAccount.id,
            routingNumber: bankAccount.getRoutingNumber(),
            wireRoutingNumber: bankAccount.getWireRoutingNumber(),
            modernTreasuryExternalAccountId:
              bankAccount.modernTreasuryAccount?.externalAccountId,
          },
        ]);

      if (RTPSupportedAccountIds.length === 0) {
        throw new ValidationError(
          'client-bank-account',
          `Client ${client.id} does not have a factoring bank account with wire or RTP support`,
        );
      }
    }

    const transferDestination = TransferDataMapper.asTransferDestination(
      client,
      bankAccount,
    );

    this.validateTransferDestination(
      transferDestination,
      bankAccount,
      request.clientId,
    );

    const batchPayment = TransferEntitiesUtil.createBatchPayment(
      PaymentType.WIRE,
      request.id,
    );
    batchPayment.expectedPaymentDate = getDateInBusinessTimezone()
      .add(45, 'minutes')
      .toDate();

    const transferFee = this.expediteConfigurer.expediteFee();
    const totalPayableAmount = transferableAmount(invoices, transferFee);
    const clientPayment = TransferEntitiesUtil.createExpediteClientPayment(
      totalPayableAmount,
      transferFee,
      {
        id: request.clientId,
        bankAccountId: bankAccount.id,
        lastFourDigits: transferDestination.account.slice(-4),
      },
      batchPayment,
    );

    batchPayment.clientPayments.add(clientPayment);
    return {
      batchPayment,
      invoices,
      clientPayment,
      validBankAccount: transferDestination,
      client,
    };
  }

  private async updateInvoices(context: Context): Promise<void> {
    const { invoices, batchPayment, clientPayment, validBankAccount } = context;
    const result = invoices.map((invoice) => {
      let assignmentResult = Assignment.assign(
        invoice,
        'clientPaymentStatus',
        ClientPaymentStatus.Sent,
      );
      if (!invoice.expedited) {
        assignmentResult = assignmentResult.concat(
          Assignment.assign(invoice, 'expedited', true),
        );
      }
      const invoicesActions = {
        invoice,
        changeActions: ChangeActions.addActivity(
          TagDefinitionKey.CLIENT_PAYMENT_UPDATE,
          Note.from({
            payload: assignmentResult.getPayload(),
            text: `Paid ${formatToDollars(
              penniesToDollars(payableAmount(invoice)),
            )} as part of ${formatToDollars(
              penniesToDollars(clientPayment.amount),
            )} batch (${formatToDollars(
              penniesToDollars(clientPayment.transferFee),
            )} fee),
            expected arrival ${formatBusinessTime(
              batchPayment.expectedPaymentDate,
            )} in account ${validBankAccount.account}`,
          }),
        ),
      };
      return invoicesActions;
    });

    await Arrays.mapAsync(result, async ({ invoice, changeActions }) => {
      await this.invoiceChangeActionsExecutor.apply(invoice, changeActions);
    });
  }

  private async createPayments({
    clientPayment,
    batchPayment,
    invoices,
  }: Context): Promise<void> {
    const transferFee = this.expediteConfigurer.expediteFee();
    const totalPayableAmount = transferableAmount(invoices, transferFee);

    for (const invoice of invoices) {
      const invoiceClientPayment =
        TransferEntitiesUtil.createInvoiceClientPayment(invoice, clientPayment);
      if (clientPayment.invoicePayments?.isInitialized()) {
        clientPayment.invoicePayments.add(invoiceClientPayment);
      }
    }
    clientPayment.amount = totalPayableAmount;
    batchPayment.clientPayments.add(clientPayment);
  }

  @CrossCuttingConcerns({
    logging: (batchPayment: ClientBatchPaymentEntity) => {
      return {
        message: 'Initiating expedite transfer',
        payload: {
          batchPaymentId: batchPayment.id,
        },
      };
    },
  })
  private async initiateTransfer(context: Context): Promise<void> {
    const shouldUseBofa = await this.featureTogglesService.isEnabledForClient(
      context.client.id,
      LDFlags.useBankOfAmericaIntegration,
      false,
    );
    if (shouldUseBofa) {
      await this.initiateTransferViaBankOfAmerica(context);
    } else {
      await this.initiateTransferViaModernTreasury(context);
    }
  }

  private async initiateTransferViaModernTreasury({
    batchPayment,
    validBankAccount,
  }: Context): Promise<void> {
    const originatingAccountId =
      await this.transferConfigurer.internalAccountId();

    const payload: ExpediteTransferDto =
      TransferDataMapper.batchPaymentToModernTreasuryExpedite(
        batchPayment,
        originatingAccountId,
        validBankAccount,
        `${this.transferConfigurer.webHookUrl()}/transfers/update-status`,
      );

    await this.transfersAPI.createModernTreasuryExpedite(
      batchPayment.id,
      payload,
    );
  }

  private async initiateTransferViaBankOfAmerica({
    batchPayment,
    validBankAccount,
    client,
  }: Context): Promise<void> {
    const payload: BofaTransferRequest =
      TransferDataMapper.batchPaymentToBankOfAmericaExpedite(
        batchPayment,
        validBankAccount,
        `${this.transferConfigurer.webHookUrl()}/transfers/update-status`,
        client,
      );

    await this.transfersAPI.createBankOfAmericaExpediteOnApiEnabled(
      batchPayment.id,
      payload,
    );
  }

  private updatePayments(batchPayment: ClientBatchPaymentEntity) {
    batchPayment.status = ClientBatchPaymentStatus.InProgress;
    batchPayment.clientPayments.getItems().forEach((clientPayment) => {
      clientPayment.status = PaymentStatus.DONE;
    });
  }

  private validateTransferDestination(
    transferDestination: TransferDestination | null,
    bankAccount: ClientBankAccount,
    clientId: string,
  ): asserts transferDestination is TransferDestination {
    if (!transferDestination) {
      this.logger.error(
        `Client does not have a valid bank account and his invoices will not be part of the regular transfer batch`,
        {
          bankAccountId: bankAccount.id,
          clientId: clientId,
        },
      );
      throw new ValidationError(
        'expedite-transfer',
        'Client does not have a valid bank account',
      );
    }
    if (!transferDestination.bankName) {
      this.logger.error(
        `Client does not have a bank name associated with its bank account in order to expedite transfer`,
        {
          bankAccountId: bankAccount.id,
          clientId: clientId,
        },
      );
      throw new ValidationError(
        'expedite-transfer',
        'Client does not have a bank name associated with its bank account in order to expedite transfer',
      );
    }
  }

  async checkForRecentTransfers(request: InitiateExpediteTransferRequest) {
    const hasRecentTransfer = await this.dataAccess.hasRecentTransfersInitiated(
      request.clientId,
    );
    if (hasRecentTransfer) {
      throw new ValidationError(
        'expedite-transfer',
        'This transfer has already been initiated by another user. Please refresh your page',
      );
    }
  }
}
