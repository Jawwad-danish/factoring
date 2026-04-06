import { BasicEntity, BasicRepository } from '@module-persistence';

export class ParityItemProvider<E extends BasicEntity> {
  async getV1Item(rawV1Item: any, v1Items: E[]): Promise<E | null> {
    return v1Items.find((item) => item.id === rawV1Item.id) || null;
  }

  async getV2Item(v1Item: E, _rawV1Item: any, v2Items: E[]): Promise<E | null> {
    return v2Items.find((item) => item.id === v1Item.id) || null;
  }

  async retrieveV2Entities(
    repository: BasicRepository<E>,
    v1Items: E[],
  ): Promise<E[]> {
    return repository.findByIds(v1Items.map((item) => item.id));
  }
}
