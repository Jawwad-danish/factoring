import Big, { RoundingMode } from 'big.js';

export interface FieldEqualityConfiguration {
  number: {
    ignoreDecimals: boolean;
    roundingMode: RoundingMode;
  };
  date: {
    acceptableDifferenceMilliseconds: number;
  };
}

const buildFieldEqualityConfiguration = (
  data?: Partial<FieldEqualityConfiguration>,
): FieldEqualityConfiguration => {
  const configuration: FieldEqualityConfiguration = {
    number: {
      ignoreDecimals: false,
      roundingMode: 1,
    },
    date: {
      acceptableDifferenceMilliseconds: 60000,
    },
  };
  if (data) {
    Object.assign(configuration, data);
  }
  return configuration;
};

export class FieldEqualityManager<E> {
  constructor(
    public fieldName: keyof E,
    private readonly configuration?: Partial<FieldEqualityConfiguration>,
  ) {}

  areFieldsEqual(v1Entity: E, v2Entity: E): boolean {
    return this.defaultEqualityChecker(v1Entity, v2Entity);
  }

  protected defaultEqualityChecker(v1Entity: E, v2Entity: E): boolean {
    const configuration = buildFieldEqualityConfiguration(this.configuration);
    const v1Field = v1Entity[this.fieldName];
    const v2Field = v2Entity[this.fieldName];
    if (v1Field instanceof Big && v2Field instanceof Big) {
      if (configuration.number.ignoreDecimals) {
        const roundedNumber1 = new Big(
          v1Field.toFixed(0, configuration.number.roundingMode),
        );
        const roundedNumber2 = new Big(
          v2Field.toFixed(0, configuration.number.roundingMode),
        );
        return roundedNumber1.eq(roundedNumber2);
      }
      return v1Field.eq(v2Field);
    }
    if (v1Field instanceof Date && v2Field instanceof Date) {
      return (
        Math.abs(v1Field.getTime() - v2Field.getTime()) <
        configuration.date.acceptableDifferenceMilliseconds
      );
    }
    return v1Field == v2Field;
  }
}
