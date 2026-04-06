import { mockToken } from '@core/test';
import { createMock } from '@golevelup/ts-jest';
import {
  ProcessingNotesRepository,
  ProcessingNotesStatus,
  RecordStatus,
} from '@module-persistence';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ProcessingNotesCreateRequest,
  ProcessingNotesMapper,
} from '../../../../data';
import { CreateProcessingNotesCommand } from '../../create-processing-notes.command';
import { CreateProcessingNotesCommandHandler } from './create-processing-notes.command-handler';

describe('CreateProcessingNotesCommandHandler', () => {
  const repository = createMock<ProcessingNotesRepository>();
  let handler: CreateProcessingNotesCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateProcessingNotesCommandHandler,
        ProcessingNotesRepository,
        ProcessingNotesMapper,
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .overrideProvider(ProcessingNotesRepository)
      .useValue(repository)
      .compile();

    handler = module.get(CreateProcessingNotesCommandHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should create processing notes with client id', async () => {
      const clientId = 'client-id-123';
      const notes = 'Test processing notes';

      const request = new ProcessingNotesCreateRequest();
      request.clientId = clientId;
      request.notes = notes;

      const command = new CreateProcessingNotesCommand(request);

      const result = await handler.execute(command);

      expect(repository.persist).toHaveBeenCalledWith(result);
      expect(result.brokerId).toBeUndefined();
      expect(result.clientId).toBe(clientId);
      expect(result.notes).toBe(notes);
    });

    it('should create processing notes with broker id', async () => {
      const brokerId = 'broker-id-123';
      const notes = 'Test broker processing notes';

      const request = new ProcessingNotesCreateRequest();
      request.brokerId = brokerId;
      request.notes = notes;

      const command = new CreateProcessingNotesCommand(request);

      const result = await handler.execute(command);

      expect(result.brokerId).toBe(brokerId);
      expect(result.notes).toBe(notes);
    });

    it('should create processing notes with both client and broker id', async () => {
      const clientId = 'client-id-123';
      const brokerId = 'broker-id-123';
      const notes = 'Test processing notes with both IDs';

      const request = new ProcessingNotesCreateRequest();
      request.clientId = clientId;
      request.brokerId = brokerId;
      request.notes = notes;

      const command = new CreateProcessingNotesCommand(request);

      const result = await handler.execute(command);

      expect(result.clientId).toBe(clientId);
      expect(result.brokerId).toBe(brokerId);
      expect(result.notes).toBe(notes);
    });

    it('should archive other specific notes when creating note with both client and broker id', async () => {
      const clientId = 'client-id-123';
      const brokerId = 'broker-id-123';
      const notes = 'New specific note';

      const request = new ProcessingNotesCreateRequest();
      request.clientId = clientId;
      request.brokerId = brokerId;
      request.notes = notes;

      const command = new CreateProcessingNotesCommand(request);

      const existingNote1 = EntityStubs.buildStubProcessingNotes({
        id: 'existing-1',
        clientId,
        brokerId,
        status: ProcessingNotesStatus.Active,
      });
      const existingNote2 = EntityStubs.buildStubProcessingNotes({
        id: 'existing-2',
        clientId,
        brokerId,
        status: ProcessingNotesStatus.Active,
      });

      repository.find.mockResolvedValueOnce([existingNote1, existingNote2]);

      await handler.execute(command);

      expect(repository.find).toHaveBeenCalledWith({
        clientId,
        brokerId,
      });
      expect(existingNote1.status).toBe(ProcessingNotesStatus.Archived);
      expect(existingNote2.status).toBe(ProcessingNotesStatus.Archived);
    });

    it('should delete general notes when creating note with only client id', async () => {
      const clientId = 'client-id-123';
      const notes = 'New general note';

      const request = new ProcessingNotesCreateRequest();
      request.clientId = clientId;
      request.notes = notes;

      const command = new CreateProcessingNotesCommand(request);

      const existingGeneralNote1 = EntityStubs.buildStubProcessingNotes({
        id: 'general-1',
        clientId,
        recordStatus: RecordStatus.Active,
      });
      const existingGeneralNote2 = EntityStubs.buildStubProcessingNotes({
        id: 'general-2',
        clientId,
        recordStatus: RecordStatus.Active,
      });

      repository.find.mockResolvedValueOnce([
        existingGeneralNote1,
        existingGeneralNote2,
      ]);

      await handler.execute(command);

      expect(repository.find).toHaveBeenCalledWith({
        clientId,
        brokerId: { $eq: null },
      });
      expect(existingGeneralNote1.recordStatus).toBe(RecordStatus.Inactive);
      expect(existingGeneralNote2.recordStatus).toBe(RecordStatus.Inactive);
    });

    it('should delete general notes with brokerId null check', async () => {
      const clientId = 'client-id-123';

      const existingGeneralNote1 = EntityStubs.buildStubProcessingNotes({
        id: 'general-1',
        clientId,
        brokerId: undefined,
        recordStatus: RecordStatus.Active,
      });
      const existingGeneralNote2 = EntityStubs.buildStubProcessingNotes({
        id: 'general-2',
        clientId,
        brokerId: undefined,
        recordStatus: RecordStatus.Active,
      });

      repository.find.mockResolvedValueOnce([
        existingGeneralNote1,
        existingGeneralNote2,
      ]);

      const deleteMethod = (handler as any).deleteClientGeneralNotes.bind(
        handler,
      );
      await deleteMethod(clientId);

      expect(repository.find).toHaveBeenCalledWith({
        clientId,
        brokerId: { $eq: null },
      });
      expect(existingGeneralNote1.recordStatus).toBe(RecordStatus.Inactive);
      expect(existingGeneralNote2.recordStatus).toBe(RecordStatus.Inactive);
    });
  });
});
