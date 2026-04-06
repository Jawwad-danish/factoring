import { BrokerEvents, BrokerRatingChangedEvent } from '@common/events';
import { mockMikroORMProvider, mockToken } from '@core/test';
import { buildStubBroker } from '@module-brokers/test';
import { CommandRunner, EventPublisher } from '@module-cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { BrokerApi } from '../api';
import { Rating, UpdateBrokerRequest } from '../data';
import { BrokerRating } from '../lib/types';
import { BrokerService } from './broker.service';

describe('BrokerService', () => {
  let brokerApi: BrokerApi;
  let commandRunner: CommandRunner;
  let eventPublisher: EventPublisher;
  let service: BrokerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [mockMikroORMProvider, BrokerService],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    brokerApi = module.get(BrokerApi);
    commandRunner = module.get(CommandRunner);
    eventPublisher = module.get(EventPublisher);
    service = module.get(BrokerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateBroker', () => {
    it('updates broker and calls command runner', async () => {
      const runSpy = jest.spyOn(commandRunner, 'run');

      await service.updateBroker('broker-id', new UpdateBrokerRequest());

      expect(runSpy).toHaveBeenCalledTimes(1);
    });

    describe('broker rating change notifications', () => {
      const brokerId = 'broker-123';
      const brokerName = 'Test Broker LLC';

      beforeEach(() => {
        jest.spyOn(brokerApi, 'findById').mockResolvedValue(
          buildStubBroker({
            id: brokerId,
            legalName: brokerName,
            rating: BrokerRating.A,
          }),
        );
      });

      it('emits BrokerRatingChangedEvent when rating changes to F', async () => {
        const eventPublisherSpy = jest.spyOn(eventPublisher, 'emit');
        const request = new UpdateBrokerRequest();
        request.rating = Rating.F;

        await service.updateBroker(brokerId, request);

        expect(eventPublisherSpy).toHaveBeenCalledWith(
          BrokerEvents.RatingChanged,
          expect.any(BrokerRatingChangedEvent),
        );
        expect(eventPublisherSpy).toHaveBeenCalledWith(
          BrokerEvents.RatingChanged,
          expect.objectContaining({
            brokerId,
            brokerName,
            newRating: Rating.F,
          }),
        );
      });

      it('emits BrokerRatingChangedEvent when rating changes to X', async () => {
        const eventPublisherSpy = jest.spyOn(eventPublisher, 'emit');
        const request = new UpdateBrokerRequest();
        request.rating = Rating.X;

        await service.updateBroker(brokerId, request);

        expect(eventPublisherSpy).toHaveBeenCalledWith(
          BrokerEvents.RatingChanged,
          expect.objectContaining({
            brokerId,
            brokerName,
            newRating: Rating.X,
          }),
        );
      });

      it('does not emit event when rating changes to non-restricted rating', async () => {
        const eventPublisherSpy = jest.spyOn(eventPublisher, 'emit');
        const request = new UpdateBrokerRequest();
        request.rating = Rating.B;

        await service.updateBroker(brokerId, request);

        expect(eventPublisherSpy).not.toHaveBeenCalled();
      });

      it('does not emit event when rating is not provided in request', async () => {
        const eventPublisherSpy = jest.spyOn(eventPublisher, 'emit');
        const request = new UpdateBrokerRequest();

        await service.updateBroker(brokerId, request);

        expect(eventPublisherSpy).not.toHaveBeenCalled();
      });

      it('does not emit event when rating is unchanged', async () => {
        jest.spyOn(brokerApi, 'findById').mockResolvedValue(
          buildStubBroker({
            id: brokerId,
            legalName: brokerName,
            rating: BrokerRating.F,
          }),
        );
        const eventPublisherSpy = jest.spyOn(eventPublisher, 'emit');
        const request = new UpdateBrokerRequest();
        request.rating = Rating.F;

        await service.updateBroker(brokerId, request);

        expect(eventPublisherSpy).not.toHaveBeenCalled();
      });

      it('does not emit event when rating changes from F to X', async () => {
        jest.spyOn(brokerApi, 'findById').mockResolvedValue(
          buildStubBroker({
            id: brokerId,
            legalName: brokerName,
            rating: BrokerRating.F,
          }),
        );
        const eventPublisherSpy = jest.spyOn(eventPublisher, 'emit');
        const request = new UpdateBrokerRequest();
        request.rating = Rating.X;

        await service.updateBroker(brokerId, request);

        expect(eventPublisherSpy).not.toHaveBeenCalled();
      });

      it('does not emit event when rating changes from X to F', async () => {
        jest.spyOn(brokerApi, 'findById').mockResolvedValue(
          buildStubBroker({
            id: brokerId,
            legalName: brokerName,
            rating: 'X' as BrokerRating,
          }),
        );
        const eventPublisherSpy = jest.spyOn(eventPublisher, 'emit');
        const request = new UpdateBrokerRequest();
        request.rating = Rating.F;

        await service.updateBroker(brokerId, request);

        expect(eventPublisherSpy).not.toHaveBeenCalled();
      });
    });
  });
});
