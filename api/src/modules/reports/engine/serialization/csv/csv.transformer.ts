import { ReportType } from '@fs-bobtail/factoring/data';
import { Logger } from '@nestjs/common';
import { Stringifier, stringify } from 'csv-stringify';
import { Transform, TransformCallback, TransformOptions } from 'stream';
import { formatCell } from '../cell-formatter';
import {
  FormatDefinition,
  ReportSerializerOptions,
} from '../serialization-options';

export class CsvTransformer<
  TStandardized extends Record<string, any>,
> extends Transform {
  private readonly logger = new Logger(CsvTransformer.name);
  private readonly stringifier: Stringifier;
  private readonly columnKeys: Array<keyof TStandardized>;
  private readonly formatDefinition: FormatDefinition<TStandardized>;
  private readonly options: ReportSerializerOptions<TStandardized>;
  private processedRowCount = 0;

  constructor(
    options: ReportSerializerOptions<TStandardized>,
    columnKeys?: Array<keyof TStandardized>,
    transformOptions?: TransformOptions,
  ) {
    super({ ...transformOptions, objectMode: true });
    this.options = options;
    this.formatDefinition = options.formatDefinition;
    this.columnKeys =
      columnKeys ||
      (Object.keys(this.formatDefinition) as Array<keyof TStandardized>);

    const header = this.columnKeys.map(
      (key) => this.formatDefinition[key]?.label || String(key),
    );

    this.stringifier = stringify({ header: true, columns: header });

    this.stringifier.on('data', (chunk) => {
      this.push(chunk);
    });
    this.stringifier.on('error', (err) => {
      this.logger.error('[CsvTransform] Stringifier error:', err.stack);
      this.destroy(err);
    });
    this.stringifier.on('finish', () => {});

    this.maybeAddMetadataRow();
  }

  private formatRow(item: TStandardized): Record<keyof TStandardized, string> {
    const formattedRow: Partial<Record<keyof TStandardized, string>> = {};
    for (const key in this.formatDefinition) {
      if (Object.prototype.hasOwnProperty.call(this.formatDefinition, key)) {
        const K = key as keyof TStandardized;
        const columnFormat = this.formatDefinition[K]!;
        const rawValue = item[K];
        formattedRow[K] = formatCell(ReportType.CSV, rawValue, columnFormat);
      }
    }
    return formattedRow as Record<keyof TStandardized, string>;
  }

  _transform(
    rowItem: TStandardized,
    _encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    try {
      const formattedRowObject = this.formatRow(rowItem);
      const rowArray = this.columnKeys.map((key) => formattedRowObject[key]);
      this.stringifier.write(rowArray);
      this.processedRowCount++;
      if (this.processedRowCount % 5000 === 0) {
        this.logger.log(
          `[CsvTransform] Processed row ${this.processedRowCount}`,
        );
      }
      callback();
    } catch (error: any) {
      this.logger.error(
        `[CsvTransform] Error transforming data row ${
          this.processedRowCount + 1
        }: ${error.message}`,
        error.stack,
      );
      callback(error);
    }
  }

  _flush(callback: TransformCallback): void {
    this.logger.log(
      `[CsvTransform] Input stream ended. Processed ${this.processedRowCount} total rows. Ending stringifier.`,
    );
    this.stringifier.end();
    callback();
  }

  private maybeAddMetadataRow(): void {
    try {
      const text = this.options.metadataRow || '';
      if (text) {
        const escaped = '"' + String(text).replace(/"/g, '""') + '"';
        this.push(escaped + '\n');
      }
    } catch (err: any) {
      this.logger.warn(
        `[CsvTransform] Failed to emit metadata row: ${err?.message ?? err}`,
      );
    }
  }
}
