import { mockToken } from '@core/test';
import { BrokerService } from '@module-brokers';
import { ClientService } from '@module-clients';
import { InvoicePurchaseEmail } from '@module-email';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityStubs } from '@module-persistence/test';
import { SendPurchaseEmailCommand } from '../../send-purchase-email.command';
import { SendPurchaseEmailCommandHandler } from './send-purchase-email.command-handler';
import { buildStubBroker } from '@module-brokers/test';

describe('SendPurchaseEmailCommandHandler', () => {
  let clientService: ClientService;
  let brokerService: BrokerService;
  let purchaseEmail: InvoicePurchaseEmail;
  let handler: SendPurchaseEmailCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SendPurchaseEmailCommandHandler],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    clientService = module.get(ClientService);
    brokerService = module.get(BrokerService);
    purchaseEmail = module.get(InvoicePurchaseEmail);
    handler = module.get(SendPurchaseEmailCommandHandler);
  });

  it('Should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('When broker is not on invoice nothing happens', async () => {
    const getClientSpy = jest.spyOn(clientService, 'getOneById');
    const getBrokerSpy = jest.spyOn(brokerService, 'findOneById');
    const sendEmailSpy = jest.spyOn(purchaseEmail, 'send');

    await handler.execute(
      new SendPurchaseEmailCommand(
        EntityStubs.buildStubInvoice({
          brokerId: null,
        }),
      ),
    );

    expect(getClientSpy).toBeCalledTimes(0);
    expect(getBrokerSpy).toBeCalledTimes(0);
    expect(sendEmailSpy).toBeCalledTimes(0);
  });

  it('When broker is on invoice email component is called', async () => {
    jest
      .spyOn(brokerService, 'findOneById')
      .mockResolvedValueOnce(buildStubBroker());
    const sendEmailSpy = jest.spyOn(purchaseEmail, 'send');

    await handler.execute(
      new SendPurchaseEmailCommand(EntityStubs.buildStubInvoice()),
    );

    expect(sendEmailSpy).toBeCalledTimes(1);
  });
});
