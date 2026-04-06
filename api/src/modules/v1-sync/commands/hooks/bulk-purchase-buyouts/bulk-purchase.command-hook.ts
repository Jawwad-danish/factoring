import { CauseAwareError } from '@core/errors';
import { BulkPurchaseCommand } from '@module-buyouts';
import { FeatureFlagResolver } from '@module-common';
import { CommandHook } from '@module-cqrs';
import { DatabaseService } from '@module-database';
import { InvoiceContext } from '@module-invoices/data';
import { V1Api, retryWithHandledTimeout } from '../../../api';
import { V1SyncCommandHook } from '../v1-sync.command-hook';

@CommandHook(BulkPurchaseCommand)
export class BulkPurchaseCommandHook extends V1SyncCommandHook<BulkPurchaseCommand> {
  constructor(
    featureFlagResolver: FeatureFlagResolver,
    databaseService: DatabaseService,
    private readonly v1Api: V1Api,
  ) {
    super(featureFlagResolver, databaseService);
  }

  protected async doAfterCommand(
    _command: BulkPurchaseCommand,
    result: InvoiceContext[],
  ): Promise<void> {
    await this.updateBuyouts(result);
    await this.purchaseBuyouts(result);
  }

  private handleError(error: any): void {
    this.logger.error('Error while purchasing buyouts', error);
    throw new CauseAwareError('Error while purchasing buyouts', error);
  }

  private async purchaseBuyouts(result: InvoiceContext[]): Promise<void> {
    try {
      await retryWithHandledTimeout(async () => {
        await this.v1Api.purchaseBuyouts(
          result
            .map((i) => i.entity.buyout?.id)
            .filter((id) => id !== undefined),
        );
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  private async updateBuyouts(result: InvoiceContext[]): Promise<void> {
    for (const invoice of result) {
      const buyoutId = invoice.entity.buyout?.id;
      if (!buyoutId) {
        this.logger.warn(
          `Buyout ID is missing for invoice ${invoice.entity.id}`,
        );
        continue;
      }
      try {
        await retryWithHandledTimeout(async () => {
          await this.v1Api.updateBuyout(buyoutId, {
            invoice_id: invoice.entity.id,
          });
        });
      } catch (error) {
        this.handleError(error);
      }
    }
  }
}
