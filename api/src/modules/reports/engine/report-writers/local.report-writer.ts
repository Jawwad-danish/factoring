import { BaseReportCreateRequest } from '@fs-bobtail/factoring/data';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { ReportWriter, ReportWriteResult } from './base.report-writer';

export class LocalReportWriter extends ReportWriter {
  constructor(private readonly outputDirectory: string) {
    super();
  }

  async write(
    reportStream: Readable,
    reportRequest: BaseReportCreateRequest<any>,
  ): Promise<ReportWriteResult> {
    const fileName = this.generateFileName(
      reportRequest.name,
      this.getOutputType(reportRequest),
    );
    const fullPath = path.join(this.outputDirectory, fileName);
    const storageUrl = `file://${fullPath}`;

    this.logger.log(`Writing report locally to: ${fullPath}`);

    try {
      await fs.promises.mkdir(this.outputDirectory, { recursive: true });

      const fileWriteStream = fs.createWriteStream(fullPath, {
        autoClose: true,
      });

      await pipeline(reportStream, fileWriteStream);

      this.logger.log(`Successfully wrote report locally: ${fullPath}`);
      return { storageUrl };
    } catch (error) {
      this.logger.error(
        `Failed to write report ${reportRequest.name} locally to ${fullPath}: ${error.message}`,
        error.stack,
      );

      try {
        if (fs.existsSync(fullPath)) {
          await fs.promises.unlink(fullPath);
        }
      } catch (cleanupError) {
        this.logger.warn(
          `Failed to cleanup partially written file ${fullPath}: ${cleanupError.message}`,
        );
      }

      if (!reportStream.destroyed) {
        reportStream.destroy(error);
      }

      throw error;
    }
  }
}
