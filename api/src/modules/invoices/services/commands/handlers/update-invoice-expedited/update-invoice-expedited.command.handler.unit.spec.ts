import { mockToken } from '@core/test';
import { Loaded } from '@mikro-orm/core';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import { InvoiceEntity } from '@module-persistence';
import { InvoiceRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityStubs } from '@module-persistence/test';
import { UpdateInvoiceExpeditedCommand } from '../../update-invoice-expedited.command';
import { UpdateInvoiceExpeditedCommandHandler } from './update-invoice-expedited.command.handler';
import Big from 'big.js';
import { ExpediteConfigurer } from '@module-common';

describe('Update invoice expedited transfer type', () => {
  let invoiceRepository: InvoiceRepository;
  let invoiceChangeActionsExecutor: InvoiceChangeActionsExecutor;
  let handler: UpdateInvoiceExpeditedCommandHandler;
  let expediteConfigurer: ExpediteConfigurer;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UpdateInvoiceExpeditedCommandHandler],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    invoiceChangeActionsExecutor = module.get(InvoiceChangeActionsExecutor);
    invoiceRepository = module.get(InvoiceRepository);
    handler = module.get(UpdateInvoiceExpeditedCommandHandler);
    expediteConfigurer = module.get(ExpediteConfigurer);

    jest
      .spyOn(expediteConfigurer, 'expediteFee')
      .mockReturnValue(new Big(1800));
  });

  it('Should be defined', () => {
    expect(handler).toBeDefined();
  });

  it(`Invoice transfer type update Expedite, invoice over or equal to $18`, async () => {
    const stubInvoices = EntityStubs.buildStubInvoice();
    jest
      .spyOn(invoiceRepository, 'findAll')
      .mockResolvedValueOnce([
        [stubInvoices as Loaded<InvoiceEntity, string>],
        1,
      ]);
    const applySpy = jest.spyOn(invoiceChangeActionsExecutor, 'apply');
    stubInvoices.value = new Big(1800);

    await handler.execute(
      new UpdateInvoiceExpeditedCommand({
        clientId: stubInvoices.clientId,
        expedite: true,
      }),
    );

    const firstCallParams = applySpy.mock.calls[0];
    expect(applySpy).toBeCalledTimes(1);
    expect(firstCallParams[0].id).toBe(stubInvoices.id);
    expect(firstCallParams[0].expedited).toBe(true);
    expect(firstCallParams[1].actions[0].noteDetails?.getText()).toBe(
      'Changed invoice transfer type to Expedite.',
    );
    expect(firstCallParams[1].actions[0].key).toBe('UPDATE_INVOICE');
  });

  it(`Invoice transfer type update Expedite, invoice under $18`, async () => {
    const stubInvoices = EntityStubs.buildStubInvoice();
    jest
      .spyOn(invoiceRepository, 'findAll')
      .mockResolvedValueOnce([
        [stubInvoices as Loaded<InvoiceEntity, string>],
        1,
      ]);
    const applySpy = jest.spyOn(invoiceChangeActionsExecutor, 'apply');
    stubInvoices.value = new Big(1799);

    await handler.execute(
      new UpdateInvoiceExpeditedCommand({
        clientId: stubInvoices.clientId,
        expedite: true,
      }),
    );

    expect(applySpy).toBeCalledTimes(0);
  });

  it('Invoice transfer type update ACH', async () => {
    const stubInvoices = EntityStubs.buildStubInvoice();
    jest
      .spyOn(invoiceRepository, 'findAll')
      .mockResolvedValueOnce([
        [stubInvoices as Loaded<InvoiceEntity, string>],
        0,
      ]);
    const applySpy = jest.spyOn(invoiceChangeActionsExecutor, 'apply');

    await handler.execute(
      new UpdateInvoiceExpeditedCommand({
        clientId: stubInvoices.clientId,
        expedite: false,
      }),
    );

    const firstCallParams = applySpy.mock.calls[0];
    expect(applySpy).toBeCalledTimes(1);
    expect(firstCallParams[0].id).toBe(stubInvoices.id);
    expect(firstCallParams[0].expedited).toBe(false);
    expect(firstCallParams[1].actions[0].noteDetails?.getText()).toBe(
      'Changed invoice transfer type to ACH.',
    );
    expect(firstCallParams[1].actions[0].key).toBe('UPDATE_INVOICE');
  });
});
