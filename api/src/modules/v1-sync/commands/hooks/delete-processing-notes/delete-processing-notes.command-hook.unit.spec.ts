import { mockToken } from '@core/test';
import { FeatureFlagResolver } from '@module-common';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from '@core/uuid';
import { V1Api } from '../../../api';
import { DeleteProcessingNotesCommandHook } from './delete-processing-notes.command-hook';
import { DeleteProcessingNotesCommand } from '@module-processing-notes';

describe('DeleteProcessingNotesCommandHook', () => {
  let featureFlagResolver: FeatureFlagResolver;
  let hook: DeleteProcessingNotesCommandHook;
  let v1Api: V1Api;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeleteProcessingNotesCommandHook],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    featureFlagResolver = module.get(FeatureFlagResolver);
    hook = module.get(DeleteProcessingNotesCommandHook);
    v1Api = module.get(V1Api);
  });

  it('Should be defined', () => {
    expect(hook).toBeDefined();
  });

  it('When ingest through is enabled, v1 client is called', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);

    await hook.afterCommand(
      new DeleteProcessingNotesCommand(UUID.get(), {
        ingestThrough: true,
      }),
    );

    expect(jest.spyOn(v1Api, 'deleteProcessingNotes')).toBeCalledTimes(1);
  });
});
