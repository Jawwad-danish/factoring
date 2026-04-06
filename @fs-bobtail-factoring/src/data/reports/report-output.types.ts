import { Readable } from 'stream';

export interface ReportOutput {
  stream: Readable;
  type: ReportOutputType;
}

export interface ReportOutputType {
  getFileExtension(): string;
  getMimeType(): string;
}

export const CSVOutputType: ReportOutputType = {
  getFileExtension(): string {
    return '.csv';
  },
  getMimeType(): string {
    return 'text/csv';
  },
};

export const ExcelOutputType: ReportOutputType = {
  getFileExtension(): string {
    return '.xlsx';
  },
  getMimeType(): string {
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  },
};

export const PDFOutputType: ReportOutputType = {
  getFileExtension(): string {
    return '.pdf';
  },
  getMimeType(): string {
    return 'application/pdf';
  },
};
