import { FieldEqualityManager } from '../../util/parity/field-equality-manager';

export interface FieldDifference {
  key: string;
  v1Value: any;
  v2Value: any;
}

export class ParityResult {
  private readonly differences: FieldDifference[] = [];

  areMatching(): boolean {
    return this.differences.length === 0;
  }

  addDifference(difference: FieldDifference) {
    this.differences.push(difference);
  }

  getDifferences(): FieldDifference[] {
    return this.differences;
  }
}

export class ParityChecker<E> {
  constructor(readonly equalityFields: Array<FieldEqualityManager<E>>) {}

  checkEquality(v1Object: E, v2Object: E): ParityResult {
    const result = new ParityResult();
    for (const equalityField of this.equalityFields) {
      const v1Value = v1Object[equalityField.fieldName];
      const v2Value = v2Object[equalityField.fieldName];
      if (v1Value === undefined) {
        result.addDifference({
          key: equalityField.fieldName as string,
          v1Value,
          v2Value,
        });
        continue;
      }

      const areFieldsEqual = equalityField.areFieldsEqual(v1Object, v2Object);
      if (!areFieldsEqual) {
        result.addDifference({
          key: equalityField.fieldName as string,
          v1Value,
          v2Value,
        });
      }
    }
    return result;
  }
}
