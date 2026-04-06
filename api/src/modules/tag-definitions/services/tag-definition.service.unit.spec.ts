import { mockToken } from '@core/test';
import { Test, TestingModule } from '@nestjs/testing';
import { TagDefinitionService } from './tag-definition.service';

describe('TagDefinitionService', () => {
  let tagDefinitionService: TagDefinitionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TagDefinitionService],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    tagDefinitionService =
      module.get<TagDefinitionService>(TagDefinitionService);
  }, 60000);

  it('Should be defined', () => {
    expect(tagDefinitionService).toBeDefined();
  });
});
