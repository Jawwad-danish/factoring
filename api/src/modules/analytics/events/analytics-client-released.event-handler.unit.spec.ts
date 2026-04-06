import { mockMikroORMProvider, mockToken } from '@core/test';

import { buildStubClient } from '@module-clients/test';
import { ClientStatusReason } from '@module-persistence';
import { Test, TestingModule } from '@nestjs/testing';
import { SegmentService } from '../services';
import { AnalyticsClientReleasedEventHandler } from './analytics-client-released.event-handler';

describe('Analytics - client released event handler', () => {
  let handler: AnalyticsClientReleasedEventHandler;
  let segmentService: SegmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalyticsClientReleasedEventHandler, mockMikroORMProvider],
    })
      .useMocker((token) => {
        return mockToken(token);
      })

      .compile();

    handler = module.get(AnalyticsClientReleasedEventHandler);
    segmentService = module.get(SegmentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('Call segment service on event handle', async () => {
    const date = new Date();
    const client = buildStubClient();

    await handler.handle({
      client,
      releaseReason: ClientStatusReason.Fraud,
      releaseDate: date,
    });

    expect(segmentService.identify).toHaveBeenCalledWith(
      client.mc,
      expect.objectContaining({
        email: client.email,
        id: client.id,
        dot: client.dot,
      }),
    );
    expect(segmentService.track).toHaveBeenCalledWith(
      client.mc,
      'client-released',
      expect.objectContaining({
        email: client.email,
        id: client.id,
        dot: client.dot,
        releaseDate: date.toISOString(),
        releaseReason: ClientStatusReason.Fraud,
      }),
    );
  });
});
