import { dollarsToPennies } from '@core/formulas';
import { mockMikroORMProvider, mockToken } from '@core/test';
import { Loaded } from '@mikro-orm/core';
import { EntityStubs } from '@module-persistence/test';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import { InvoiceEntity, TagDefinitionKey } from '@module-persistence/entities';
import {
  ClientFactoringConfigsRepository,
  InvoiceRepository,
} from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { ClientLimitTagInvoicesCommand } from '../../client-limit-tag-invoices.command';
import { ClientLimitTagInvoicesCommandHandler } from './client-limit-tag-invoices.command-handler';

describe('ClientLimitTagInvoicesCommandHandler', () => {
  let invoiceRepository: InvoiceRepository;
  let clientFactoringConfigRepository: ClientFactoringConfigsRepository;
  let invoiceChangeActionsExecutor: InvoiceChangeActionsExecutor;
  let handler: ClientLimitTagInvoicesCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClientLimitTagInvoicesCommandHandler, mockMikroORMProvider],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    clientFactoringConfigRepository = module.get(
      ClientFactoringConfigsRepository,
    );
    invoiceChangeActionsExecutor = module.get(InvoiceChangeActionsExecutor);
    invoiceRepository = module.get(InvoiceRepository);
    handler = module.get(ClientLimitTagInvoicesCommandHandler);
  });

  it('Should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('When no client limit is defined then the command returns', async () => {
    jest
      .spyOn(clientFactoringConfigRepository, 'getOneByClientId')
      .mockResolvedValueOnce(
        EntityStubs.buildClientFactoringConfig({
          clientLimitAmount: null,
        }),
      );
    const getTotalARUnpaidByClient = jest.spyOn(
      invoiceRepository,
      'getLast30DaysTotalARUnpaidByClient',
    );

    await handler.execute(new ClientLimitTagInvoicesCommand(''));

    expect(getTotalARUnpaidByClient).toHaveBeenCalledTimes(0);
  });

  it('When client limit is higher than AR then client limit exceeds tag is removed', async () => {
    const invoiceMock = EntityStubs.buildStubInvoice({
      tags: [
        EntityStubs.buildStubInvoiceTag(
          EntityStubs.buildStubTagDefinition({
            key: TagDefinitionKey.CLIENT_LIMIT_EXCEEDED,
          }),
        ),
      ],
    }) as Loaded<InvoiceEntity, string>;
    jest
      .spyOn(clientFactoringConfigRepository, 'getOneByClientId')
      .mockResolvedValueOnce(
        EntityStubs.buildClientFactoringConfig({
          clientLimitAmount: dollarsToPennies(1000),
        }),
      );
    jest
      .spyOn(invoiceRepository, 'getLast30DaysTotalARUnpaidByClient')
      .mockResolvedValueOnce(dollarsToPennies(500).toNumber());
    jest.spyOn(invoiceRepository, 'find').mockResolvedValueOnce([invoiceMock]);

    const spyChangeActionsApply = jest.spyOn(
      invoiceChangeActionsExecutor,
      'apply',
    );
    await handler.execute(new ClientLimitTagInvoicesCommand(''));

    expect(spyChangeActionsApply).toHaveBeenCalledTimes(1);
    expect(spyChangeActionsApply.mock.calls[0][0].id).toBe(invoiceMock.id);
    expect(spyChangeActionsApply.mock.calls[0][1].actions[0].isDelete()).toBe(
      true,
    );
  });

  it('When client limit is higher than AR then client limit exceeds tag is removed', async () => {
    const invoiceMock = EntityStubs.buildStubInvoice() as Loaded<
      InvoiceEntity,
      string
    >;
    jest
      .spyOn(clientFactoringConfigRepository, 'getOneByClientId')
      .mockResolvedValueOnce(
        EntityStubs.buildClientFactoringConfig({
          clientLimitAmount: dollarsToPennies(500),
        }),
      );
    jest
      .spyOn(invoiceRepository, 'getLast30DaysTotalARUnpaidByClient')
      .mockResolvedValueOnce(dollarsToPennies(1000).toNumber());
    jest.spyOn(invoiceRepository, 'find').mockResolvedValueOnce([invoiceMock]);

    const spyChangeActionsApply = jest.spyOn(
      invoiceChangeActionsExecutor,
      'apply',
    );
    await handler.execute(new ClientLimitTagInvoicesCommand(''));

    expect(spyChangeActionsApply).toHaveBeenCalledTimes(1);
    expect(spyChangeActionsApply.mock.calls[0][0].id).toBe(invoiceMock.id);
    expect(spyChangeActionsApply.mock.calls[0][1].actions[0].isAssign()).toBe(
      true,
    );
  });
});
