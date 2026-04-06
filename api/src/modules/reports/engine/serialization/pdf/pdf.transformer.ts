import { getDateInBusinessTimezone } from '@core/date-time';
import { dayMonthYear } from '@core/formatting';
import { ReportType } from '@fs-bobtail/factoring/data';
import { Logger } from '@nestjs/common';
import handlebars from 'handlebars';
import puppeteer, { PDFOptions } from 'puppeteer';
import {
  PassThrough,
  Transform,
  TransformCallback,
  TransformOptions,
} from 'stream';
import { formatCell } from '../cell-formatter';
import { ReportSerializerOptions } from '../serialization-options';

export class PdfTransformer<TStandardized> extends Transform {
  private readonly logger = new Logger(PdfTransformer.name);
  private items: TStandardized[] = [];

  constructor(
    private readonly serializerOptions: ReportSerializerOptions<TStandardized>,
    private readonly templateHtml: string,
    private readonly publicResourcesBucket: string,
    options?: TransformOptions,
  ) {
    super({ ...options, readableObjectMode: false, writableObjectMode: true });
  }

  _transform(
    chunk: TStandardized,
    _encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    this.items.push(chunk);
    callback();
  }

  _flush(callback: TransformCallback): void {
    this.logger.log(`Generating PDF with ${this.items.length} records`);

    (async () => {
      try {
        this.logger.debug('Starting PDF generation process');
        const compiledHtml = this.prepareHtml();
        this.logger.debug('HTML template compiled successfully');

        const pdfBuffer = await this.generatePdfToBuffer(compiledHtml);
        this.logger.debug(
          `PDF buffer generated, size: ${pdfBuffer.length}. Streaming it out.`,
        );

        const bufferStream = new PassThrough();

        bufferStream.on('data', (chunk) => {
          if (!this.push(chunk)) {
            bufferStream.pause();
          }
        });

        this.on('drain', () => {
          if (bufferStream.isPaused()) {
            bufferStream.resume();
          }
        });

        bufferStream.on('end', () => {
          this.push(null);
          callback();
        });

        bufferStream.on('error', (err: Error) => {
          callback(err);
        });

        bufferStream.end(pdfBuffer);
      } catch (error) {
        this.logger.error('PDF generation error:', error.stack);
        callback(error instanceof Error ? error : new Error(String(error)));
      }
    })();
  }

  _destroy(err: Error | null, callback: (error: Error | null) => void): void {
    this.logger.debug('Destroying PDF transformer');
    super._destroy(err, callback);
  }

  private prepareHtml(): string {
    if (!this.templateHtml) {
      throw new Error(
        'HTML template is missing in options for PDF generation.',
      );
    }

    try {
      const template = handlebars.compile(this.templateHtml);
      const formattedItems = this.items.map((item) => this.formatRow(item));
      const columnKeys = Object.keys(
        this.serializerOptions.formatDefinition,
      ) as Array<keyof TStandardized>;

      const header: string[] = columnKeys.map(
        (key) =>
          this.serializerOptions.formatDefinition[key]?.label || String(key),
      );
      return template({
        header,
        items: formattedItems,
        currentDate: dayMonthYear(getDateInBusinessTimezone().toDate()),
        publicResourcesBucket: this.publicResourcesBucket,
        metadataRow: this.serializerOptions.metadataRow,
        ...this.serializerOptions.hbsContext,
      });
    } catch (error) {
      throw error;
    }
  }

  private formatRow(item: TStandardized): TStandardized {
    const formattedRow: TStandardized = { ...item };

    for (const key in this.serializerOptions.formatDefinition) {
      if (
        Object.prototype.hasOwnProperty.call(
          this.serializerOptions.formatDefinition,
          key,
        )
      ) {
        const columnKey = key as keyof TStandardized;
        const columnFormat =
          this.serializerOptions.formatDefinition[columnKey]!;
        const rawValue = item[columnKey];
        formattedRow[columnKey] = formatCell(
          ReportType.PDF,
          rawValue,
          columnFormat,
        );
      }
    }

    return formattedRow;
  }

  private async generatePdfToBuffer(compiledHtml: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
    });

    try {
      const page = await browser.newPage();
      this.logger.debug('Setting page content for PDF buffer generation');
      await page.setContent(compiledHtml, { waitUntil: 'networkidle0' });
      const pdfOptions: PDFOptions = {
        format: 'A4',
        printBackground: true,
      };

      this.logger.debug('Generating PDF to buffer');
      const pdfBuffer = await page.pdf(pdfOptions);
      this.logger.debug(
        `PDF generation to buffer completed. Buffer size: ${pdfBuffer.length}. Closing browser.`,
      );
      await browser.close();
      return Buffer.from(pdfBuffer);
    } catch (error) {
      this.logger.error('Error generating PDF to buffer with page:', error);
      await browser.close();
      throw error;
    }
  }
}
