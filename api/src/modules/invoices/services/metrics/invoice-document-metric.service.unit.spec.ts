import { Test, TestingModule } from '@nestjs/testing';
import { CloudWatchService } from '@module-aws';
import { InvoiceDocumentMetricService } from './invoice-document-metric.service';
import {
  InvoiceDocumentCreateMetric,
  InvoiceDocumentDeleteMetric,
} from './invoice-document-metrics';

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

describe('Invoice Document Metrics', () => {
  let invoiceDocumentMetricsService;
  let cloudWatchService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [InvoiceDocumentMetricService, CloudWatchService],
    }).compile();

    invoiceDocumentMetricsService = module.get<InvoiceDocumentMetricService>(
      InvoiceDocumentMetricService,
    );
    cloudWatchService = module.get<CloudWatchService>(CloudWatchService);
  });

  test('Create metric is sent', async () => {
    const sendMetricSpy = mockHappyPath(cloudWatchService);
    await invoiceDocumentMetricsService.sendCreateMetric();

    expect(sendMetricSpy).toHaveBeenCalledTimes(1);
    const params = sendMetricSpy.mock.calls[0];
    expect(params[0]).toBeInstanceOf(InvoiceDocumentCreateMetric);
    expect(params[1]).toBe(invoiceDocumentMetricsService.getMetricValue());
  });

  test('Delete metric is sent', async () => {
    const sendMetricSpy = mockHappyPath(cloudWatchService);
    await invoiceDocumentMetricsService.sendDeleteMetric();

    expect(sendMetricSpy).toHaveBeenCalledTimes(1);
    const params = sendMetricSpy.mock.calls[0];
    expect(params[0]).toBeInstanceOf(InvoiceDocumentDeleteMetric);
    expect(params[1]).toBe(invoiceDocumentMetricsService.getMetricValue());
  });
});
