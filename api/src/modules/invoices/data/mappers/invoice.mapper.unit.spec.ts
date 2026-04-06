import { mockMikroORMProvider, mockToken } from '@core/test';
import { EntityStubs } from '@module-persistence/test';
import { UserMapper } from '@module-common';
import {
  ClientFactoringConfigsEntity,
  ClientFactoringConfigsRepository,
} from '@module-persistence';
import { Test, TestingModule } from '@nestjs/testing';
import Big from 'big.js';
import { buildStubCreateInvoiceRequest } from '../../tests';
import { InvoiceMapper } from './invoice.mapper';

describe('InvoiceMapper', () => {
  let mapper: InvoiceMapper;
  let clientFactoringConfigRepository: ClientFactoringConfigsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [mockMikroORMProvider, InvoiceMapper, UserMapper],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    mapper = module.get(InvoiceMapper);
    clientFactoringConfigRepository = module.get(
      ClientFactoringConfigsRepository,
    );
  }, 60000);

  const mockClientConfig = (clientConfig: ClientFactoringConfigsEntity) => {
    jest
      .spyOn(clientFactoringConfigRepository, 'getOneByClientId')
      .mockResolvedValueOnce(clientConfig);
    return clientConfig;
  };

  it('should be defined', () => {
    expect(mapper).toBeDefined();
  });

  it('should convert entity to model correctly', async () => {
    const entity = EntityStubs.buildStubInvoice();
    const model = await mapper.entityToModel(entity);

    expect(model.id).toBe(entity.id);
    expect(model.loadNumber).toStrictEqual(entity.loadNumber);
    expect(model.note).toStrictEqual(entity.note);
    expect(model.memo).toStrictEqual(entity.memo);
    expect(model.lineHaulRate.toFixed()).toStrictEqual(
      entity.lineHaulRate.toFixed(),
    );
    expect(model.detention.toFixed()).toStrictEqual(entity.detention.toFixed());
    expect(model.lumper.toFixed()).toStrictEqual(entity.lumper.toFixed());
    expect(model.advance.toFixed()).toStrictEqual(entity.advance.toFixed());
    expect(model.approvedFactorFee.toFixed()).toStrictEqual(
      entity.approvedFactorFee.toFixed(),
    );
    expect(model.reserveFee.toFixed()).toStrictEqual(
      entity.reserveFee.toFixed(),
    );
    expect(model.reserveRatePercentage.toFixed()).toStrictEqual(
      entity.reserveRatePercentage.toFixed(),
    );
    expect(model.deduction.toFixed()).toStrictEqual(entity.deduction.toFixed());
    expect(model.expedited).toStrictEqual(entity.expedited);
    expect(model.createdAt).toStrictEqual(entity.createdAt);
    expect(model.createdBy?.id).toBe(entity.createdBy?.id);
    expect(model.updatedAt).toStrictEqual(entity.updatedAt);
    expect(model.updatedBy?.id).toBe(entity.updatedBy?.id);
  });

  it('should calculate invoice value correctly at creation', async () => {
    mockClientConfig(EntityStubs.buildClientFactoringConfig());

    const entity = await mapper.createRequestToEntity(
      buildStubCreateInvoiceRequest({
        lumper: new Big(40),
        detention: new Big(50),
        advance: new Big(70),
        lineHaulRate: new Big(1020),
      }),
    );
    expect(entity.value.toNumber()).toBe(1040);
  });

  it('should set expedited=true when client.expediteTransferOnly=true', async () => {
    const clientConfig = mockClientConfig(
      EntityStubs.buildClientFactoringConfig({
        expediteTransferOnly: true,
      }),
    );
    const entity = await mapper.createRequestToEntity(
      buildStubCreateInvoiceRequest({
        expedited: false,
      }),
    );

    expect(clientConfig.expediteTransferOnly).toStrictEqual(true);
    expect(entity.expedited).toStrictEqual(true);
  });

  it('should set expedited=true when request.expedited=true', async () => {
    const invoiceRequestModel = buildStubCreateInvoiceRequest({
      expedited: true,
    });
    const clientConfig = mockClientConfig(
      EntityStubs.buildClientFactoringConfig({
        expediteTransferOnly: false,
      }),
    );
    const entity = await mapper.createRequestToEntity(invoiceRequestModel);

    expect(clientConfig.expediteTransferOnly).toStrictEqual(false);
    expect(entity.expedited).toStrictEqual(true);
  });

  it('should set expedited=false when both expedite flags are false', async () => {
    const invoiceRequestModel = buildStubCreateInvoiceRequest({
      expedited: false,
    });
    const clientConfig = mockClientConfig(
      EntityStubs.buildClientFactoringConfig({
        expediteTransferOnly: false,
      }),
    );

    const entity = await mapper.createRequestToEntity(invoiceRequestModel);

    expect(invoiceRequestModel.expedited).toStrictEqual(false);
    expect(clientConfig.expediteTransferOnly).toStrictEqual(false);
    expect(entity.expedited).toStrictEqual(false);
  });
});
