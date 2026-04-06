import { dollarsToPennies } from '@core/formulas';
import { mockToken } from '@core/test';
import { EntityStubs } from '@module-persistence/test';
import { buildStubClient } from '@module-clients/test';
import { Test, TestingModule } from '@nestjs/testing';
import { FirstInvoiceCheck } from './first-invoice-check';
import { ClientRequiresVerificationCheck } from './client-requires-verification-check';

describe('ClientRequiresVerificationCheck', () => {
  let check: FirstInvoiceCheck;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClientRequiresVerificationCheck],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    check = module.get(ClientRequiresVerificationCheck);
  });

  it('Should be defined', () => {
    expect(check).toBeDefined();
  });

  it('Should return null when client requires verification is false', async () => {
    const client = buildStubClient();
    client.factoringConfig.requiresVerification = true;
    const result = await check.run({
      invoice: EntityStubs.buildStubInvoice(),
      client: buildStubClient(),
    });
    expect(result).toBe(null);
  });

  it('Should return payload when client requires verification is true', async () => {
    const client = buildStubClient();
    client.factoringConfig.requiresVerification = true;
    const result = await check.run({
      invoice: EntityStubs.buildStubInvoice({
        lineHaulRate: dollarsToPennies(3000),
      }),
      client,
    });
    expect(result).not.toBeNull();
    expect(result?.note).not.toBeNull();
    expect(result?.payload).not.toBeNull();
    expect(result?.payload?.cause).toBe('ClientRequiresVerification');
  });
});
