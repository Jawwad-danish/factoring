import * as formulas from '@core/formulas';
import { mockToken } from '@core/test';
import { buildStubClient } from '@module-clients/test';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import Big from 'big.js';
import { FirstInvoiceCheck } from './first-invoice-check';
import { ThresholdCheck } from './threshold-check';

describe('ThresholdCheck', () => {
  let check: FirstInvoiceCheck;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ThresholdCheck],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    check = module.get(ThresholdCheck);
  });

  it('Should be defined', () => {
    expect(check).toBeDefined();
  });

  it('Should return null when invoice total is less than the threshold', async () => {
    const result = await check.run({
      invoice: EntityStubs.buildStubInvoice({
        lineHaulRate: formulas.dollarsToPennies(3000),
        detention: new Big(0),
        lumper: new Big(0),
        advance: new Big(0),
      }),
      client: buildStubClient(),
    });
    expect(result).toBe(null);
  });

  it('Should return payload when invoice total is greater than the threshold', async () => {
    const result = await check.run({
      invoice: EntityStubs.buildStubInvoice({
        lineHaulRate: formulas.dollarsToPennies(4000),
        detention: new Big(0),
        lumper: new Big(0),
        advance: new Big(0),
      }),
      client: buildStubClient(),
    });
    expect(result).not.toBeNull();
    expect(result?.note).not.toBeNull();
    expect(result?.payload).not.toBeNull();
    expect(result?.payload?.cause).toBe('Threshold');
  });
});
