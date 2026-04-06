import { mockToken } from '@core/test';
import { buildStubClient } from '@module-clients/test';
import { EntityStubs } from '@module-persistence/test';
import { InvoiceRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import Big from 'big.js';
import { InvoiceDataAccess } from '../../../invoice-data-access';
import { VerificationCheckResult } from '../verification-engine.types';
import { AgeDilutionReserveCheck } from './age-dilution-reserve-check';

describe('AgeDilutionReserveCheck', () => {
  let check: AgeDilutionReserveCheck;
  let invoiceRepository: InvoiceRepository;
  let invoiceDataAccess: InvoiceDataAccess;

  const mockVerificationPercentage = (
    clientAge: number,
    dilutionRate: number,
    verificationPercentage: number,
  ) => {
    jest
      .spyOn(invoiceRepository, 'daysSinceFirstInvoiceByClient')
      .mockResolvedValue(clientAge);

    jest
      .spyOn(invoiceDataAccess, 'getDilutionRate')
      .mockResolvedValue(new Big(dilutionRate));

    jest
      .spyOn(invoiceRepository, 'totalAccountsReceivableByClient')
      .mockResolvedValue(100);

    jest
      .spyOn(invoiceRepository, 'countByClient')
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(verificationPercentage);
  };

  const dilutionRateVerificationPercentageExpect = (
    result: null | VerificationCheckResult,
    bodyPayload: {
      clientAge: {
        value: string;
        lowerLimit: string;
        upperLimit: string;
      };
      dilution: {
        value: string;
        lowerLimit: string;
        upperLimit: string;
      };
      verificationPercentage: {
        value: string;
        upperLimit: string;
      };
    },
  ) => {
    expect(result).not.toBeNull();
    expect(result?.note).not.toBeNull();
    expect(result?.payload).not.toBeNull();
    expect(result?.payload).toStrictEqual({
      cause: 'DilutionRateClientAge',
      ...bodyPayload,
    });
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AgeDilutionReserveCheck],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    check = module.get(AgeDilutionReserveCheck);
    invoiceRepository = module.get(InvoiceRepository);
    invoiceDataAccess = module.get(InvoiceDataAccess);
  });

  it('Should be defined', () => {
    expect(check).toBeDefined();
  });

  it('Should return payload when client age is less than the limit', async () => {
    mockVerificationPercentage(40, 70, 50);

    const result = await check.run({
      invoice: EntityStubs.buildStubInvoice(),
      client: buildStubClient(),
    });

    dilutionRateVerificationPercentageExpect(result, {
      clientAge: {
        value: '40',
        lowerLimit: '0',
        upperLimit: '45',
      },
      dilution: {
        value: '70.00',
        lowerLimit: '0.00',
        upperLimit: '100.00',
      },
      verificationPercentage: {
        value: '50.00',
        upperLimit: '100.00',
      },
    });
  });

  it('Should return payload when dilution rate is higher than 5 AND client age is greater than 45', async () => {
    mockVerificationPercentage(50, 6, 50);

    const result = await check.run({
      invoice: EntityStubs.buildStubInvoice(),
      client: buildStubClient(),
    });

    dilutionRateVerificationPercentageExpect(result, {
      clientAge: {
        value: '50',
        lowerLimit: '45',
        upperLimit: '100',
      },
      dilution: {
        value: '6.00',
        lowerLimit: '5.00',
        upperLimit: '100.00',
      },
      verificationPercentage: {
        value: '50.00',
        upperLimit: '100.00',
      },
    });
  });

  it('Should return payload when dilution rate is less than 5 AND client age is between 45 and 75 AND verification percentage is less than 50', async () => {
    mockVerificationPercentage(66, 4, 40);

    const result = await check.run({
      invoice: EntityStubs.buildStubInvoice(),
      client: buildStubClient(),
    });

    dilutionRateVerificationPercentageExpect(result, {
      clientAge: {
        value: '66',
        lowerLimit: '45',
        upperLimit: '75',
      },
      dilution: {
        value: '4.00',
        lowerLimit: '0.00',
        upperLimit: '5.00',
      },
      verificationPercentage: {
        value: '40.00',
        upperLimit: '50.00',
      },
    });
  });

  it('Should return null when dilution rate is less than 5 AND client age is between 45 and 75 AND verification percentage is higher than 50', async () => {
    mockVerificationPercentage(66, 4, 60);

    const result = await check.run({
      invoice: EntityStubs.buildStubInvoice(),
      client: buildStubClient(),
    });
    expect(result).toBeNull();
  });

  it('Should return payload when dilution rate is less than 5 AND client age is between 75 and 90 AND verification percentage is less than 25', async () => {
    mockVerificationPercentage(85, 4, 10);

    const result = await check.run({
      invoice: EntityStubs.buildStubInvoice(),
      client: buildStubClient(),
    });

    dilutionRateVerificationPercentageExpect(result, {
      clientAge: {
        value: '85',
        lowerLimit: '75',
        upperLimit: '90',
      },
      dilution: {
        value: '4.00',
        lowerLimit: '0.00',
        upperLimit: '5.00',
      },
      verificationPercentage: {
        value: '10.00',
        upperLimit: '25.00',
      },
    });
  });

  it('Should return null when dilution rate is less than 5 AND client age is between 75 and 90 AND verification percentage is higher than 25', async () => {
    mockVerificationPercentage(85, 4, 30);

    const result = await check.run({
      invoice: EntityStubs.buildStubInvoice(),
      client: buildStubClient(),
    });

    expect(result).toBeNull();
  });

  it('Should return null when dilution rate is less than 2 AND client age is greater than 90 and verification percentage is higher than 0', async () => {
    mockVerificationPercentage(95, 1.3, 50);

    const result = await check.run({
      invoice: EntityStubs.buildStubInvoice(),
      client: buildStubClient(),
    });

    expect(result).toBeNull();
  });

  it('Should return null when dilution rate is less than 2 AND client age is greater than 90 and verification percentage is 0', async () => {
    mockVerificationPercentage(90, 1.3, 0);

    const result = await check.run({
      invoice: EntityStubs.buildStubInvoice(),
      client: buildStubClient(),
    });

    expect(result).toBeNull();
  });
});
