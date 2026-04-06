import { mockMikroORMProvider, mockToken } from '@core/test';
import { Test, TestingModule } from '@nestjs/testing';
import { NoticeOfAssignmentEmail } from '@module-email';
import { EntityStubs } from '@module-persistence/test';
import { buildStubBroker } from '@module-brokers/test';
import { SendNoaEmailEventHandler } from './send-noa-email.event-handler';
import { SendNoaEvent } from '@module-invoices/data';
import { buildStubClient } from '@module-clients/test';

describe('SendNoaEmailEventHandler', () => {
  let handler: SendNoaEmailEventHandler;
  let noaEmail: NoticeOfAssignmentEmail;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SendNoaEmailEventHandler, mockMikroORMProvider],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    handler = module.get<SendNoaEmailEventHandler>(SendNoaEmailEventHandler);
    noaEmail = module.get<NoticeOfAssignmentEmail>(NoticeOfAssignmentEmail);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('SendNoaEmailEventHandler should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('handle', () => {
    it('should send noa email if the broker exists', async () => {
      const brokerStub = buildStubBroker();
      const invoiceStub = EntityStubs.buildStubInvoice();
      const clientStub = buildStubClient();
      const noaEmailSpy = jest.spyOn(noaEmail, 'send');

      const event = new SendNoaEvent({
        invoice: invoiceStub,
        client: clientStub,
        broker: brokerStub,
      });

      await handler.handleSendNoaEmail(event);

      expect(noaEmailSpy).toHaveBeenCalledTimes(1);
      expect(noaEmailSpy).toHaveBeenCalledWith({
        broker: brokerStub,
        client: clientStub,
      });
    });
  });
});
