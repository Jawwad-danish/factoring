import { mockToken } from '@core/test';
import { Test, TestingModule } from '@nestjs/testing';
import { ReleaseValidationService } from './release-validation.service';
import { NotPaidByBrokerValidator } from './not-paid-by-broker.validator';
import { EntityStubs } from '@module-persistence/test';

describe('Release client broker assignment validation service', () => {
  let validationService: ReleaseValidationService;
  let notPaidByBrokerValidator: NotPaidByBrokerValidator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReleaseValidationService],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    validationService = module.get(ReleaseValidationService);
    notPaidByBrokerValidator = module.get(NotPaidByBrokerValidator);
  });

  it('Service should be defined', () => {
    expect(validationService).toBeDefined();
  });

  it('Not paid by broker validator is called', async () => {
    const validateSpy = jest.spyOn(notPaidByBrokerValidator, 'validate');
    await validationService.validate(EntityStubs.buildClientBrokerAssignment());
    expect(validateSpy).toBeCalledTimes(1);
  });
});
