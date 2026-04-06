import { DatabaseService } from '@module-database';
import { Inject, Injectable } from '@nestjs/common';
import { FactoringCompanyEntity } from '../entities/factoring-company.entity';
import { BasicRepository } from './basic-repository';

@Injectable()
export class FactoringCompanyRepository extends BasicRepository<FactoringCompanyEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, FactoringCompanyEntity);
  }

  async findOneByName(name: string): Promise<FactoringCompanyEntity | null> {
    return this.repository.findOne({
      name: name,
    });
  }
}
