import { ChangeActions, ChangeOperation } from '@common';
import { Arrays } from '@core/util';

/**
 * @param changedActions The change actions to analyze
 * @returns A formatted string with information about removed tags
 */
export function buildResolvedTagsNote(changedActions: ChangeActions): string {
  const removedTags = changedActions.actions.filter(
    (action) => action.properties.operation === ChangeOperation.Delete,
  );
  const uniqueRemovedTags = Arrays.uniqueNotNull(removedTags, (tag) => tag.key);

  if (uniqueRemovedTags.length > 0) {
    return ` Invoice tags removed: ${uniqueRemovedTags
      .join(', ')
      .toLowerCase()
      .replace(/_/g, ' ')}.`;
  }

  return '';
}
