import { mockToken } from '@core/test';
import { createMock } from '@golevelup/ts-jest';
import {
  DuplicateDetectionEngine,
  DuplicateDetectionItem,
} from '@module-invoices';
import { InvoiceMapper } from '@module-invoices/data';
import { buildStubCreateInvoiceRequest } from '@module-invoices/test';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from '@core/uuid';
import { CheckPossibleDuplicateQueryHandler } from './check-possible-duplicate.query-handler';
import { CheckPossibleDuplicateQuery } from '../../check-possible-duplicate.query';

describe('Check possible duplicate query handler', () => {
  const mapper = createMock<InvoiceMapper>();
  const engine = createMock<DuplicateDetectionEngine>();
  let handler: CheckPossibleDuplicateQueryHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckPossibleDuplicateQueryHandler,
        InvoiceMapper,
        DuplicateDetectionEngine,
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .overrideProvider(InvoiceMapper)
      .useValue(mapper)
      .overrideProvider(DuplicateDetectionEngine)
      .useValue(engine)
      .compile();

    handler = module.get(CheckPossibleDuplicateQueryHandler);
  });

  const mockDuplicateDetectionEngineResult = (
    result: DuplicateDetectionItem[],
  ) => {
    engine.run.mockResolvedValueOnce(result);
  };

  it('Should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('Detection returns true if duplicates are found', async () => {
    mockDuplicateDetectionEngineResult([
      {
        invoice: { id: UUID.get(), loadNumber: '123' },
        totalWeight: 1,
        weights: [{ ruleName: 'abc', ruleWeight: 1 }],
      },
    ]);
    const result = await handler.execute(
      new CheckPossibleDuplicateQuery(buildStubCreateInvoiceRequest()),
    );

    expect(result.length > 0).toBeTruthy();
  });

  it('Detection returns false if duplicates are not found', async () => {
    mockDuplicateDetectionEngineResult([]);
    const result = await handler.execute(
      new CheckPossibleDuplicateQuery(buildStubCreateInvoiceRequest()),
    );

    expect(result.length === 0).toBeTruthy();
  });
});
