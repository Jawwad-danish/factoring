import { delay } from './delay';

describe('delay', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should resolve after specified milliseconds', async () => {
    const promise1000 = delay(1000);
    const promise0 = delay(0);
    const promise100000 = delay(100000);

    jest.advanceTimersByTime(0);
    await expect(promise0).resolves.toBeUndefined();

    jest.advanceTimersByTime(1000);
    await expect(promise1000).resolves.toBeUndefined();

    jest.advanceTimersByTime(99000);
    await expect(promise100000).resolves.toBeUndefined();
  });

  it('should handle multiple concurrent delays', async () => {
    const promise1 = delay(100);
    const promise2 = delay(200);
    const promise3 = delay(300);

    jest.advanceTimersByTime(100);
    await expect(promise1).resolves.toBeUndefined();

    jest.advanceTimersByTime(100);
    await expect(promise2).resolves.toBeUndefined();

    jest.advanceTimersByTime(100);
    await expect(promise3).resolves.toBeUndefined();
  });
});
