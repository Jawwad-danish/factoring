import { ValidationError } from '@core/validation';
import {
  CommandInvoiceContext,
  PurchaseInvoiceRequest,
} from '@module-invoices/data';
import { AuthorityState, InsuranceStatus } from '@module-clients';
import { ClientFactoringStatus } from '@module-persistence/entities';
import { ClientFactoringConfigsRepository } from '@module-persistence/repositories';
import { Injectable, Logger } from '@nestjs/common';
import { PurchaseInvoiceValidator } from './purchase-invoice-validator';
import { FeatureFlag, FeatureFlagResolver } from '@module-common';

@Injectable()
export class CheckClientStatus implements PurchaseInvoiceValidator {
  private logger = new Logger(CheckClientStatus.name);

  constructor(
    private clientConfigRepository: ClientFactoringConfigsRepository,
    private featureFlagResolver: FeatureFlagResolver,
  ) {}

  async validate(
    context: CommandInvoiceContext<PurchaseInvoiceRequest>,
  ): Promise<void> {
    const { entity, client } = context;

    if (
      !this.featureFlagResolver.isEnabled(
        FeatureFlag.PurchaseClientStatusValidator,
      )
    ) {
      return;
    }

    const clientConfig = await this.clientConfigRepository.getOneByClientId(
      client.id,
    );
    const canApprove =
      clientConfig &&
      client.commonAuthorityStatus === AuthorityState.Active &&
      client.insuranceStatus === InsuranceStatus.Active &&
      clientConfig.status === ClientFactoringStatus.Active;

    if (!canApprove) {
      this.logger.error(`Cannot purchase because client is inactive`, {
        invoiceId: entity.id,
        client: {
          id: client.id,
          commonAuthorityStatus: client.commonAuthorityStatus,
          insuranceStatus: client.insuranceStatus,
          status: clientConfig.status,
        },
      });
      throw new ValidationError(
        'check-client-status',
        `Cannot purchase an invoice with an inactive client`,
      );
    }
  }
}
