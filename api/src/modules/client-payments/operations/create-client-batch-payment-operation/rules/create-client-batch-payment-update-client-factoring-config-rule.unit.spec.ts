import { mockMikroORMProvider, mockToken } from '@core/test';
import {
  buildStubClientBatchPaymentRequest,
  stubClientBatchPaymentDataObject,
} from '@module-client-payments/test';
import { EntityStubs } from '@module-persistence/test';
import { ClientFactoringConfigsRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { UpdateClientFactoringConfigRule } from './create-client-batch-payment-update-client-factoring-config-rule';
import { ClientBatchPaymentStatus } from '@module-persistence';

describe('Create UpdateClientFactoringConfigRule Rule', () => {
  let rule: UpdateClientFactoringConfigRule;
  let clientFactoringConfigRepository: ClientFactoringConfigsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UpdateClientFactoringConfigRule, mockMikroORMProvider],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();
    rule = module.get(UpdateClientFactoringConfigRule);
    clientFactoringConfigRepository =
      module.get<ClientFactoringConfigsRepository>(
        ClientFactoringConfigsRepository,
      );
  });

  it('Should be defined', async () => {
    expect(rule).toBeDefined();
  });

  it('Rule update client factoring config expediteTransferOnly and doneSubmittingInvoices', async () => {
    const data = stubClientBatchPaymentDataObject();
    const clientsList = [
      EntityStubs.buildClientFactoringConfig({
        expediteTransferOnly: true,
        doneSubmittingInvoices: true,
      }),
      EntityStubs.buildClientFactoringConfig({
        expediteTransferOnly: true,
        doneSubmittingInvoices: true,
      }),
    ];
    const batchPaymentSpy = jest
      .spyOn(clientFactoringConfigRepository, 'findByClientIds')
      .mockResolvedValueOnce(clientsList);

    const payload = buildStubClientBatchPaymentRequest();
    const entity = EntityStubs.buildClientBatchPayment({
      status: ClientBatchPaymentStatus.Done,
    });

    await rule.run({
      payload: payload,
      entity: entity,
      data: data,
      invoiceList: [],
      paymentExists: false,
    });

    expect(batchPaymentSpy).toHaveBeenCalledTimes(1);
    expect(clientsList[0].expediteTransferOnly).toBe(false);
    expect(clientsList[0].doneSubmittingInvoices).toBe(false);
    expect(clientsList[1].expediteTransferOnly).toBe(false);
    expect(clientsList[1].doneSubmittingInvoices).toBe(false);
  });

  it('Rule does not update client factoring config expediteTransferOnly and doneSubmittingInvoices', async () => {
    const data = stubClientBatchPaymentDataObject();
    const clientsList = [
      EntityStubs.buildClientFactoringConfig({
        expediteTransferOnly: true,
        doneSubmittingInvoices: true,
      }),
      EntityStubs.buildClientFactoringConfig({
        expediteTransferOnly: true,
        doneSubmittingInvoices: true,
      }),
    ];
    const batchPaymentSpy = jest
      .spyOn(clientFactoringConfigRepository, 'findByClientIds')
      .mockResolvedValueOnce(clientsList);

    const payload = buildStubClientBatchPaymentRequest();
    const entity = EntityStubs.buildClientBatchPayment({
      status: ClientBatchPaymentStatus.Done,
    });
    await rule.run({
      payload: payload,
      entity: entity,
      data: data,
      invoiceList: [],
      paymentExists: true,
    });

    expect(batchPaymentSpy).toBeCalledTimes(0);
    expect(clientsList[0].expediteTransferOnly).toBe(true);
    expect(clientsList[0].doneSubmittingInvoices).toBe(true);
    expect(clientsList[1].expediteTransferOnly).toBe(true);
    expect(clientsList[1].doneSubmittingInvoices).toBe(true);
  });
});
