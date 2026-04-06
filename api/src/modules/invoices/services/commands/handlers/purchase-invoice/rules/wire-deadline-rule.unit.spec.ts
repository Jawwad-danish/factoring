import { mockToken } from '@core/test';
import { buildStubBroker } from '@module-brokers/test';
import { buildStubClient } from '@module-clients/test';
import { TransferTimeService, WireOverrideWindow } from '@module-common';
import {
  CommandInvoiceContext,
  PurchaseInvoiceRequest,
} from '@module-invoices/data';
import { buildStubInvoiceEntity } from '@module-invoices/test';
import { Test, TestingModule } from '@nestjs/testing';
import { WireDeadlineRule } from './wire-deadline-rule';

describe.skip('Wire deadline rule', () => {
  let rule: WireDeadlineRule;
  const client = buildStubClient();
  const broker = buildStubBroker();
  let transferTimeService: TransferTimeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WireDeadlineRule],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    transferTimeService = module.get(TransferTimeService);
    rule = module.get<WireDeadlineRule>(WireDeadlineRule);
  }, 60000);

  it('Override payment type if inside wire override window', () => {
    const wireOverrideWindowMock: WireOverrideWindow = {
      start: {
        hour: 0,
        minute: 0,
      },
      end: {
        hour: 23,
        minute: 59,
      },
    };
    jest
      .spyOn(transferTimeService, 'getWireOverrideWindow')
      .mockReturnValue(wireOverrideWindowMock);
    const payload = new PurchaseInvoiceRequest();
    const entity = buildStubInvoiceEntity();
    entity.expedited = false;
    const context: CommandInvoiceContext<PurchaseInvoiceRequest> = {
      client: client,
      broker: broker,
      entity: entity,
      payload: payload,
    };
    rule.run(context);
    expect(entity.expedited).toBe(false);
  });
});
