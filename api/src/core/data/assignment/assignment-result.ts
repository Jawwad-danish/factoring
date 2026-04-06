import { JSONObject } from '../../types';
import { Note } from '../note';

const mergeObjects = (values: JSONObject[]): JSONObject => {
  const result = {};
  values.forEach((e) => {
    Object.assign(result, e);
  });
  return result;
};

export class AssignmentResult {
  constructor(readonly items: Note[]) {}

  hasChanges(): boolean {
    return this.items.some((item) => item.isEmpty());
  }

  /**
   * This method does not change the existing change set,
   * but instead returns a new result with a new change set.
   */
  concat(assignmentResult: AssignmentResult): AssignmentResult {
    if (!assignmentResult.hasChanges()) {
      return this;
    }

    return new AssignmentResult([...this.items, ...assignmentResult.items]);
  }

  getPayload(): JSONObject {
    return mergeObjects(this.items.map((item) => item.payload));
  }

  getNote(): string {
    return this.items
      .filter((item) => item.hasText())
      .map((item) => item.getText())
      .join('. ');
  }

  static merge(results: AssignmentResult[]): AssignmentResult {
    const notesPayloads: Note[] = [];
    results.forEach((result) => notesPayloads.push(...result.items));
    return new AssignmentResult(notesPayloads);
  }

  static empty(): AssignmentResult {
    return new AssignmentResult([]);
  }
}
