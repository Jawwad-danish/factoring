import {
  TagDataGeneratorV2,
  TagDefinitionData,
  TagDefinitionEntityData,
  TagDefinitionGroupData,
  TagDefinitionGroupEntityData,
  TagGroupAssociationEntityData,
} from '../data/tag-data-generator-v2';

export class TagGroupBuilderV2 {
  private dataGenerator = new TagDataGeneratorV2();
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
