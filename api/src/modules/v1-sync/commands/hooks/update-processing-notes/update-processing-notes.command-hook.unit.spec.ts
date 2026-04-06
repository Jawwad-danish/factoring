import { mockToken } from '@core/test';
import { FeatureFlagResolver } from '@module-common';
import { UpdateProcessingNotesCommand } from '@module-processing-notes';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from '@core/uuid';
import { V1Api } from '../../../api';
import { UpdateProcessingNotesCommandHook } from './update-processing-notes.command-hook';
import { EntityStubs } from '@module-persistence/test';

describe('UpdateProcessingNotesCommandHook', () => {
  let featureFlagResolver: FeatureFlagResolver;
  let hook: UpdateProcessingNotesCommandHook;
  let v1Api: V1Api;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UpdateProcessingNotesCommandHook],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    featureFlagResolver = module.get(FeatureFlagResolver);
    hook = module.get(UpdateProcessingNotesCommandHook);
    v1Api = module.get(V1Api);
  });

  it('Should be defined', () => {
    expect(hook).toBeDefined();
  });

  it('When v1 payload, v1 client is called', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    const payload = {
      ingestThrough: true,
      v1Payload: {},
      id: UUID.get(),
      brokerId: UUID.get(),
      notes: 'notes',
    };
    await hook.afterCommand(
      new UpdateProcessingNotesCommand(UUID.get(), payload),
      EntityStubs.buildStubProcessingNotes(),
    );

    expect(jest.spyOn(v1Api, 'updateProcessingNotes')).toBeCalledTimes(1);
  });
});
