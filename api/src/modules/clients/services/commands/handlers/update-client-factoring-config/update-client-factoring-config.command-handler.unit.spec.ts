import { mockMikroORMProvider, mockToken } from '@core/test';
import { ClientFactoringStatus } from '@module-persistence/entities';
import {
  ClientFactoringConfigsRepository,
  ClientStatusReasonAssocRepository,
} from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import Big from 'big.js';
import { UUID } from '@core/uuid';
import { ClientFactoringConfigRequestBuilder } from '../../../../test';
import { UpdateClientFactoringConfigCommand } from '../../update-client-factoring-config.command';
import { UpdateClientFactoringConfigCommandHandler } from './update-client-factoring-config.command-handler';
import { UpdateClientFactoringConfigValidationService } from './validation';
import {
  EntityStubs,
  PartialClientFactoringConfigsEntity,
} from '@module-persistence/test';

describe('UpdateClientFactoringConfigCommandHandler', () => {
  let clientFactoringConfigRepository: ClientFactoringConfigsRepository;
  let clientStatusReasonAssocRepository: ClientStatusReasonAssocRepository;
  let validationService: UpdateClientFactoringConfigValidationService;
  let handler: UpdateClientFactoringConfigCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        mockMikroORMProvider,
        UpdateClientFactoringConfigCommandHandler,
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    validationService = module.get(
      UpdateClientFactoringConfigValidationService,
    );
    clientStatusReasonAssocRepository = module.get(
      ClientStatusReasonAssocRepository,
    );
    clientFactoringConfigRepository = module.get(
      ClientFactoringConfigsRepository,
    );
    handler = module.get(UpdateClientFactoringConfigCommandHandler);
  });

  const mockClientFactoringConfig = (
    data?: PartialClientFactoringConfigsEntity,
  ) => {
    const stub = EntityStubs.buildClientFactoringConfig(data);
    jest
      .spyOn(clientFactoringConfigRepository, 'getOneByClientId')
      .mockResolvedValueOnce(stub);
    return stub;
  };

  it('Should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('Validation is called', async () => {
    mockClientFactoringConfig();
    const validateSpy = jest.spyOn(validationService, 'validate');

    await handler.execute(
      new UpdateClientFactoringConfigCommand(
        '',
        ClientFactoringConfigRequestBuilder.from(),
      ),
    );

    expect(validateSpy).toBeCalledTimes(1);
  });

  it('Association is done between the reason and status when status changes', async () => {
    mockClientFactoringConfig({
      status: ClientFactoringStatus.Onboarding,
    });
    const reasonAssocPersistSpy = jest.spyOn(
      clientStatusReasonAssocRepository,
      'persist',
    );

    await handler.execute(
      new UpdateClientFactoringConfigCommand(
        '',
        ClientFactoringConfigRequestBuilder.from({
          status: ClientFactoringStatus.Active,
        }),
      ),
    );

    expect(reasonAssocPersistSpy).toBeCalledTimes(1);
  });

  it('No status history entry is created when status does not change', async () => {
    mockClientFactoringConfig({
      status: ClientFactoringStatus.Active,
    });
    const reasonAssocPersistSpy = jest.spyOn(
      clientStatusReasonAssocRepository,
      'persist',
    );

    await handler.execute(
      new UpdateClientFactoringConfigCommand(
        '',
        ClientFactoringConfigRequestBuilder.from({
          status: ClientFactoringStatus.Active,
        }),
      ),
    );

    expect(reasonAssocPersistSpy).not.toBeCalled();
  });

  it('VIP status is set', async () => {
    const config = mockClientFactoringConfig({
      vip: false,
    });

    await handler.execute(
      new UpdateClientFactoringConfigCommand(
        '',
        ClientFactoringConfigRequestBuilder.from({
          vip: true,
        }),
      ),
    );

    expect(config.vip).toBeTruthy();
  });

  it('Requires verification status is set', async () => {
    const config = mockClientFactoringConfig({
      requiresVerification: false,
    });

    await handler.execute(
      new UpdateClientFactoringConfigCommand(
        '',
        ClientFactoringConfigRequestBuilder.from({
          requiresVerification: true,
        }),
      ),
    );

    expect(config.requiresVerification).toBeTruthy();
  });

  it('Success team is changed', async () => {
    const config = mockClientFactoringConfig();
    const newSuccessTeamId = UUID.get();

    await handler.execute(
      new UpdateClientFactoringConfigCommand(
        '',
        ClientFactoringConfigRequestBuilder.from({
          successTeamId: newSuccessTeamId,
        }),
      ),
    );

    expect(
      clientFactoringConfigRepository.updateClientSuccessTeam,
    ).toBeCalledWith(config, newSuccessTeamId);
  });
});

describe('Update client factoring config expedite flags', () => {
  let clientFactoringConfigRepository: ClientFactoringConfigsRepository;
  let handler: UpdateClientFactoringConfigCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UpdateClientFactoringConfigCommandHandler],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();
    clientFactoringConfigRepository = module.get(
      ClientFactoringConfigsRepository,
    );
    handler = module.get(UpdateClientFactoringConfigCommandHandler);
  });

  const mockClientFactoringConfig = (
    data?: PartialClientFactoringConfigsEntity,
  ) => {
    const stub = EntityStubs.buildClientFactoringConfig(data);
    jest
      .spyOn(clientFactoringConfigRepository, 'getOneByClientId')
      .mockResolvedValueOnce(stub);
    return stub;
  };

  it('Should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('Expedite transfer status is set to true', async () => {
    const config = mockClientFactoringConfig({
      expediteTransferOnly: false,
      doneSubmittingInvoices: false,
    });

    await handler.execute(
      new UpdateClientFactoringConfigCommand(
        '',
        ClientFactoringConfigRequestBuilder.from({
          expediteTransferOnly: true,
        }),
      ),
    );

    expect(config.expediteTransferOnly).toBeTruthy();
    expect(config.doneSubmittingInvoices).toBeFalsy();
  });

  it('Expedite transfer status is set to false', async () => {
    const config = mockClientFactoringConfig({
      expediteTransferOnly: true,
      doneSubmittingInvoices: true,
    });

    await handler.execute(
      new UpdateClientFactoringConfigCommand(
        '',
        ClientFactoringConfigRequestBuilder.from({
          expediteTransferOnly: false,
        }),
      ),
    );

    expect(config.expediteTransferOnly).toBeFalsy();
    expect(config.doneSubmittingInvoices).toBeFalsy();
  });

  it('Done submitting invoices flag is set to true', async () => {
    const config = mockClientFactoringConfig({
      expediteTransferOnly: false,
      doneSubmittingInvoices: false,
    });

    await handler.execute(
      new UpdateClientFactoringConfigCommand(
        '',
        ClientFactoringConfigRequestBuilder.from({
          doneSubmittingInvoices: true,
        }),
      ),
    );

    expect(config.expediteTransferOnly).toBeFalsy();
    expect(config.doneSubmittingInvoices).toBeTruthy();
  });

  it('Done submitting invoices flag is set to false', async () => {
    const config = mockClientFactoringConfig({
      expediteTransferOnly: true,
      doneSubmittingInvoices: true,
    });

    await handler.execute(
      new UpdateClientFactoringConfigCommand(
        '',
        ClientFactoringConfigRequestBuilder.from({
          doneSubmittingInvoices: false,
        }),
      ),
    );

    expect(config.expediteTransferOnly).toBeTruthy();
    expect(config.doneSubmittingInvoices).toBeFalsy();
  });

  it('Client limit is set', async () => {
    const config = mockClientFactoringConfig({
      clientLimitAmount: null,
    });

    await handler.execute(
      new UpdateClientFactoringConfigCommand(
        '',
        ClientFactoringConfigRequestBuilder.from({
          clientLimitAmount: new Big(1000),
          clientLimitNote: 'note',
        }),
      ),
    );

    expect(config.clientLimitAmount?.toNumber()).toBe(1000);
    expect(config.clientLimitHistory.length).toBe(1);
  });

  it('Payment plan is set', async () => {
    const config = mockClientFactoringConfig({
      paymentPlan: undefined,
    });

    await handler.execute(
      new UpdateClientFactoringConfigCommand(
        '',
        ClientFactoringConfigRequestBuilder.from({
          paymentPlan: 'payment-plan',
        }),
      ),
    );

    expect(config.paymentPlan).toBe('payment-plan');
    expect(config.paymentPlanHistory.length).toBe(1);
  });
});
