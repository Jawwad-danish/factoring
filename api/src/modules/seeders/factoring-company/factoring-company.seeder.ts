import { FactoringCompanyEntity } from '@module-persistence/entities';
import { FactoringCompanyRepository } from '@module-persistence/repositories';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class FactoringCompanySeeder {
  private logger: Logger = new Logger(FactoringCompanySeeder.name);

  constructor(private readonly repository: FactoringCompanyRepository) {}

  async create(
    data: Partial<FactoringCompanyEntity>,
  ): Promise<FactoringCompanyEntity> {
    const entity = await this.build(data);
    try {
      await this.repository.upsertAndFlush(entity);
    } catch (error) {
      this.logger.error(`Could not save factoring company ${entity.id}`, error);
    }
    return entity;
  }

  private async build(
    data: Partial<FactoringCompanyEntity>,
  ): Promise<FactoringCompanyEntity> {
    const entity = new FactoringCompanyEntity();
    entity.name = data.name ?? 'Factoring company seed';
    Object.assign(entity, data);
    return entity;
  }
}
