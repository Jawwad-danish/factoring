import { mockToken } from '@core/test';
import { Command } from './data';
import { CommandBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { CommandRunner } from './command-runner';
import { CommandHookManager, ICommandHook } from './hook';
import { createMock } from '@golevelup/ts-jest';

class TestCommand extends Command<object> {
  constructor() {
    super();
  }
}

describe('Command runner', () => {
  let commandRunner: CommandRunner;
  let commandBus: CommandBus;
  let commandHookManager: CommandHookManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommandRunner],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    commandHookManager = module.get(CommandHookManager);
    commandRunner = module.get(CommandRunner);
    commandBus = module.get(CommandBus);
  });

  it('Command runner should be defined', () => {
    expect(commandRunner).toBeDefined();
  });

  it('Command bus is called', async () => {
    const executeSpy = jest.spyOn(commandBus, 'execute');
    executeSpy.mockResolvedValueOnce({});

    await commandRunner.run(new TestCommand());

    expect(executeSpy).toBeCalledTimes(1);
  });

  it('When hook is found for command, and command is executed successfully then hook is called', async () => {
    const hook = createMock<ICommandHook<TestCommand>>();
    jest.spyOn(commandHookManager, 'findCommandHook').mockReturnValueOnce(hook);
    await commandRunner.run(new TestCommand());

    expect(hook.afterCommand).toBeCalledTimes(1);
  });

  it('When hook is found for command, and command execution fails then hook is called', async () => {
    const hook = createMock<ICommandHook<TestCommand>>();
    jest.spyOn(commandHookManager, 'findCommandHook').mockReturnValueOnce(hook);
    jest.spyOn(commandBus, 'execute').mockRejectedValueOnce(new Error());

    try {
      await commandRunner.run(new TestCommand());
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
    expect(hook.onCommandError).toBeCalled();
  });
});
