import { NotAny } from '@core/types';
import { TypedReadable } from '@core/util';
import { ReportType } from '@fs-bobtail/factoring/data';
import { ReportName } from '@module-persistence';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { pipeline, Readable, Transform } from 'stream';
import {
  ReportSerializerOptions,
  ReportSerializerProvider,
} from '../../serialization';
import { TEMPLATE_LOADER, TemplateLoader } from '../../templates';

@Injectable()
export class ReportHandler {
  private readonly logger: Logger = new Logger(this.constructor.name);

  constructor(
    private readonly serializerProvider: ReportSerializerProvider,
    @Inject(TEMPLATE_LOADER) private readonly templateLoader: TemplateLoader,
  ) {}

  async processReport<TStandardized>(
    outputType: ReportType,
    reportName: ReportName,
    dataStream: TypedReadable<NotAny<TStandardized>>,
    serializerOptions: ReportSerializerOptions<NotAny<TStandardized>>,
  ): Promise<Readable> {
    this.logger.log(`Processing report for output type: ${outputType}`);

    const serializerTransform = await this.getSerializerTransformStream(
      outputType,
      reportName,
      serializerOptions,
    );

    return pipeline(dataStream, serializerTransform, (err) => {
      if (err) {
        this.logger.error(
          `Pipeline failed for ${outputType} report:`,
          err.stack,
        );
      } else {
        this.logger.log(
          `Pipeline completed successfully for ${outputType} report.`,
        );
      }
    });
  }

  private async getSerializerTransformStream<TStandardized extends object>(
    outputType: ReportType,
    reportName: ReportName,
    serializerOptions: ReportSerializerOptions<TStandardized>,
  ): Promise<Transform> {
    switch (outputType) {
      case ReportType.CSV:
        return this.serializerProvider
          .getCsvSerializer<TStandardized>()
          .createTransformStream(serializerOptions);

      case ReportType.PDF:
        const htmlTemplate = await this.templateLoader.getTemplate(reportName);
        const publicResourcesBucket =
          await this.templateLoader.getPublicResourcesBucket();

        return this.serializerProvider
          .getPdfSerializer<TStandardized>()
          .createTransformStream(
            serializerOptions,
            htmlTemplate,
            publicResourcesBucket,
          );

      case ReportType.EXCEL:
        return this.serializerProvider
          .getExcelSerializer<TStandardized>()
          .createTransformStream(serializerOptions);

      default:
        throw new Error(`Unsupported output type: ${outputType}`);
    }
  }
}
