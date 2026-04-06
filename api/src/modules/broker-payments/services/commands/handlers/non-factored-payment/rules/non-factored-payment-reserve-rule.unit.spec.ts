import { mockToken } from '@core/test';
import {
  ReserveBrokerPaymentRepository,
  ReserveRepository,
} from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { buildStubCreateBrokerPaymentRequest } from '../../../../../test';
import { NonFactoredPaymentReserveRule } from './non-factored-payment-reserve-rule';
import { EntityStubs } from '@module-persistence/test';

describe('NonFactoredPaymentReserveRule', () => {
  let rule: NonFactoredPaymentReserveRule;
  let reserveRepository: ReserveRepository;
  let reserveBrokerPaymentRepository: ReserveBrokerPaymentRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NonFactoredPaymentReserveRule],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    rule = module.get(NonFactoredPaymentReserveRule);
    reserveRepository = module.get(ReserveRepository);
    reserveBrokerPaymentRepository = module.get(ReserveBrokerPaymentRepository);
  });

  it('Rule should be defined', () => {
    expect(rule).toBeDefined();
  });

  it('Persist a reserve', async () => {
    jest
      .spyOn(reserveRepository, 'persist')
      .mockReturnValue(EntityStubs.buildStubReserve());
    jest
      .spyOn(reserveBrokerPaymentRepository, 'persist')
      .mockReturnValue(EntityStubs.createStubReserveBrokerPayment());
    const invoice = EntityStubs.buildStubInvoice();
    await rule.run({
      brokerPayment: EntityStubs.buildStubBrokerPayment(),
      invoice: invoice,
      request: buildStubCreateBrokerPaymentRequest(),
    });

    expect(reserveRepository.persist).toBeCalledTimes(1);
    expect(reserveBrokerPaymentRepository.persist).toBeCalledTimes(1);
  });
});
