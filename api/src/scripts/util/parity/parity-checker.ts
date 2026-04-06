import { BasicEntity } from '@module-persistence/entities';
import _ from 'lodash';
import { FieldEqualityManager } from './field-equality-manager';
import { FieldDifference, ParityReport } from './parity-report';

export class ParityChecker<E extends BasicEntity> {
  constructor(
    readonly fieldsToCheck: Array<FieldEqualityManager<E>>,
    readonly report: ParityReport<E>,
    readonly rawChecks?: Array<() => Promise<void>>,
    readonly differenceMapper?: (
      result: FieldDifference<E>,
    ) => FieldDifference<E>,
  ) {}

  async checkEquality(v1Object: E, v2Object: E): Promise<void> {
    const areObjectsMatching = _.every(
      this.fieldsToCheck.map((equalityManager) => {
        const v1Value = v1Object[equalityManager.fieldName];
        const v2Value = v2Object[equalityManager.fieldName];
        if (v1Value === undefined) {
          const difference = {
            key: equalityManager.fieldName,
            v1Value: 'undefined',
            v2Value: v2Value,
          };
          this.report.addDifference(
            v1Object,
            difference,
            this.differenceMapper,
          );
          return false;
        }
        const areFieldsEqual = equalityManager.areFieldsEqual(
          v1Object,
          v2Object,
        );
        if (!areFieldsEqual) {
          const difference = {
            key: equalityManager.fieldName,
            v1Value: v1Value,
            v2Value: v2Value,
          };
          this.report.addDifference(
            v1Object,
            difference,
            this.differenceMapper,
          );
          return false;
        }
        return true;
      }),
    );

    if (areObjectsMatching) {
      this.report.incrementCountMatching();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async checkRawEquality(_v1Object: any, _v2Object: E): Promise<void> {
    return;
  }
}
