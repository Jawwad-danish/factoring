import { Injectable, Logger } from '@nestjs/common';
import {
  VerificationCheckResult,
  VerificationEngineInput,
  VerificationRequiredCheck,
} from '../verification-engine.types';

import { percentageOfNumber } from '@core/formulas';
import { Arrays } from '@core/util';
import {
  InvoiceStatus,
  VerificationStatus,
} from '@module-persistence/entities';
import { InvoiceRepository } from '@module-persistence/repositories';
import Big from 'big.js';
import { InvoiceDataAccess } from '../../../invoice-data-access';
import { buildCheckResult } from './util';

interface VerificationBoundaries {
  dilution: {
    lowerLimit: Big;
    upperLimit: Big;
  };
  clientAge: {
    lowerLimit: Big;
    upperLimit: Big;
  };
  verificationPercentage: {
    upperLimit: Big;
  };
}
@Injectable()
export class AgeDilutionReserveCheck implements VerificationRequiredCheck {
  private logger = new Logger(AgeDilutionReserveCheck.name);
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly invoiceDataAccess: InvoiceDataAccess,
  ) {}

  async run(
    input: VerificationEngineInput,
  ): Promise<null | VerificationCheckResult> {
    const { invoice } = input;

    return this.checkDilutionAndVerificationPercentage(invoice.clientId);
  }

  private async checkDilutionAndVerificationPercentage(
    clientId: string,
  ): Promise<null | VerificationCheckResult> {
    const clientAge = Big(
      await this.invoiceRepository.daysSinceFirstInvoiceByClient(clientId),
    );
    const dilutionRate = await this.invoiceDataAccess.getDilutionRate(clientId);
    const verificationPercentage = await this.getVerificationPercentage(
      clientId,
    );

    const boundaries: VerificationBoundaries[] = [
      {
        dilution: {
          lowerLimit: new Big(0),
          upperLimit: new Big(100),
        },
        clientAge: {
          lowerLimit: new Big(0),
          upperLimit: new Big(45),
        },
        verificationPercentage: {
          upperLimit: new Big(100),
        },
      },
      {
        dilution: {
          lowerLimit: new Big(5),
          upperLimit: new Big(100),
        },
        clientAge: {
          lowerLimit: new Big(45),
          upperLimit: new Big(100),
        },
        verificationPercentage: {
          upperLimit: new Big(100),
        },
      },
      {
        dilution: {
          lowerLimit: new Big(0),
          upperLimit: new Big(5),
        },
        clientAge: {
          lowerLimit: new Big(45),
          upperLimit: new Big(75),
        },
        verificationPercentage: {
          upperLimit: new Big(50),
        },
      },
      {
        dilution: {
          lowerLimit: new Big(0),
          upperLimit: new Big(5),
        },
        clientAge: {
          lowerLimit: new Big(75),
          upperLimit: new Big(90),
        },
        verificationPercentage: {
          upperLimit: new Big(25),
        },
      },
      {
        dilution: {
          lowerLimit: new Big(0),
          upperLimit: new Big(2),
        },
        clientAge: {
          lowerLimit: new Big(90),
          upperLimit: new Big(100),
        },
        verificationPercentage: {
          upperLimit: new Big(0),
        },
      },
    ];

    return Arrays.firstNotEmpty(boundaries, (boundary) =>
      this.checkBoundary(
        clientAge,
        dilutionRate,
        verificationPercentage,
        boundary,
      ),
    );
  }

  private checkBoundary(
    clientAge: Big,
    dilutionRate: Big,
    verificationPercentage: Big,
    boundary: VerificationBoundaries,
  ) {
    if (
      clientAge.gte(boundary.clientAge.lowerLimit) &&
      clientAge.lt(boundary.clientAge.upperLimit) &&
      dilutionRate.gte(boundary.dilution.lowerLimit) &&
      dilutionRate.lt(boundary.dilution.upperLimit) &&
      verificationPercentage.lte(boundary.verificationPercentage.upperLimit)
    ) {
      if (boundary.verificationPercentage.upperLimit.eq(0)) {
        return null;
      }

      this.logger.debug(
        `Verification is required. Verification percentage ${verificationPercentage} exceeded`,
      );
      return buildCheckResult(
        'Verification is required. Verification percentage exceeded',
        'DilutionRateClientAge',
        {
          dilution: {
            value: dilutionRate.toFixed(2),
            lowerLimit: boundary.dilution.lowerLimit.toFixed(2),
            upperLimit: boundary.dilution.upperLimit.toFixed(2),
          },
          clientAge: {
            value: clientAge.toFixed(0),
            lowerLimit: boundary.clientAge.lowerLimit.toFixed(0),
            upperLimit: boundary.clientAge.upperLimit.toFixed(0),
          },
          verificationPercentage: {
            value: verificationPercentage.toFixed(2),
            upperLimit: boundary.verificationPercentage.upperLimit.toFixed(2),
          },
        },
      );
    }
    return null;
  }

  private async getVerificationPercentage(clientId: string): Promise<Big> {
    const totalCount = await this.invoiceRepository.countByClient(clientId, {
      status: InvoiceStatus.UnderReview,
    });
    const needsVerificationCount = await this.invoiceRepository.countByClient(
      clientId,
      {
        status: InvoiceStatus.UnderReview,
        verificationStatus: VerificationStatus.Required,
      },
    );
    if (totalCount == 0) {
      return new Big(0);
    }
    return percentageOfNumber(needsVerificationCount, totalCount);
  }
}
