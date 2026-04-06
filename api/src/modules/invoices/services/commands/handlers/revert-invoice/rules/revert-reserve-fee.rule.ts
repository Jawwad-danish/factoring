import { ChangeActions } from '@common';
import { CrossCuttingConcerns } from '@core/util';
import { CommandRunner } from '@module-cqrs';
import {
  CommandInvoiceContext,
  RevertInvoiceRequest,
} from '@module-invoices/data';
import { ReserveEntity, ReserveInvoiceRepository } from '@module-persistence';
import { DeleteReserveCommand } from '@module-reserves/commands';
import { Injectable, Logger } from '@nestjs/common';
import Big from 'big.js';
import { RevertInvoiceRule } from './revert-invoice-rule';

@Injectable()
export class RevertInvoiceReserveFeeRule implements RevertInvoiceRule {
  private logger: Logger = new Logger(RevertInvoiceReserveFeeRule.name);

  constructor(
    private readonly commandRunner: CommandRunner,
    private readonly reserveInvoiceRepository: ReserveInvoiceRepository,
  ) {}

  @CrossCuttingConcerns({
    logging: ({ entity }: CommandInvoiceContext<RevertInvoiceRequest>) => {
      return {
        message: `Reverting reserve fee entry`,
        payload: {
          invoice: {
            id: entity.id,
            loadNumber: entity.loadNumber,
          },
        },
      };
    },
  })
  async run(
    context: CommandInvoiceContext<RevertInvoiceRequest>,
  ): Promise<ChangeActions> {
    const { entity } = context;

    if (entity.reserveFee.eq(0)) {
      return ChangeActions.empty();
    }

    const reserve = await this.getReserve(entity.id);
    if (reserve) {
      const command = new DeleteReserveCommand(entity.clientId, reserve.id, {});
      await this.commandRunner.run(command);
    } else {
      this.logger.warn(
        `No reserve fee entry was found for invoice ${entity.id}`,
      );
    }
    entity.reserveFee = Big(0);
    entity.reserveRatePercentage = Big(0);
    return ChangeActions.empty();
  }

  private async getReserve(invoiceId: string): Promise<ReserveEntity | null> {
    return this.reserveInvoiceRepository.findReserveFeeReserve(invoiceId);
  }
}
