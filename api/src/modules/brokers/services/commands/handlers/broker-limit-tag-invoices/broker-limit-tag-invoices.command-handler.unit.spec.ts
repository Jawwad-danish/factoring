import { dollarsToPennies } from '@core/formulas';
import { mockMikroORMProvider, mockToken } from '@core/test';
import { Loaded } from '@mikro-orm/core';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import { EntityStubs } from '@module-persistence/test';
import { InvoiceEntity, TagDefinitionKey } from '@module-persistence/entities';
import {
  BrokerFactoringConfigRepository,
  InvoiceRepository,
} from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { BrokerLimitTagInvoiceCommand } from '../../broker-limit-tag-invoices.command';
import { BrokerLimitTagInvoicesCommandHandler } from './broker-limit-tag-invoices.command-handler';

describe('BrokerLimitTagInvoicesCommandHandler', () => {
  let invoiceRepository: InvoiceRepository;
  let brokerFactoringConfigRepository: BrokerFactoringConfigRepository;
  let invoiceChangeActionsExecutor: InvoiceChangeActionsExecutor;
  let handler: BrokerLimitTagInvoicesCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BrokerLimitTagInvoicesCommandHandler, mockMikroORMProvider],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    brokerFactoringConfigRepository = module.get(
      BrokerFactoringConfigRepository,
    );
    invoiceChangeActionsExecutor = module.get(InvoiceChangeActionsExecutor);
    invoiceRepository = module.get(InvoiceRepository);
    handler = module.get(BrokerLimitTagInvoicesCommandHandler);
  });

  it('Should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('When broker limit is higher than AR then broker limit exceeds tag is removed', async () => {
    const invoiceMock = EntityStubs.buildStubInvoice({
      tags: [
        EntityStubs.buildStubInvoiceTag(
          EntityStubs.buildStubTagDefinition({
            key: TagDefinitionKey.BROKER_LIMIT_EXCEEDED,
          }),
        ),
      ],
    }) as Loaded<InvoiceEntity, string>;
    jest
      .spyOn(brokerFactoringConfigRepository, 'getOneByBrokerId')
      .mockResolvedValueOnce(
        EntityStubs.buildBrokerFactoringConfigStub({
          limitAmount: dollarsToPennies(1000),
        }),
      );
    jest
      .spyOn(invoiceRepository, 'getTotalAmountUnpaidByBroker')
      .mockResolvedValueOnce(dollarsToPennies(500).toNumber());
    jest.spyOn(invoiceRepository, 'find').mockResolvedValueOnce([invoiceMock]);

    const spyChangeActionsApply = jest.spyOn(
      invoiceChangeActionsExecutor,
      'apply',
    );
    await handler.execute(new BrokerLimitTagInvoiceCommand(''));

    expect(spyChangeActionsApply).toHaveBeenCalledTimes(1);
    expect(spyChangeActionsApply.mock.calls[0][0].id).toBe(invoiceMock.id);
    expect(spyChangeActionsApply.mock.calls[0][1].actions[0].isDelete()).toBe(
      true,
    );
  });
});
