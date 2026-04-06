import { Note } from '@core/data';
import { PartialPick } from '@core/types';
import { TagDefinitionKey } from '@module-persistence/entities';

export enum ChangeOperation {
  Assign = 'assign',
  Delete = 'delete',
}

export enum ChangeSubject {
  Activity = 'activity',
  Tag = 'tag',
  TagActivity = 'tag-activity',
}

export enum ChangeActor {
  System = 'system',
  User = 'user',
}

interface ChangeProperties {
  readonly operation: ChangeOperation;
  readonly subject: ChangeSubject;
  readonly actor: ChangeActor;
  readonly optional: boolean;
  readonly trackDeletion: boolean;
}

export class ChangeAction {
  readonly key: null | TagDefinitionKey;
  readonly activityId: null | string;
  readonly noteDetails: null | Note;
  readonly properties: ChangeProperties;

  constructor(readonly input: PartialPick<ChangeAction, 'properties'>) {
    this.key = input.key ?? null;
    this.activityId = input.activityId ?? null;
    this.noteDetails = input.noteDetails ?? null;
    this.properties = input.properties;
  }

  isDelete(): boolean {
    return this.properties.operation === ChangeOperation.Delete;
  }

  isAssign(): boolean {
    return this.properties.operation === ChangeOperation.Assign;
  }
}

interface FactoryConfiguration {
  readonly actor?: ChangeActor;
  readonly optional?: boolean;
  readonly trackDeletion?: boolean;
}

export class ChangeActions {
  readonly actions: ChangeAction[] = [];

  isEmpty(): boolean {
    return this.actions.length === 0;
  }

  concat(changeActions: ChangeActions): ChangeActions {
    if (!changeActions.isEmpty()) {
      this.actions.push(...changeActions.actions);
    }
    return this;
  }

  static empty(): ChangeActions {
    return new ChangeActions();
  }

  static addActivity(
    key: TagDefinitionKey,
    noteDetails: Note,
    configuration?: FactoryConfiguration,
  ): ChangeActions {
    const collection = new ChangeActions();
    collection.actions.push(
      new ChangeAction({
        key,
        noteDetails,
        properties: buildChangeProperties(
          ChangeOperation.Assign,
          ChangeSubject.Activity,
          configuration,
        ),
      }),
    );
    return collection;
  }

  static addTag(
    key: TagDefinitionKey,
    configuration?: FactoryConfiguration,
  ): ChangeActions {
    const collection = new ChangeActions();
    collection.actions.push(
      new ChangeAction({
        key,
        properties: buildChangeProperties(
          ChangeOperation.Assign,
          ChangeSubject.Tag,
          configuration,
        ),
      }),
    );
    return collection;
  }

  static addTagAndActivity(
    key: TagDefinitionKey,
    noteDetails: Note,
    configuration?: FactoryConfiguration & { activityId?: string },
  ): ChangeActions {
    const collection = new ChangeActions();
    collection.actions.push(
      new ChangeAction({
        key,
        activityId: configuration?.activityId,
        noteDetails,
        properties: buildChangeProperties(
          ChangeOperation.Assign,
          ChangeSubject.TagActivity,
          configuration,
        ),
      }),
    );
    return collection;
  }

  static deleteTag(
    key: TagDefinitionKey,
    configuration?: FactoryConfiguration,
  ): ChangeActions {
    const collection = new ChangeActions();
    collection.actions.push(
      new ChangeAction({
        key,
        properties: buildChangeProperties(
          ChangeOperation.Delete,
          ChangeSubject.Tag,
          configuration,
        ),
      }),
    );
    return collection;
  }

  static deleteTagActivity(
    activityId: string,
    note: null | Note,
    configuration?: FactoryConfiguration,
  ): ChangeActions {
    const collection = new ChangeActions();
    collection.actions.push(
      new ChangeAction({
        activityId,
        noteDetails: note,
        properties: buildChangeProperties(
          ChangeOperation.Delete,
          ChangeSubject.TagActivity,
          configuration,
        ),
      }),
    );
    return collection;
  }
}

const buildChangeProperties = (
  operation: ChangeOperation,
  subject: ChangeSubject,
  configuration?: FactoryConfiguration,
): ChangeProperties => {
  return {
    operation,
    subject,
    actor: configuration?.actor || ChangeActor.System,
    optional: configuration?.optional || false,
    trackDeletion: configuration?.trackDeletion ?? false,
  };
};
