import {
  CommandInvoiceContext,
  PurchaseInvoiceRequest,
} from '../../../../../data';

import { ChangeActions } from '@common';
import { formatToDollars } from '@core/formatting';
import { penniesToDollars } from '@core/formulas';
import { CrossCuttingConcerns } from '@core/util';
import {
  InvoiceEntity,
  ReserveEntity,
  ReserveInvoiceEntity,
  ReserveInvoiceRepository,
  ReserveReason,
  ReserveRepository,
} from '@module-persistence';
import { Injectable, Logger } from '@nestjs/common';
import Big from 'big.js';
import { PurchaseInvoiceRule } from './purchase-invoice-rule';

@Injectable()
export class ReserveFeeRule implements PurchaseInvoiceRule {
  private logger: Logger = new Logger(ReserveFeeRule.name);

  constructor(
    private readonly reserveRepository: ReserveRepository,
    private readonly reserveInvoiceRepository: ReserveInvoiceRepository,
  ) {}

  @CrossCuttingConcerns({
    logging: ({ entity }: CommandInvoiceContext<PurchaseInvoiceRequest>) => {
      return {
        message: `Creating reserve fee entry with amount ${entity.reserveFee.toFixed()}`,
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
    context: CommandInvoiceContext<PurchaseInvoiceRequest>,
  ): Promise<ChangeActions> {
    const { entity } = context;
    if (entity.reserveFee.gt(0)) {
      const reserve = this.createReserveEntity(
        entity.clientId,
        entity.reserveFee,
      );
      this.createReserveInvoiceEntity(entity, reserve);
    } else {
      this.logger.debug(
        `There is no need to create a reserve fee entry because reserve fee is 0`,
      );
    }
    return ChangeActions.empty();
  }

  private createReserveEntity(clientId: string, amount: Big) {
    const reserveEntity = new ReserveEntity();
    reserveEntity.clientId = clientId;
    reserveEntity.amount = amount;
    reserveEntity.reason = ReserveReason.ReserveFee;
    reserveEntity.payload = {};
    reserveEntity.note = `Applied reserve fee of ${formatToDollars(
      penniesToDollars(amount),
    )} at invoice purchase`;
    this.reserveRepository.persist(reserveEntity);
    return reserveEntity;
  }

  private createReserveInvoiceEntity(
    invoice: InvoiceEntity,
    reserve: ReserveEntity,
  ) {
    const reserveInvoiceEntity = new ReserveInvoiceEntity();
    reserveInvoiceEntity.invoice = invoice;
    reserveInvoiceEntity.reserve = reserve;
    this.reserveInvoiceRepository.persist(reserveInvoiceEntity);
  }
}
