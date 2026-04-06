import { Account } from '@balancer-team/quickbooks/dist/schemas';
import { createMock } from '@golevelup/ts-jest';
import { QuickbooksAccountsRepository } from '@module-persistence';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import { QuickbooksApi } from '../../../../api';
import { SyncAccountsCommandHandler } from './sync-accounts.command-handler';

describe('SyncAccountsCommandHandler', () => {
  let handler: SyncAccountsCommandHandler;
  const quickbooksApiMock = createMock<QuickbooksApi>();
  const repository = createMock<QuickbooksAccountsRepository>();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncAccountsCommandHandler,
        {
          provide: QuickbooksApi,
          useValue: quickbooksApiMock,
        },
        {
          provide: QuickbooksAccountsRepository,
          useValue: repository,
        },
      ],
    }).compile();

    handler = module.get(SyncAccountsCommandHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should do nothing if no accounts need syncing', async () => {
    repository.findAll.mockResolvedValue([[], 0]);

    await handler.execute();

    expect(quickbooksApiMock.getAccounts).not.toHaveBeenCalled();
  });

  it('should sync accounts successfully', async () => {
    const localAccount = EntityStubs.buildStubQuickbooksAccount({
      name: 'Bank',
    });
    const apiAccount = { Id: 'qb-123', Name: 'Bank' } as Account;

    repository.findAll.mockResolvedValue([[localAccount], 1]);
    quickbooksApiMock.getAccounts.mockResolvedValue([apiAccount]);

    await handler.execute();

    expect(localAccount.quickbooksId).toBe('qb-123');
  });
});
