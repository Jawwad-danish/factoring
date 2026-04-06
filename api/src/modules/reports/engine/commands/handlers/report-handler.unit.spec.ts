import { mockToken } from '@core/test';
import { TypedReadable } from '@core/util';
import { createMock } from '@golevelup/ts-jest';
import { ReportName } from '@module-persistence';
import { Test, TestingModule } from '@nestjs/testing';
import { Readable, Transform } from 'stream';
import { ReportType } from '@fs-bobtail/factoring/data';
import {
  CsvSerializer,
  ExcelSerializer,
  PdfSerializer,
  ReportSerializerOptions,
  ReportSerializerProvider,
} from '../../serialization';
import { TEMPLATE_LOADER, TemplateLoader } from '../../templates';
import { ReportHandler } from './report-handler';

const transformMock = new Transform({
  objectMode: true,
  transform(chunk, _, callback) {
    this.push(chunk);
    callback();
  },
});

describe('ReportHandler', () => {
  let reportHandler: ReportHandler;
  const serializerProvider = createMock<ReportSerializerProvider>();
  const templateLoader = createMock<TemplateLoader>();
  const csvSerializer = createMock<CsvSerializer<TestData>>();
  const excelSerializer = createMock<ExcelSerializer<TestData>>();
  const pdfSerializer = createMock<PdfSerializer<TestData>>();

  interface TestData {
    id: string;
    value: number;
  }

  const mockData: TestData[] = [
    { id: '1', value: 100 },
    { id: '2', value: 200 },
  ];

  const mockOptions: ReportSerializerOptions<TestData> = {
    formatDefinition: {
      id: { type: 'string', label: 'ID' },
      value: { type: 'currency', label: 'Value' },
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Setup mock serializers
    csvSerializer.createTransformStream.mockReturnValue(transformMock);
    excelSerializer.createTransformStream.mockReturnValue(transformMock);
    pdfSerializer.createTransformStream.mockReturnValue(transformMock);

    // Setup serializer provider
    serializerProvider.getCsvSerializer = jest
      .fn()
      .mockReturnValue(csvSerializer);
    serializerProvider.getExcelSerializer = jest
      .fn()
      .mockReturnValue(excelSerializer);
    serializerProvider.getPdfSerializer = jest
      .fn()
      .mockReturnValue(pdfSerializer);

    // Setup template loader
    templateLoader.getTemplate = jest
      .fn()
      .mockResolvedValue('<html>Template</html>');
    templateLoader.getPublicResourcesBucket = jest
      .fn()
      .mockResolvedValue('bucket-name');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportHandler,
        {
          provide: ReportSerializerProvider,
          useValue: serializerProvider,
        },
        {
          provide: TEMPLATE_LOADER,
          useValue: templateLoader,
        },
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    reportHandler = module.get<ReportHandler>(ReportHandler);
  });

  it('should be defined', () => {
    expect(reportHandler).toBeDefined();
  });

  it('should process CSV report correctly', async () => {
    const dataStream = Readable.from(mockData) as TypedReadable<TestData>;

    const result = await reportHandler.processReport(
      ReportType.CSV,
      ReportName.ApprovedAging,
      dataStream,
      mockOptions,
    );

    expect(serializerProvider.getCsvSerializer).toHaveBeenCalled();
    expect(csvSerializer.createTransformStream).toHaveBeenCalledWith(
      mockOptions,
    );
    expect(result).toBeDefined();
  });

  it('should process Excel report correctly', async () => {
    const dataStream = Readable.from(mockData) as TypedReadable<TestData>;

    const result = await reportHandler.processReport(
      ReportType.EXCEL,
      ReportName.ApprovedAging,
      dataStream,
      mockOptions,
    );

    expect(serializerProvider.getExcelSerializer).toHaveBeenCalled();
    expect(excelSerializer.createTransformStream).toHaveBeenCalledWith(
      mockOptions,
    );
    expect(result).toBeDefined();
  });

  it('should process PDF report correctly', async () => {
    const dataStream = Readable.from(mockData) as TypedReadable<TestData>;

    const result = await reportHandler.processReport(
      ReportType.PDF,
      ReportName.ApprovedAging,
      dataStream,
      mockOptions,
    );

    expect(templateLoader.getTemplate).toHaveBeenCalledWith(
      ReportName.ApprovedAging,
    );
    expect(templateLoader.getPublicResourcesBucket).toHaveBeenCalled();
    expect(serializerProvider.getPdfSerializer).toHaveBeenCalled();
    expect(pdfSerializer.createTransformStream).toHaveBeenCalledWith(
      mockOptions,
      '<html>Template</html>',
      'bucket-name',
    );
    expect(result).toBeDefined();
  });

  it('should throw error for unsupported report type', async () => {
    const dataStream = Readable.from(mockData) as TypedReadable<TestData>;

    await expect(
      reportHandler.processReport(
        'INVALID_TYPE' as ReportType,
        ReportName.ApprovedAging,
        dataStream,
        mockOptions,
      ),
    ).rejects.toThrow('Unsupported output type: INVALID_TYPE');
  });
});
