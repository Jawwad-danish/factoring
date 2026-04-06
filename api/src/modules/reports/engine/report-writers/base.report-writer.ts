import { getCurrentUTCDate } from '@core/date-time';
import {
  BaseReportCreateRequest,
  CSVOutputType,
  ExcelOutputType,
  PDFOutputType,
  ReportOutputType,
  ReportType,
} from '@fs-bobtail/factoring/data';
import { Logger } from '@nestjs/common';
import { Readable } from 'stream';

export interface ReportWriteResult {
  storageUrl: string;
}

export abstract class ReportWriter {
  protected readonly logger: Logger = new Logger(this.constructor.name);

  generateFileName(reportName: string, outputType: ReportOutputType): string {
    return `${reportName}-${getCurrentUTCDate().format(
      'YYYY-MM-DDTHHmmssZ[Z]',
    )}${outputType.getFileExtension()}`;
  }

  protected getOutputType(
    reportRequest: BaseReportCreateRequest<any>,
  ): ReportOutputType {
    switch (reportRequest.outputType) {
      case ReportType.CSV:
        return CSVOutputType;
      case ReportType.PDF:
        return PDFOutputType;
      case ReportType.EXCEL:
        return ExcelOutputType;
      default:
        throw new Error(`Unsupported output type: ${reportRequest.outputType}`);
    }
  }

  abstract write(
    reportStream: Readable,
    reportRequest: BaseReportCreateRequest<any>,
  ): Promise<ReportWriteResult>;
}
