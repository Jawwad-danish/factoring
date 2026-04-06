import { ValidationError } from '@core/validation';
import { CommandInvoiceContext } from '@module-invoices/data';
import {
  ClientPaymentStatus,
  InvoiceStatus,
} from '@module-persistence/entities';
import { InvoiceValidator } from '../invoice-validator';
import { FeatureFlag, FeatureFlagResolver } from '@module-common';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InvoiceNotLockedValidator<P> implements InvoiceValidator<P> {
  constructor(private readonly featureFlagResolver: FeatureFlagResolver) {}

  async validate(context: CommandInvoiceContext<P>): Promise<void> {
    const { entity } = context;
    if (
      !this.featureFlagResolver.isEnabled(
        FeatureFlag.UpdateInvoiceClientPaymentStatusValidator,
      )
    ) {
      return;
    }
    if (
      entity.status === InvoiceStatus.Purchased &&
      entity.clientPaymentStatus === ClientPaymentStatus.InProgress
    ) {
      throw new ValidationError(
        'invoice-locked',
        'Client payment is in progress.',
      );
    }
  }
}
