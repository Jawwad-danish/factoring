import { mockToken } from '@core/test';
import { buildStubClient } from '@module-clients/test';
import { PurchaseInvoiceRequest } from '@module-invoices/data';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import { ClientLimitCheck } from './checks';
import { PrePurchaseCheckEngine } from './pre-purchase-check-engine';
import { PrePurchaseCheckCode, PrePurchaseCheckResult } from '../../../data';

describe('PrePurchaseCheckEngine', () => {
  let engine: PrePurchaseCheckEngine;
  let clientLimitCheck: ClientLimitCheck;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrePurchaseCheckEngine],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    engine = module.get(PrePurchaseCheckEngine);
    clientLimitCheck = module.get(ClientLimitCheck);
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  describe('run', () => {
    it('should return empty array when no checks return results', async () => {
      const client = buildStubClient();
      const invoice = EntityStubs.buildStubInvoice();
      const payload = new PurchaseInvoiceRequest();
      const input = { client, invoice, payload };

      jest.spyOn(clientLimitCheck, 'run').mockResolvedValue(null);

      const results = await engine.run(input);

      expect(results).toEqual([]);
      expect(clientLimitCheck.run).toHaveBeenCalledWith(input);
    });

    it('should return results from checks that return non-null results', async () => {
      const client = buildStubClient();
      const invoice = EntityStubs.buildStubInvoice();
      const payload = new PurchaseInvoiceRequest();
      const input = { client, invoice, payload };

      const checkResult: PrePurchaseCheckResult = {
        note: 'Client limit exceeded',
        details: {
          cause: 'Client limit exceeded',
          clientLimit: '5000',
          newTotal: '6000',
        },
        code: PrePurchaseCheckCode.ClientLimitExceeded,
      };

      jest.spyOn(clientLimitCheck, 'run').mockResolvedValue(checkResult);

      const results = await engine.run(input);

      expect(results).toEqual([checkResult]);
      expect(clientLimitCheck.run).toHaveBeenCalledWith(input);
    });
  });
});
