import { mockToken } from '@core/test';
import { FeatureFlagResolver } from '@module-common';
import { RequestCommand } from '@module-cqrs';
import { DatabaseService } from '@module-database';
import { Injectable } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { V1AwareBaseModel } from '../../../../core/data';
import { V1SyncCommandHook } from './v1-sync.command-hook';

class TestRequest extends V1AwareBaseModel<TestRequest> {}

class TestCommand extends RequestCommand<TestRequest, string> {}

@Injectable()
class TestV1SyncCommandHook extends V1SyncCommandHook<TestCommand> {
  constructor(
    featureFlagResolver: FeatureFlagResolver,
    databaseService: DatabaseService,
  ) {
    super(featureFlagResolver, databaseService);
  }
  // @ts-expect-error
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected doAfterCommand(command: TestCommand): Promise<void> {}

  // @ts-expect-error
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected doBeforeCommand(command: TestCommand): Promise<void> {}
}

describe('V1SyncCommandHook', () => {
  let databaseService: DatabaseService;
  let featureFlagResolver: FeatureFlagResolver;
  let hook: TestV1SyncCommandHook;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TestV1SyncCommandHook],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    databaseService = module.get(DatabaseService);
    featureFlagResolver = module.get(FeatureFlagResolver);
    hook = module.get(TestV1SyncCommandHook);
  });

  it('Should be defined', () => {
    expect(hook).toBeDefined();
  });

  it('When feature flag is disabled database flush and v1 are not called', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(false);
    await hook.afterCommand(new TestCommand(new TestRequest()), '');

    expect(jest.spyOn(databaseService, 'flush')).toBeCalledTimes(0);
  });

  it('When feature flag is enabled, and ingest through is false, database flush is not called', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    await hook.afterCommand(
      new TestCommand(new TestRequest({ ingestThrough: false })),
      '',
    );

    expect(jest.spyOn(databaseService, 'flush')).toBeCalledTimes(0);
  });

  it('When feature flag is enabled, and ingest through is true, database flush is called', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    await hook.afterCommand(
      new TestCommand(new TestRequest({ ingestThrough: true })),
      '',
    );

    expect(jest.spyOn(databaseService, 'flush')).toBeCalledTimes(1);
  });

  it('When feature flag is disabled doBeforeCommand is not called', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(false);
    const doBeforeSpy = jest.spyOn(hook as any, 'doBeforeCommand');

    await hook.beforeCommand(new TestCommand(new TestRequest()));

    expect(doBeforeSpy).toBeCalledTimes(0);
  });

  it('When feature flag is enabled, and ingest through is false, doBeforeCommand is not called', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    const doBeforeSpy = jest.spyOn(hook as any, 'doBeforeCommand');

    await hook.beforeCommand(
      new TestCommand(new TestRequest({ ingestThrough: false })),
    );

    expect(doBeforeSpy).toBeCalledTimes(0);
  });

  it('When feature flag is enabled, and ingest through is true, doBeforeCommand is called', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    const doBeforeSpy = jest.spyOn(hook as any, 'doBeforeCommand');

    await hook.beforeCommand(
      new TestCommand(new TestRequest({ ingestThrough: true })),
    );

    expect(doBeforeSpy).toBeCalledTimes(1);
  });

  it('When doBeforeCommand throws, it logs error and rethrows', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    const doBeforeSpy = jest
      .spyOn(hook as any, 'doBeforeCommand')
      .mockRejectedValue(new Error('Test error'));
    const logSpy = jest.spyOn(hook.logger, 'error');

    await expect(
      hook.beforeCommand(
        new TestCommand(new TestRequest({ ingestThrough: true })),
      ),
    ).rejects.toThrow('Test error');

    expect(doBeforeSpy).toBeCalledTimes(1);
    expect(logSpy).toBeCalledWith(
      'Before hook for command failed',
      expect.objectContaining({ error: 'Test error' }),
    );
  });
});
