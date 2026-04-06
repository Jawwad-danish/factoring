import { runPeriodically } from './periodically';

describe('runPeriodically', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('should execute function periodically and return interval handle', async () => {
    const mockFn = jest.fn().mockResolvedValue(undefined);
    const result = runPeriodically(mockFn, 2);

    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(2000);
    await Promise.resolve();
    expect(mockFn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(2000);
    await Promise.resolve();
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should handle errors based on stopOnError flag', async () => {
    const error = new Error('Test error');
    const mockFnStop = jest.fn().mockRejectedValue(error);
    const mockFnContinue = jest.fn().mockRejectedValue(error);
    const mockFnDefault = jest.fn().mockRejectedValue(error);

    runPeriodically(mockFnStop, 1, true);
    runPeriodically(mockFnContinue, 1, false);
    runPeriodically(mockFnDefault, 1);

    jest.advanceTimersByTime(1000);
    await Promise.resolve();
    await Promise.resolve();

    expect(mockFnStop).toHaveBeenCalledTimes(1);
    expect(mockFnContinue).toHaveBeenCalledTimes(1);
    expect(mockFnDefault).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1000);
    await Promise.resolve();
    await Promise.resolve();

    expect(mockFnStop).toHaveBeenCalledTimes(1);
    expect(mockFnContinue).toHaveBeenCalledTimes(2);
    expect(mockFnDefault).toHaveBeenCalledTimes(1);
  });

  it('should handle successful execution and convert seconds correctly', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');

    runPeriodically(mockFn, 5);

    jest.advanceTimersByTime(4999);
    await Promise.resolve();
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    await Promise.resolve();
    expect(mockFn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(5000);
    await Promise.resolve();
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should allow manual clearing and handle async functions', async () => {
    const mockFn = jest.fn().mockResolvedValue(undefined);
    const interval = runPeriodically(mockFn, 1);

    jest.advanceTimersByTime(1000);
    await Promise.resolve();
    expect(mockFn).toHaveBeenCalledTimes(1);

    clearInterval(interval);

    jest.advanceTimersByTime(1000);
    await Promise.resolve();
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
