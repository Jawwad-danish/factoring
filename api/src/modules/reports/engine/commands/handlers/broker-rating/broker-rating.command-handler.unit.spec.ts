import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Readable } from 'stream';
import { ReportType } from '@fs-bobtail/factoring/data';
import { ReportHandler } from '../report-handler';
import { mockMikroORMProvider, mockToken } from '@core/test';
import { PassThrough } from 'stream';
import { BrokerRatingReportCommandHandler } from './broker-rating.command-handler';
import { BrokerRatingReportCommand } from '../../broker-rating-report.command';
import { BrokerApi, BrokerRating } from '@module-brokers';
import {
  BrokerFactoringConfigRepository,
  ReportName,
  EntityStubs,
} from '@module-persistence';
import { buildStubBroker } from '@module-brokers/test';
import Big from 'big.js';

const transformMock = new PassThrough();

describe('BrokerRatingReportCommandHandler', () => {
  let handler: BrokerRatingReportCommandHandler;
  const reportHandler = createMock<ReportHandler>();
  const brokerApi = createMock<BrokerApi>();
  const brokerFactoringConfigRepository =
    createMock<BrokerFactoringConfigRepository>();

  beforeEach(async () => {
    jest.clearAllMocks();

    reportHandler.processReport.mockResolvedValue(transformMock);
    const stubConfig = EntityStubs.buildBrokerFactoringConfigStub({
      brokerId: 'broker-1',
      limitAmount: new Big(500000),
    });
    brokerFactoringConfigRepository.findAll.mockResolvedValue([
      [stubConfig],
      1,
    ]);

    const stubBroker = buildStubBroker({
      id: 'broker-1',
      legalName: 'Test Broker LLC',
      mc: '123456',
      dot: '7890',
      rating: BrokerRating.A,
      externalRating: BrokerRating.B,
    });

    brokerApi.findByIds.mockResolvedValue([stubBroker]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrokerRatingReportCommandHandler,
        mockMikroORMProvider,
        {
          provide: ReportHandler,
          useValue: reportHandler,
        },
        {
          provide: BrokerApi,
          useValue: brokerApi,
        },
        {
          provide: BrokerFactoringConfigRepository,
          useValue: brokerFactoringConfigRepository,
        },
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    handler = module.get<BrokerRatingReportCommandHandler>(
      BrokerRatingReportCommandHandler,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should execute broker rating report command', async () => {
    const processReportSpy = reportHandler.processReport.mockResolvedValueOnce(
      Readable.from([]),
    );
    const command = new BrokerRatingReportCommand({
      name: ReportName.BrokerRating,
      outputType: ReportType.CSV,
      sendTo: 'test@example.com',
    });

    await handler.execute(command);

    expect(processReportSpy).toHaveBeenCalledTimes(1);
    expect(processReportSpy).toHaveBeenCalledWith(
      ReportType.CSV,
      ReportName.BrokerRating,
      expect.any(Readable),
      expect.objectContaining({
        formatDefinition: expect.any(Object),
        metadataRow: expect.any(String),
      }),
    );
  });

  it('should fetch broker factoring configs', async () => {
    const findAllSpy = jest.spyOn(brokerFactoringConfigRepository, 'findAll');
    const command = new BrokerRatingReportCommand({
      name: ReportName.BrokerRating,
      outputType: ReportType.CSV,
      sendTo: 'test@example.com',
    });

    await handler.execute(command);

    expect(findAllSpy).toHaveBeenCalledTimes(1);
  });

  it('should fetch brokers by ids from broker api', async () => {
    const findByIdsSpy = jest.spyOn(brokerApi, 'findByIds');
    const command = new BrokerRatingReportCommand({
      name: ReportName.BrokerRating,
      outputType: ReportType.CSV,
      sendTo: 'test@example.com',
    });

    await handler.execute(command);

    expect(findByIdsSpy).toHaveBeenCalledTimes(1);
    expect(findByIdsSpy).toHaveBeenCalledWith(['broker-1']);
  });

  it('should return empty stream when no broker configs exist', async () => {
    brokerFactoringConfigRepository.findAll.mockResolvedValueOnce([[], 0]);
    const findByIdsSpy = jest.spyOn(brokerApi, 'findByIds');
    const command = new BrokerRatingReportCommand({
      name: ReportName.BrokerRating,
      outputType: ReportType.CSV,
      sendTo: 'test@example.com',
    });

    await handler.execute(command);

    expect(findByIdsSpy).not.toHaveBeenCalled();
    expect(reportHandler.processReport).toHaveBeenCalledWith(
      ReportType.CSV,
      ReportName.BrokerRating,
      expect.any(Readable),
      expect.any(Object),
    );
  });

  it('should provide the correct format definition to report handler', async () => {
    const command = new BrokerRatingReportCommand({
      name: ReportName.BrokerRating,
      outputType: ReportType.CSV,
      sendTo: 'test@example.com',
    });

    await handler.execute(command);

    expect(reportHandler.processReport).toHaveBeenCalledWith(
      ReportType.CSV,
      ReportName.BrokerRating,
      expect.any(Readable),
      expect.objectContaining({
        formatDefinition: expect.objectContaining({
          brokerName: expect.objectContaining({
            type: 'string',
            label: 'Broker',
          }),
          brokerMC: expect.objectContaining({ type: 'string', label: 'MC' }),
          brokerDOT: expect.objectContaining({ type: 'string', label: 'DOT' }),
          brokerStatus: expect.objectContaining({
            type: 'string',
            label: 'Status',
          }),
          brokerLimit: expect.objectContaining({
            type: 'currency',
            label: 'Broker Limit',
          }),
          rating: expect.objectContaining({ type: 'string', label: 'Rating' }),
          externalRating: expect.objectContaining({
            type: 'string',
            label: 'External Rating',
          }),
          displayRating: expect.objectContaining({
            type: 'string',
            label: 'Display Rating',
          }),
        }),
      }),
    );
  });

  it('should include metadata row with report date', async () => {
    const command = new BrokerRatingReportCommand({
      name: ReportName.BrokerRating,
      outputType: ReportType.CSV,
      sendTo: 'test@example.com',
    });

    await handler.execute(command);

    expect(reportHandler.processReport).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        metadataRow: expect.stringContaining('Broker Rating Report'),
      }),
    );
  });

  it('should map broker limit from config to report row', async () => {
    const config1 = EntityStubs.buildBrokerFactoringConfigStub({
      brokerId: 'broker-1',
      limitAmount: new Big(750000),
    });
    const config2 = EntityStubs.buildBrokerFactoringConfigStub({
      brokerId: 'broker-2',
      limitAmount: null,
    });
    brokerFactoringConfigRepository.findAll.mockResolvedValueOnce([
      [config1, config2],
      2,
    ]);

    const broker1 = buildStubBroker({
      id: 'broker-1',
      legalName: 'Broker One',
    });
    const broker2 = buildStubBroker({
      id: 'broker-2',
      legalName: 'Broker Two',
    });

    brokerApi.findByIds.mockResolvedValueOnce([broker1, broker2]);

    const command = new BrokerRatingReportCommand({
      name: ReportName.BrokerRating,
      outputType: ReportType.CSV,
      sendTo: 'test@example.com',
    });

    await handler.execute(command);

    expect(brokerApi.findByIds).toHaveBeenCalledWith(['broker-1', 'broker-2']);
    expect(reportHandler.processReport).toHaveBeenCalledTimes(1);
  });
});
