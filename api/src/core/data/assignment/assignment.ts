import Big from 'big.js';
import { isNil } from 'lodash';
import { Note } from '../note';
import { AssignmentResult } from './assignment-result';

export class Assignment {
  static changeSetMappers = {
    big: (value: Big) => value.toFixed(),
    date: (value: Date) => value.toISOString(),
  };
  static predicates = {
    big: (v1: Big, v2: Big) => !v1.eq(v2),
    date: (v1: Date, v2: Date) => v1.getTime() != v2.getTime(),
  };

  static assign<TARGET extends object, KEY extends keyof TARGET>(
    target: TARGET,
    key: KEY,
    value: undefined | TARGET[KEY],
    options?: {
      valueMapper?: (input: TARGET[KEY]) => any;
      predicate?: (v1: TARGET[KEY], v2: TARGET[KEY]) => boolean;
      note?: {
        name?: string;
        valueMapper?: (input: TARGET[KEY]) => string;
      };
    },
  ): AssignmentResult {
    const defaultMapper = (input: undefined | TARGET[KEY]) => input;
    const defaultPredicate = (v1: TARGET[KEY], v2: TARGET[KEY]) => v1 !== v2;
    const defaultNoteValueMapper = (input: TARGET[KEY]) => `${input}`;
    const valueMapper = options?.valueMapper ?? defaultMapper;
    const predicate = options?.predicate ?? defaultPredicate;
    const propertyNote = options?.note?.name ?? key;
    const noteMapper = options?.note?.valueMapper ?? defaultNoteValueMapper;
    if (value !== undefined && predicate(value, target[key])) {
      const oldValue = valueMapper(target[key]);
      const newValue = valueMapper(value);

      let noteMessage: string;
      if (isNil(oldValue)) {
        noteMessage = `Changed ${String(propertyNote)} to ${noteMapper(
          newValue,
        )}`;
      } else if (isNil(value)) {
        noteMessage = `Cleared ${String(propertyNote)} (was ${noteMapper(
          oldValue,
        )})`;
      } else {
        noteMessage = `Changed ${String(propertyNote)} from ${noteMapper(
          oldValue,
        )} to ${noteMapper(newValue)}`;
      }

      target[key] = value;
      return new AssignmentResult([
        Note.from({
          payload: {
            [key]: {
              oldValue: oldValue,
              newValue: newValue,
            },
          },
          text: noteMessage,
        }),
      ]);
    }
    return AssignmentResult.empty();
  }
}
