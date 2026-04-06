import { ValidationError } from '@core/validation';
import { FeatureFlag, FeatureFlagResolver } from '@module-common';
import {
  CommandInvoiceContext,
  PurchaseInvoiceRequest,
} from '@module-invoices/data';
import { VerificationStatus } from '@module-persistence/entities';
import { Injectable, Logger } from '@nestjs/common';
import { PurchaseInvoiceValidator } from './purchase-invoice-validator';

@Injectable()
export class VerificationStatusValidator implements PurchaseInvoiceValidator {
  private logger = new Logger(VerificationStatusValidator.name);

  constructor(private featureFlagResolver: FeatureFlagResolver) {}

  async validate(
    context: CommandInvoiceContext<PurchaseInvoiceRequest>,
  ): Promise<void> {
    const { entity } = context;
    if (
      !this.featureFlagResolver.isEnabled(
        FeatureFlag.PurchaseVerificationInProgress,
      ) &&
      entity.verificationStatus === VerificationStatus.InProgress
    ) {
      this.logger.debug(
        'Skipping verification status on purchase because it is in progress and feature flag is enabled',
        {
          invoiceId: entity.id,
        },
      );
      return;
    }

    const needsVerification = ![
      VerificationStatus.Bypassed,
      VerificationStatus.NotRequired,
      VerificationStatus.Verified,
    ].includes(entity.verificationStatus);

    if (needsVerification) {
      this.logger.error(
        'Cannot purchase invoice because it needs verfication',
        {
          invoiceId: entity.id,
          verificationStatus: entity.verificationStatus,
        },
      );
      throw new ValidationError(
        'verification-status',
        `Cannot purchase invoice ${entity.id} because it needs verfication`,
      );
    }
  }
}
