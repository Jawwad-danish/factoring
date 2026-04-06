import { ChangeActions } from '@common';
import { Note } from '@core/data';
import { CreateInvoiceRequest } from '@fs-bobtail/factoring/data';
import { FeatureFlag, FeatureFlagResolver } from '@module-common';
import {
  CommandInvoiceContext,
  RevertInvoiceRequest,
  UpdateInvoiceRequest,
} from '@module-invoices/data';
import {
  InvoiceStatus,
  TagDefinitionKey,
  VerificationStatus,
} from '@module-persistence/entities';
import { Injectable } from '@nestjs/common';
import {
  VerificationCheckResult,
  VerificationEngine,
} from '../../../../engines';
import { InvoiceRule } from './invoice-rule';

@Injectable()
export class VerificationRequiredRule<
  P extends CreateInvoiceRequest | UpdateInvoiceRequest | RevertInvoiceRequest,
> implements InvoiceRule<P>
{
  constructor(
    private readonly verificationEngine: VerificationEngine,
    private readonly featureFlagResolver: FeatureFlagResolver,
  ) {}

  async run({
    entity: invoice,
    client,
    payload,
  }: CommandInvoiceContext<P>): Promise<ChangeActions> {
    if (invoice.status === InvoiceStatus.Purchased) {
      return Promise.resolve(ChangeActions.empty());
    }

    const isCreateRequest = payload instanceof CreateInvoiceRequest;
    let checkResults: VerificationCheckResult[] = [];
    if (this.featureFlagResolver.isDisabled(FeatureFlag.VerificationEngine)) {
      checkResults = await this.verificationEngine.runMandatoryChecks({
        invoice,
        client,
      });
    } else {
      checkResults = await this.verificationEngine.run({
        invoice,
        client,
        forceRun: isCreateRequest,
      });
    }

    invoice.verificationStatus =
      checkResults.length > 0
        ? VerificationStatus.Required
        : isCreateRequest
        ? VerificationStatus.NotRequired
        : invoice.verificationStatus;
    return this.buildChangeActions(checkResults);
  }

  private buildChangeActions(checkResults: VerificationCheckResult[]) {
    const changeActions = ChangeActions.empty();
    for (const item of checkResults) {
      changeActions.concat(
        ChangeActions.addActivity(
          TagDefinitionKey.VERIFICATION_ENGINE,
          Note.from({ payload: item.payload, text: item.note }),
        ),
      );
    }
    return changeActions;
  }
}
