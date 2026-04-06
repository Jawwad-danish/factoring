import { mockToken } from '@core/test';
import { createMock } from '@golevelup/ts-jest';
import {
  ProcessingNotesEntity,
  ProcessingNotesRepository,
  ProcessingNotesStatus,
  RecordStatus,
} from '@module-persistence';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import { ProcessingNotesDeleteRequest } from '../../../../data';
import { DeleteProcessingNotesCommand } from '../../delete-processing-notes.command';
import { DeleteProcessingNotesCommandHandler } from './delete-processing-notes.command-handler';

describe('DeleteProcessingNotesCommandHandler', () => {
  const repository = createMock<ProcessingNotesRepository>();
  let handler: DeleteProcessingNotesCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteProcessingNotesCommandHandler,
        ProcessingNotesRepository,
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .overrideProvider(ProcessingNotesRepository)
      .useValue(repository)
      .compile();

    handler = module.get(DeleteProcessingNotesCommandHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    const entityId = 'test-id';
    let existingEntity: ProcessingNotesEntity;

    it('should fetch entity by id and set record status to inactive', async () => {
      const request = new ProcessingNotesDeleteRequest();
      const command = new DeleteProcessingNotesCommand(entityId, request);

      existingEntity = EntityStubs.buildStubProcessingNotes({
        id: entityId,
        clientId: 'client-id',
        brokerId: 'broker-id',
        notes: 'test notes',
        status: ProcessingNotesStatus.Active,
        recordStatus: RecordStatus.Active,
      });
      repository.getOneById.mockResolvedValueOnce(existingEntity);

      const result = await handler.execute(command);

      expect(repository.getOneById).toHaveBeenCalledWith(entityId);
      expect(repository.getOneById).toHaveBeenCalledTimes(1);
      expect(result.recordStatus).toBe(RecordStatus.Inactive);
    });
  });
});
