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
import { RevertInvoiceRule } from './revert-invoice-rule';

@Injectable()
export class RevertDeductionReserveRule implements RevertInvoiceRule {
  private logger: Logger = new Logger(RevertDeductionReserveRule.name);

  constructor(
    private readonly commandRunner: CommandRunner,
    private readonly reserveInvoiceRepository: ReserveInvoiceRepository,
  ) {}

  @CrossCuttingConcerns({
    logging: ({ entity }: CommandInvoiceContext<RevertInvoiceRequest>) => {
      return {
        message: `Reverting deduction reserve entry`,
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

    if (entity.deduction.eq(0)) {
      return ChangeActions.empty();
    }

    const reserve = await this.getReserve(entity.id);
    if (reserve) {
      const command = new DeleteReserveCommand(entity.clientId, reserve.id, {});
      await this.commandRunner.run(command);
    } else {
      this.logger.warn(
        `No deduction reserve entry was found for invoice ${entity.id}`,
      );
    }
    return ChangeActions.empty();
  }

  private async getReserve(invoiceId: string): Promise<ReserveEntity | null> {
    return this.reserveInvoiceRepository.findChargebackReserveByInvoiceId(
      invoiceId,
    );
  }
}
