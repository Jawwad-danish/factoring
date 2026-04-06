import { mockToken } from '@core/test';
import { createMock } from '@golevelup/ts-jest';
import {
  ProcessingNotesRepository,
  ProcessingNotesStatus,
} from '@module-persistence';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import { ProcessingNotesUpdateRequest } from '../../../../data';
import { UpdateProcessingNotesCommand } from '../../update-processing-notes.command';
import { UpdateProcessingNotesCommandHandler } from './update-processing-notes.command-handler';

describe('UpdateProcessingNotesCommandHandler', () => {
  const repository = createMock<ProcessingNotesRepository>();
  let handler: UpdateProcessingNotesCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateProcessingNotesCommandHandler,
        ProcessingNotesRepository,
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .overrideProvider(ProcessingNotesRepository)
      .useValue(repository)
      .compile();

    handler = module.get(UpdateProcessingNotesCommandHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should update fields', async () => {
      const newBrokerId = 'new-broker-id';
      const newClientId = 'new-client-id';
      const newNotes = 'updated notes';
      const newStatus = ProcessingNotesStatus.Archived;

      const request = new ProcessingNotesUpdateRequest();
      request.brokerId = newBrokerId;
      request.clientId = newClientId;
      request.notes = newNotes;
      request.status = newStatus;

      const existingEntity = EntityStubs.buildStubProcessingNotes();
      repository.getOneById.mockResolvedValueOnce(existingEntity);

      const command = new UpdateProcessingNotesCommand(
        existingEntity.id,
        request,
      );

      const result = await handler.execute(command);

      expect(result.brokerId).toBe(newBrokerId);
      expect(result.clientId).toBe(newClientId);
      expect(result.notes).toBe(newNotes);
      expect(result.status).toBe(newStatus);
    });

    it('should not update fields when not provided', async () => {
      const request = new ProcessingNotesUpdateRequest();

      const existingEntity = EntityStubs.buildStubProcessingNotes({
        brokerId: 'original-broker-id',
        clientId: 'original-client-id',
        notes: 'original notes',
        status: ProcessingNotesStatus.Active,
      });
      repository.getOneById.mockResolvedValueOnce(existingEntity);

      const command = new UpdateProcessingNotesCommand(
        existingEntity.id,
        request,
      );

      const result = await handler.execute(command);

      expect(result.brokerId).toBe('original-broker-id');
      expect(result.clientId).toBe('original-client-id');
      expect(result.notes).toBe('original notes');
      expect(result.status).toBe(ProcessingNotesStatus.Active);
    });

    it('should archive other specific notes when status is changed to Active for specific note', async () => {
      const clientId = 'client-id-123';
      const brokerId = 'broker-id-123';

      const existingEntity = EntityStubs.buildStubProcessingNotes({
        id: 'test-id',
        clientId,
        brokerId,
        status: ProcessingNotesStatus.Archived,
      });
      repository.getOneById.mockResolvedValueOnce(existingEntity);

      const request = new ProcessingNotesUpdateRequest();
      request.status = ProcessingNotesStatus.Active;
      const command = new UpdateProcessingNotesCommand(
        existingEntity.id,
        request,
      );

      const otherNote1 = EntityStubs.buildStubProcessingNotes({
        id: 'other-1',
        clientId,
        brokerId,
        status: ProcessingNotesStatus.Active,
      });
      const otherNote2 = EntityStubs.buildStubProcessingNotes({
        id: 'other-2',
        clientId,
        brokerId,
        status: ProcessingNotesStatus.Active,
      });

      repository.find.mockResolvedValueOnce([otherNote1, otherNote2]);

      const result = await handler.execute(command);

      expect(result.status).toBe(ProcessingNotesStatus.Active);
      expect(repository.find).toHaveBeenCalledWith({
        clientId,
        brokerId,
      });
      expect(otherNote1.status).toBe(ProcessingNotesStatus.Archived);
      expect(otherNote2.status).toBe(ProcessingNotesStatus.Archived);
    });
  });
});
