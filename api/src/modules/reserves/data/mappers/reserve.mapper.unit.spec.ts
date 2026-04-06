import { Test, TestingModule } from '@nestjs/testing';
import { EntityStubs } from '@module-persistence/test';
import { ReserveMapper } from './reserve.mapper';
import Big from 'big.js';
import { UserMapper } from '@module-common';
import { ReservePayloadType } from '../reserve-payload.request';
import { dollarsToPennies } from '@core/formulas';

describe('Reserve mapper', () => {
  let mapper: ReserveMapper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserMapper, ReserveMapper],
    }).compile();

    mapper = module.get(ReserveMapper);
  }, 60000);

  it('Should be defined', () => {
    expect(mapper).toBeDefined();
  });

  it('Entity is converted to model', async () => {
    const entity = EntityStubs.buildStubReserve();
    const model = await mapper.entityToModel(entity, new Big(100));

    expect(model.id).toBe(entity.id);
    expect(model.amount.toFixed()).toBe(entity.amount.toFixed());
    expect(model.reason).toBe(entity.reason);
    expect(model.note).toBe(entity.note);
    expect(model.clientId).toBe(entity.clientId);
    expect(model.createdAt).toStrictEqual(entity.createdAt);
    expect(model.createdBy?.id).toBe(entity.createdBy?.id);
    expect(model.updatedAt).toStrictEqual(entity.createdAt);
    expect(model.updatedBy?.id).toBe(entity.createdBy?.id);
    expect(model.total.toNumber()).toBe(100);
  });

  it('Create reserve request from referral rock', async () => {
    const amount = 500;
    const referralDisplayName = 'John';
    const rewardId = '00000000-0000-0000-0000-000000000000';
    const reserveRequest = await mapper.mapReferralRewardToReserveRequest(
      amount,
      referralDisplayName,
      rewardId,
    );

    expect(reserveRequest.amount).toStrictEqual(dollarsToPennies(amount));
    expect(reserveRequest.note).toBe(
      'reward for referring John reward ID 00000000-0000-0000-0000-000000000000',
    );
    expect(reserveRequest.payload.payloadType).toBe(
      ReservePayloadType.ClientCredit,
    );
  });
});
