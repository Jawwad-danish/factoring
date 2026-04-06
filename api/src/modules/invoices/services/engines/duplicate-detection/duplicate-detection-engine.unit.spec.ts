import { mockMikroORMProvider, mockToken } from '@core/test';
import { Test, TestingModule } from '@nestjs/testing';
import { DuplicateDetectionEngine } from './duplicate-detection-engine';
import {
  DuplicateDetectionResult,
  LoadNumberSimilarityRule,
  LoadNumberSplitRule,
  MonetarySimilarityRule,
} from './rules';
import { DocumentHashRule } from './rules';
import { EntityStubs } from '@module-persistence/test';

describe('DuplicateDetectionEngine', () => {
  let engine: DuplicateDetectionEngine;
  let loadNumberSimilarityRule: LoadNumberSimilarityRule;
  let monetarySimilarityRule: MonetarySimilarityRule;
  let documentHashRule: DocumentHashRule;
  let loadNumberSplitRule: LoadNumberSplitRule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DuplicateDetectionEngine, mockMikroORMProvider],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    engine = module.get(DuplicateDetectionEngine);
    loadNumberSimilarityRule = module.get(LoadNumberSimilarityRule);
    monetarySimilarityRule = module.get(MonetarySimilarityRule);
    documentHashRule = module.get(DocumentHashRule);
    loadNumberSplitRule = module.get(LoadNumberSplitRule);
  });

  it('Engine should be defined', () => {
    expect(engine).toBeDefined();
  });

  it.skip(`When the rules don't find any possible duplicates the engine returns 0 items`, async () => {
    jest
      .spyOn(loadNumberSimilarityRule, 'run')
      .mockResolvedValue(new DuplicateDetectionResult());
    jest
      .spyOn(monetarySimilarityRule, 'run')
      .mockResolvedValue(new DuplicateDetectionResult());
    jest
      .spyOn(documentHashRule, 'run')
      .mockResolvedValue(new DuplicateDetectionResult());
    const result = await engine.run(EntityStubs.buildStubInvoice());
    expect(result.length).toBe(0);
  });

  it(`should have no results when the rules of the engine don't find any possible duplicates`, async () => {
    jest
      .spyOn(loadNumberSplitRule, 'run')
      .mockResolvedValue(new DuplicateDetectionResult());
    const result = await engine.run(EntityStubs.buildStubInvoice());
    expect(result.length).toBe(0);
  });
});
