import { mockToken } from '@core/test';
import { ValidationError } from '@core/validation';
import { BrokerEmailType, BrokerService } from '@module-brokers';
import { buildStubBroker } from '@module-brokers/test';
import { buildStubClient } from '@module-clients/test';
import { UpdateInvoiceRequest } from '@module-invoices/data';
import { buildStubUpdateInvoiceRequest } from '@module-invoices/test';
import {
  ClientPaymentStatus,
  InvoiceStatus,
} from '@module-persistence/entities';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from '@core/uuid';
import { BrokerUpdateOnPurchasedValidator } from './broker-update-on-purchased.validator';
import { EntityStubs } from '@module-persistence/test';

describe('Broker update on purchase validator', () => {
  let validator: BrokerUpdateOnPurchasedValidator<UpdateInvoiceRequest>;
  let brokerService: BrokerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BrokerUpdateOnPurchasedValidator],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    validator = module.get(BrokerUpdateOnPurchasedValidator);
    brokerService = module.get(BrokerService);
  });

  it('Updating invoice to broker with emails does not throw error for sent clientPaymentStatus ', async () => {
    const broker = buildStubBroker();

    jest
      .spyOn(brokerService, 'findOneById')
      .mockReturnValueOnce(Promise.resolve(buildStubBroker()));

    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice({
          status: InvoiceStatus.Purchased,
          clientPaymentStatus: ClientPaymentStatus.Sent,
          brokerId: broker.id,
        }),
        client: buildStubClient(),
        broker: broker,
        payload: buildStubUpdateInvoiceRequest({
          brokerId: UUID.get(),
        }),
      }),
    ).resolves.not.toThrow(ValidationError);
  });

  it('Updating invoice to broker with emails does not throw error for completed clientPaymentStatus ', async () => {
    const broker = buildStubBroker();

    jest
      .spyOn(brokerService, 'findOneById')
      .mockReturnValueOnce(Promise.resolve(buildStubBroker()));

    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice({
          status: InvoiceStatus.Purchased,
          clientPaymentStatus: ClientPaymentStatus.Completed,
          brokerId: broker.id,
        }),
        client: buildStubClient(),
        broker: broker,
        payload: buildStubUpdateInvoiceRequest({
          brokerId: UUID.get(),
        }),
      }),
    ).resolves.not.toThrow(ValidationError);
  });

  it('Updating invoice to broker without emails throws error for sent status ', async () => {
    const broker = buildStubBroker();

    jest
      .spyOn(brokerService, 'findOneById')
      .mockReturnValueOnce(Promise.resolve(buildStubBroker({ emails: [] })));

    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice({
          status: InvoiceStatus.Purchased,
          clientPaymentStatus: ClientPaymentStatus.Sent,
          brokerId: broker.id,
        }),
        client: buildStubClient(),
        broker: broker,
        payload: buildStubUpdateInvoiceRequest({
          brokerId: UUID.get(),
        }),
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('Updating invoice with broker with partial emails throws error', async () => {
    const broker = buildStubBroker();
    const onlyNoa = broker.emails.filter(
      (email) => email.type === BrokerEmailType.NOA,
    );
    const onlyInvoiceDetails = broker.emails.filter(
      (email) => email.type === BrokerEmailType.InvoiceDelivery,
    );
    const spy = jest.spyOn(brokerService, 'findOneById');

    spy.mockReturnValueOnce(
      Promise.resolve(buildStubBroker({ emails: onlyNoa })),
    );

    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice({
          status: InvoiceStatus.Purchased,
          clientPaymentStatus: ClientPaymentStatus.Sent,
          brokerId: broker.id,
        }),
        client: buildStubClient(),
        broker: broker,
        payload: buildStubUpdateInvoiceRequest({
          brokerId: UUID.get(),
        }),
      }),
    ).rejects.toThrow(ValidationError);

    spy.mockReturnValueOnce(
      Promise.resolve(buildStubBroker({ emails: onlyInvoiceDetails })),
    );

    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice({
          status: InvoiceStatus.Purchased,
          clientPaymentStatus: ClientPaymentStatus.Sent,
          brokerId: broker.id,
        }),
        client: buildStubClient(),
        broker: broker,
        payload: buildStubUpdateInvoiceRequest({
          brokerId: UUID.get(),
        }),
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('Updating invoice with broker without payment email does not throw error', async () => {
    const broker = buildStubBroker();

    jest.spyOn(brokerService, 'findOneById').mockReturnValueOnce(
      Promise.resolve(
        buildStubBroker({
          emails: broker.emails.filter(
            (email) => email.type !== BrokerEmailType.PaymentStatus,
          ),
        }),
      ),
    );

    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice({
          status: InvoiceStatus.Purchased,
          clientPaymentStatus: ClientPaymentStatus.Completed,
        }),
        client: buildStubClient(),
        broker: broker,
        payload: buildStubUpdateInvoiceRequest({
          brokerId: UUID.get(),
        }),
      }),
    ).resolves.not.toThrow(ValidationError);
  });

  it('Updating invoice to broker without emails throws error for completed status ', async () => {
    const broker = buildStubBroker();

    jest
      .spyOn(brokerService, 'findOneById')
      .mockReturnValueOnce(Promise.resolve(buildStubBroker({ emails: [] })));

    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice({
          status: InvoiceStatus.Purchased,
          clientPaymentStatus: ClientPaymentStatus.Completed,
        }),
        client: buildStubClient(),
        broker: broker,
        payload: buildStubUpdateInvoiceRequest({
          brokerId: UUID.get(),
        }),
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('Updating invoice to broker not found throws error for sent status ', async () => {
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice({
          status: InvoiceStatus.Purchased,
          clientPaymentStatus: ClientPaymentStatus.Sent,
        }),
        client: buildStubClient(),
        broker: null,
        payload: buildStubUpdateInvoiceRequest({
          brokerId: null,
        }),
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('Updating invoice to broker not found throws error for completed status ', async () => {
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice({
          status: InvoiceStatus.Purchased,
          clientPaymentStatus: ClientPaymentStatus.Completed,
        }),
        client: buildStubClient(),
        broker: null,
        payload: buildStubUpdateInvoiceRequest({
          brokerId: null,
        }),
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('Updating invoice new not found broker', async () => {
    const broker = buildStubBroker();

    jest
      .spyOn(brokerService, 'findOneById')
      .mockReturnValueOnce(Promise.resolve(null));

    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice({
          status: InvoiceStatus.Purchased,
          clientPaymentStatus: ClientPaymentStatus.Completed,
        }),
        client: buildStubClient(),
        broker: broker,
        payload: buildStubUpdateInvoiceRequest({
          brokerId: UUID.get(),
        }),
      }),
    ).rejects.toThrow(ValidationError);
  });
});
