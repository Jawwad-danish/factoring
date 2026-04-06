import { Injectable } from '@nestjs/common';
import { CsvSerializer } from './csv';
import { ExcelSerializer } from './excel';
import { PdfSerializer } from './pdf';

@Injectable()
export class ReportSerializerProvider {
  constructor(
    private readonly csvSerializer: CsvSerializer<any>,
    private readonly excelSerializer: ExcelSerializer<any>,
    private readonly pdfSerializer: PdfSerializer<any>,
  ) {}

  getCsvSerializer<T extends object>(): CsvSerializer<T> {
    return this.csvSerializer as CsvSerializer<T>;
  }

  getExcelSerializer<T extends object>(): ExcelSerializer<T> {
    return this.excelSerializer as ExcelSerializer<T>;
  }

  getPdfSerializer<T extends object>(): PdfSerializer<T> {
    return this.pdfSerializer as PdfSerializer<T>;
  }
}
