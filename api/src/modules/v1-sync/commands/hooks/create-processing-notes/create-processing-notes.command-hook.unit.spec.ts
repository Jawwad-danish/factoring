import { mockToken } from '@core/test';
import { FeatureFlagResolver } from '@module-common';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from '@core/uuid';
import { V1Api } from '../../../api';
import { CreateProcessingNotesCommandHook } from './create-processing-notes.command-hook';
import { CreateProcessingNotesCommand } from '@module-processing-notes';
import { EntityStubs } from '@module-persistence/test';

describe('CreateProcessingNotesCommandHook', () => {
  let featureFlagResolver: FeatureFlagResolver;
  let hook: CreateProcessingNotesCommandHook;
  let v1Api: V1Api;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreateProcessingNotesCommandHook],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    featureFlagResolver = module.get(FeatureFlagResolver);
    hook = module.get(CreateProcessingNotesCommandHook);
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
      new CreateProcessingNotesCommand(payload),
      EntityStubs.buildStubProcessingNotes(),
    );

    expect(jest.spyOn(v1Api, 'createProcessingNotes')).toBeCalledTimes(1);
  });
});
