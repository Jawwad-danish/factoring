import {
  TagDataGenerator,
  TagDefinitionData,
  TagDefinitionEntityData,
  TagDefinitionGroupData,
  TagDefinitionGroupEntityData,
  TagGroupAssociationEntityData,
} from '../data/tag-data-generator';

/**
 * @deprecated Used only in old migrations
 */
export class TagGroupBuilder {
  private dataGenerator = new TagDataGenerator();
  constructor(
    readonly groupData: TagDefinitionGroupData,
    readonly tagData: TagDefinitionData[],
  ) {
    this;
  }

  build(): {
    group: TagDefinitionGroupEntityData;
    tags: TagDefinitionEntityData[];
    associations: TagGroupAssociationEntityData[];
  } {
    const group = this.dataGenerator.buildGroup(this.groupData);
    const tags = this.tagData.map((data) => this.dataGenerator.buildTag(data));
    const associations = tags.map((tag) =>
      this.dataGenerator.buildAssociation(group.id, tag.id),
    );
    return {
      group,
      tags,
      associations,
    };
  }
}
