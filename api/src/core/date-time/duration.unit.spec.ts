import { Duration, TimeUnit } from './duration';

describe('Duration', () => {
  it('should create duration from all time units', () => {
    expect(Duration.fromNanoseconds(BigInt(1000)).asNumber()).toBe(1000);
    expect(Duration.fromMicroseconds(BigInt(500)).asNumber()).toBe(500);
    expect(Duration.fromMilliseconds(BigInt(250)).asNumber()).toBe(250);
    expect(Duration.fromSeconds(10).asNumber()).toBe(10);
  });

  it('should format value with 3 decimal places', () => {
    expect(Duration.fromSeconds(1.23456789).humanFriendly()).toBe('1.235');
    expect(Duration.fromSeconds(5).humanFriendly()).toBe('5.000');
  });

  it('should return numeric value', () => {
    expect(Duration.fromMilliseconds(BigInt(1500)).asNumber()).toBe(1500);
  });

  describe('toTimeUnit', () => {
    it('should convert to any time unit', () => {
      expect(
        Duration.fromMicroseconds(BigInt(1000))
          .toTimeUnit(TimeUnit.NANO)
          .asNumber(),
      ).toBe(1000000);
      expect(
        Duration.fromMilliseconds(BigInt(1))
          .toTimeUnit(TimeUnit.MICRO)
          .asNumber(),
      ).toBe(1000);
      expect(
        Duration.fromSeconds(1).toTimeUnit(TimeUnit.MILLI).asNumber(),
      ).toBe(1000);
      expect(
        Duration.fromMilliseconds(BigInt(5000))
          .toTimeUnit(TimeUnit.SECONDS)
          .asNumber(),
      ).toBe(5);
    });
  });

  describe('toNanoseconds', () => {
    it('should convert from all units to nanoseconds', () => {
      const duration = Duration.fromNanoseconds(BigInt(1000));
      expect(duration.toNanoseconds()).toBe(duration);
      expect(
        Duration.fromMicroseconds(BigInt(1)).toNanoseconds().asNumber(),
      ).toBe(1000);
      expect(
        Duration.fromMilliseconds(BigInt(1)).toNanoseconds().asNumber(),
      ).toBe(1000000);
      expect(Duration.fromSeconds(1).toNanoseconds().asNumber()).toBe(
        1000000000,
      );
    });
  });

  describe('toMicroseconds', () => {
    it('should convert from all units to microseconds', () => {
      expect(
        Duration.fromNanoseconds(BigInt(1000)).toMicroseconds().asNumber(),
      ).toBe(1);
      const duration = Duration.fromMicroseconds(BigInt(500));
      expect(duration.toMicroseconds()).toBe(duration);
      expect(
        Duration.fromMilliseconds(BigInt(1)).toMicroseconds().asNumber(),
      ).toBe(1000);
      expect(Duration.fromSeconds(1).toMicroseconds().asNumber()).toBe(1000000);
    });
  });

  describe('toMilliseconds', () => {
    it('should convert from all units to milliseconds', () => {
      expect(
        Duration.fromNanoseconds(BigInt(1000000)).toMilliseconds().asNumber(),
      ).toBe(1);
      expect(
        Duration.fromMicroseconds(BigInt(1000)).toMilliseconds().asNumber(),
      ).toBe(1);
      const duration = Duration.fromMilliseconds(BigInt(250));
      expect(duration.toMilliseconds()).toBe(duration);
      expect(Duration.fromSeconds(2).toMilliseconds().asNumber()).toBe(2000);
    });
  });

  describe('toSeconds', () => {
    it('should convert from all units to seconds', () => {
      expect(
        Duration.fromNanoseconds(BigInt(1000000000)).toSeconds().asNumber(),
      ).toBe(1);
      expect(
        Duration.fromMicroseconds(BigInt(1000000)).toSeconds().asNumber(),
      ).toBe(1);
      expect(
        Duration.fromMilliseconds(BigInt(3000)).toSeconds().asNumber(),
      ).toBe(3);
      const duration = Duration.fromSeconds(5);
      expect(duration.toSeconds()).toBe(duration);
    });
  });

  describe('conversion accuracy', () => {
    it('should maintain precision and handle edge cases', () => {
      expect(
        Duration.fromSeconds(1.5).toMilliseconds().toSeconds().asNumber(),
      ).toBe(1.5);
      expect(
        Duration.fromNanoseconds(BigInt(9999999999)).toSeconds().asNumber(),
      ).toBeCloseTo(9.999999999, 9);
      expect(Duration.fromSeconds(0.001).toMilliseconds().asNumber()).toBe(1);
    });
  });

  it('should handle edge cases', () => {
    const duration = Duration.fromSeconds(0);
    expect(duration.asNumber()).toBe(0);
    expect(duration.toMilliseconds().asNumber()).toBe(0);
    expect(
      Duration.fromNanoseconds(BigInt(999999999999999)).asNumber(),
    ).toBeGreaterThan(0);
  });
});
