import { ReportType } from '@fs-bobtail/factoring/data';
import { Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import {
  PassThrough,
  Transform,
  TransformCallback,
  TransformOptions,
} from 'stream';
import { formatCell } from '../cell-formatter';
import {
  ColumnFormat,
  FormatDefinition,
  ReportSerializerOptions,
} from '../serialization-options';

/**
 * Transforms standardized data into Excel format using a streaming approach.
 * Uses ExcelJS WorkbookWriter for memory-efficient Excel generation.
 */
export class ExcelTransformer<TStandardized extends object> extends Transform {
  private readonly logger = new Logger(ExcelTransformer.name);
  private workbookWriter: ExcelJS.stream.xlsx.WorkbookWriter;
  private worksheet: ExcelJS.Worksheet;
  private internalPassThrough: PassThrough;
  private formatDefinition: FormatDefinition<TStandardized>;
  private options: ReportSerializerOptions<TStandardized>;
  private rowCount = 0;

  constructor(
    options: ReportSerializerOptions<TStandardized>,
    transformOptions?: TransformOptions,
  ) {
    super({ ...transformOptions, objectMode: true });
    this.options = options;
    this.formatDefinition = options.formatDefinition;
    this.internalPassThrough = new PassThrough();

    // Forward data from internal stream to transform output
    this.internalPassThrough.on('data', (chunk) => {
      this.push(chunk);
    });

    this.internalPassThrough.on('error', (err) => {
      this.logger.error('Stream error:', err.stack);
      this.destroy(err);
    });

    this.workbookWriter = new ExcelJS.stream.xlsx.WorkbookWriter({
      stream: this.internalPassThrough,
      useStyles: true,
    });
    this.worksheet = this.workbookWriter.addWorksheet('Sheet 1');

    this.setupColumns();
    this.addMetadataAndHeader();
  }

  /**
   * Transforms a data row into Excel format.
   */
  _transform(
    chunk: TStandardized,
    _encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    try {
      const rowValues: any = {};
      Object.keys(this.formatDefinition).forEach((key) => {
        rowValues[String(key)] = formatCell(
          ReportType.EXCEL,
          chunk[key as keyof TStandardized],
          this.formatDefinition[key as keyof TStandardized]!,
        );
      });
      this.worksheet.addRow(rowValues).commit();
      this.rowCount++;
      if (this.rowCount % 10000 === 0) {
        this.logger.log(`Processed ${this.rowCount} rows`);
      }
      callback();
    } catch (error: any) {
      this.logger.error(`Row processing error:`, error.stack);
      callback(error);
    }
  }

  _flush(callback: TransformCallback): void {
    this.logger.log(`Finalizing Excel file with ${this.rowCount} rows`);

    try {
      this.worksheet.commit();

      this.workbookWriter
        .commit()
        .then(() => {
          this.logger.log('Excel generation completed');
          callback();
        })
        .catch((error) => {
          this.logger.error('Excel finalization error:', error.stack);
          callback(error);
        });
    } catch (error: any) {
      this.logger.error('Unexpected error during finalization:', error.stack);
      callback(error);
    }
  }

  private setupColumns(): void {
    try {
      const columnKeys = Object.keys(this.formatDefinition) as Array<
        keyof TStandardized
      >;
      this.worksheet.columns = columnKeys.map((key) => {
        const columnFormat = this.formatDefinition[key];
        return this.getColumnDefinition(key, columnFormat!);
      });
    } catch (error: any) {
      this.logger.error('Error during column setup:', error.stack);
      this.destroy(error);
    }
  }

  private getColumnDefinition(
    key: keyof TStandardized,
    columnFormat: ColumnFormat,
  ): Partial<ExcelJS.Column> {
    const definition: Partial<ExcelJS.Column> = {
      key: String(key),
      style: {},
    };
    let numFmt = '';
    switch (columnFormat.type) {
      case 'number': {
        const options = columnFormat.options;
        numFmt = '0';
        if (options?.minimumFractionDigits || options?.maximumFractionDigits) {
          numFmt += '.';
          for (let i = 0; i < (options.minimumFractionDigits || 0); i++)
            numFmt += '0';
        }
        break;
      }
      case 'currency': {
        numFmt = `\"$\"#,##0`;
        const minDigits = columnFormat.options?.minimumFractionDigits ?? 2;
        if (minDigits > 0) {
          numFmt += `.${'0'.repeat(minDigits)}`;
        }
        break;
      }
      case 'percentage': {
        const options = columnFormat.options;
        numFmt = '0';
        const minDigits = options?.minimumFractionDigits ?? 0;
        if (minDigits > 0) {
          numFmt += `.${'0'.repeat(minDigits)}`;
        }
        numFmt = `${numFmt}%`;
        break;
      }
      case 'date': {
        break;
      }
    }
    if (numFmt) {
      definition.style = { ...definition.style, numFmt };
    }
    return definition;
  }

  private addMetadataAndHeader(): void {
    try {
      const columnKeys = Object.keys(this.formatDefinition) as Array<
        keyof TStandardized
      >;
      const labels = columnKeys.map(
        (key) => this.formatDefinition[key]?.label || String(key),
      );

      const metaRowText = this.options.metadataRow || '';
      if (metaRowText) {
        const row = this.worksheet.addRow([metaRowText]);
        try {
          this.worksheet.mergeCells(row.number, 1, row.number, labels.length);
        } catch {
          this.logger.warn(
            `Failed to merge metadata row in Excel: ${metaRowText}`,
          );
        }
        row.commit();
      }

      const headerRow = this.worksheet.addRow(labels);
      headerRow.font = { bold: true };
      headerRow.commit();
    } catch (err: any) {
      this.logger.warn(
        `Failed to emit metadata/header rows in Excel: ${err?.message ?? err}`,
      );
    }
  }
}
