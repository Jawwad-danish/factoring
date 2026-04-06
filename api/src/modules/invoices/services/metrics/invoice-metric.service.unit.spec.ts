import { CloudWatchService } from '@module-aws';
import { InvoiceMetricService } from './invoice-metric.service';
import { Test, TestingModule } from '@nestjs/testing';
import {
  InvoiceCreateMetric,
  InvoiceDeleteMetric,
  InvoiceUpdateMetric,
} from './invoice-metrics';

jest.mock('../../../aws/cloudwatch/cloudwatch.service');

const mockHappyPath = (cloudWatchService: CloudWatchService) => {
  const sendMetricSpy = jest.spyOn(cloudWatchService, 'sendMetric');
  sendMetricSpy.mockResolvedValue({
    $metadata: {
      httpStatusCode: 200,
    },
  });
  return sendMetricSpy;
};

describe('Invoice Metrics', () => {
  let invoiceMetricsService;
  let cloudWatchService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [InvoiceMetricService, CloudWatchService],
    }).compile();

    invoiceMetricsService =
      module.get<InvoiceMetricService>(InvoiceMetricService);
    cloudWatchService = module.get<CloudWatchService>(CloudWatchService);
  });

  test('Create metric is sent', async () => {
    const sendMetricSpy = mockHappyPath(cloudWatchService);
    await invoiceMetricsService.sendCreateMetric();

    expect(sendMetricSpy).toHaveBeenCalledTimes(1);
    const params = sendMetricSpy.mock.calls[0];
    expect(params[0]).toBeInstanceOf(InvoiceCreateMetric);
    expect(params[1]).toBe(invoiceMetricsService.getMetricValue());
  });

  test('Update metric is sent', async () => {
    const sendMetricSpy = mockHappyPath(cloudWatchService);
    await invoiceMetricsService.sendUpdateMetric();

    expect(sendMetricSpy).toHaveBeenCalledTimes(1);
    const params = sendMetricSpy.mock.calls[0];
    expect(params[0]).toBeInstanceOf(InvoiceUpdateMetric);
    expect(params[1]).toBe(invoiceMetricsService.getMetricValue());
  });

  test('Delete metric is sent', async () => {
    const sendMetricSpy = mockHappyPath(cloudWatchService);
    await invoiceMetricsService.sendDeleteMetric();

    expect(sendMetricSpy).toHaveBeenCalledTimes(1);
    const params = sendMetricSpy.mock.calls[0];
    expect(params[0]).toBeInstanceOf(InvoiceDeleteMetric);
    expect(params[1]).toBe(invoiceMetricsService.getMetricValue());
  });
});
