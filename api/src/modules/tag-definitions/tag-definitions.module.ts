import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database';
import { TagDefinitionController } from './controllers';
import { TagDefinitionMapper } from './data';
import { TagDefinitionService } from './services';
import { PersistenceModule } from '@module-persistence';
import { CommonModule } from '@module-common';

@Module({
  providers: [TagDefinitionMapper, TagDefinitionService],
  exports: [TagDefinitionService, TagDefinitionMapper],
  imports: [DatabaseModule, PersistenceModule, CommonModule],
  controllers: [TagDefinitionController],
})
export class TagDefinitionsModule {}
