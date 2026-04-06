import { mockToken } from '@core/test';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { Analytics } from '@segment/analytics-node';
import { SegmentService } from './segment.service';

describe('Segment service tests', () => {
  let service: SegmentService;
  let analyticsMock: DeepMocked<Analytics>;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SegmentService,
        {
          provide: Analytics,
          useValue: createMock<Analytics>(),
        },
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();
    module.useLogger(false);

    analyticsMock = module.get(Analytics);
    service = module.get<SegmentService>(SegmentService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('Segment instance is created', () => {
    expect(service).toBeDefined();
  });

  it('identify - should tie a user to their action', async () => {
    const analyticsSpy = jest.spyOn(analyticsMock, 'identify').mockReturnThis();

    service.identify('test@bobtail.com', {
      name: 'onboarding',
      email: 'test@bobtail.com',
      dot: '1234',
    });

    expect(analyticsSpy).toHaveBeenCalledTimes(1);
    expect(analyticsSpy).toHaveBeenCalledWith({
      traits: { name: 'onboarding', dot: '1234', email: 'test@bobtail.com' },
      userId: 'test@bobtail.com',
    });
  });

  it('track - should track the important events of a user', async () => {
    const analyticsSpy = jest.spyOn(analyticsMock, 'track').mockReturnThis();

    service.track('test@bobtail.com', 'Kyb approved', {
      kybOutcome: 'approved',
      kybStatus: 'completed',
    });

    expect(analyticsSpy).toHaveBeenCalledTimes(1);
    expect(analyticsSpy).toHaveBeenCalledWith({
      event: 'Kyb approved',
      properties: {
        kybOutcome: 'approved',
        kybStatus: 'completed',
      },
      userId: 'test@bobtail.com',
    });
  });
});
