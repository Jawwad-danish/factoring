import Big from 'big.js';

export enum TimeUnit {
  NANO = 'nanoseconds',
  MICRO = 'microseconds',
  MILLI = 'milliseconds',
  SECONDS = 'seconds',
}
export class Duration {
  private static TEN_9 = new Big(10).pow(9);
  private static TEN_6 = new Big(10).pow(6);
  private static TEN_3 = new Big(10).pow(3);

  private constructor(
    private readonly value: Big,
    private readonly timeUnit: TimeUnit,
  ) {}

  humanFriendly(): string {
    return this.value.toFixed(3);
  }

  asNumber(): number {
    return this.value.toNumber();
  }

  toTimeUnit(unit: TimeUnit): Duration {
    switch (unit) {
      case TimeUnit.NANO:
        return this.toNanoseconds();
      case TimeUnit.MICRO:
        return this.toMicroseconds();
      case TimeUnit.MILLI:
        return this.toMilliseconds();
      case TimeUnit.SECONDS:
        return this.toSeconds();

      default:
        throw new Error(
          `Could not convert Duration from ${this.timeUnit} to ${unit}`,
        );
    }
  }

  toNanoseconds(): Duration {
    switch (this.timeUnit) {
      case TimeUnit.NANO:
        return this;

      case TimeUnit.MICRO:
        return new Duration(this.value.times(Duration.TEN_3), TimeUnit.NANO);

      case TimeUnit.MILLI:
        return new Duration(this.value.times(Duration.TEN_6), TimeUnit.NANO);

      case TimeUnit.SECONDS:
        return new Duration(this.value.times(Duration.TEN_9), TimeUnit.NANO);

      default:
        throw new Error(
          `Could not convert Duration from ${this.timeUnit} to ${TimeUnit.NANO}`,
        );
    }
  }

  toMicroseconds(): Duration {
    switch (this.timeUnit) {
      case TimeUnit.NANO:
        return new Duration(this.value.div(Duration.TEN_3), TimeUnit.MICRO);

      case TimeUnit.MICRO:
        return this;

      case TimeUnit.MILLI:
        return new Duration(this.value.times(Duration.TEN_3), TimeUnit.MICRO);

      case TimeUnit.SECONDS:
        return new Duration(this.value.times(Duration.TEN_6), TimeUnit.MICRO);

      default:
        throw new Error(
          `Could not convert Duration from ${this.timeUnit} to ${TimeUnit.MICRO}`,
        );
    }
  }

  toMilliseconds(): Duration {
    switch (this.timeUnit) {
      case TimeUnit.NANO:
        return new Duration(this.value.div(Duration.TEN_6), TimeUnit.MILLI);

      case TimeUnit.MICRO:
        return new Duration(this.value.div(Duration.TEN_3), TimeUnit.MILLI);

      case TimeUnit.MILLI:
        return this;

      case TimeUnit.SECONDS:
        return new Duration(this.value.times(Duration.TEN_3), TimeUnit.MILLI);

      default:
        throw new Error(
          `Could not convert Duration from ${this.timeUnit} to ${TimeUnit.MILLI}`,
        );
    }
  }

  toSeconds(): Duration {
    switch (this.timeUnit) {
      case TimeUnit.NANO:
        return new Duration(this.value.div(Duration.TEN_9), TimeUnit.SECONDS);

      case TimeUnit.MICRO:
        return new Duration(this.value.div(Duration.TEN_6), TimeUnit.SECONDS);

      case TimeUnit.MILLI:
        return new Duration(this.value.div(Duration.TEN_3), TimeUnit.SECONDS);

      case TimeUnit.SECONDS:
        return this;

      default:
        throw new Error(
          `Could not convert Duration from ${this.timeUnit} to ${TimeUnit.SECONDS}`,
        );
    }
  }

  static fromNanoseconds(value: bigint) {
    return new Duration(new Big(`${value}`), TimeUnit.NANO);
  }

  static fromMicroseconds(value: bigint) {
    return new Duration(new Big(`${value}`), TimeUnit.MICRO);
  }

  static fromMilliseconds(value: bigint) {
    return new Duration(new Big(`${value}`), TimeUnit.MILLI);
  }

  static fromSeconds(value: number) {
    return new Duration(new Big(`${value}`), TimeUnit.SECONDS);
  }
}
