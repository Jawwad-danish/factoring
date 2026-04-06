import { mockToken } from '@core/test';
import { ClientFactoringStatus } from '@module-persistence/entities';
import { Test, TestingModule } from '@nestjs/testing';
import { ClientFactoringConfigRequestBuilder } from '../../../../../test';
import { ClientStatusChangeValidator } from './client-status-change.validator';
import { UpdateClientFactoringConfigValidationService } from './update-client-factoring-config-validation.service';
import { EntityStubs } from '@module-persistence/test';

describe('Update client factoring config validation service', () => {
  let validationService: UpdateClientFactoringConfigValidationService;
  let clientStatusChangeValidator: ClientStatusChangeValidator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UpdateClientFactoringConfigValidationService],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    validationService = module.get(
      UpdateClientFactoringConfigValidationService,
    );
    clientStatusChangeValidator = module.get(ClientStatusChangeValidator);
  });

  it('Service should be defined', () => {
    expect(validationService).toBeDefined();
  });

  it('Client status change validator is called', async () => {
    const validateSpy = jest.spyOn(clientStatusChangeValidator, 'validate');
    await validationService.validate([
      ClientFactoringConfigRequestBuilder.from({
        status: ClientFactoringStatus.Hold,
      }),
      EntityStubs.buildClientFactoringConfig(),
    ]);
    expect(validateSpy).toBeCalledTimes(1);
  });
});
