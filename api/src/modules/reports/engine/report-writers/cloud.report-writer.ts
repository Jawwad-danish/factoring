import { BaseReportCreateRequest } from '@fs-bobtail/factoring/data';
import { S3ObjectLocator, S3Service } from '@module-aws';
import { Readable } from 'stream';
import { ReportWriter, ReportWriteResult } from './base.report-writer';

export class CloudReportWriter extends ReportWriter {
  constructor(
    private readonly reportsBucketName: string,
    private readonly s3Service: S3Service,
  ) {
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
    const s3Locator = new S3ObjectLocator(this.reportsBucketName, fileName);

    this.logger.log(`Uploading report to S3: ${s3Locator.getPath()}`);

    try {
      // Buffer the stream to determine its length
      const chunks: Buffer[] = [];
      for await (const chunk of reportStream) {
        chunks.push(Buffer.from(chunk));
      }
      const buffer = Buffer.concat(chunks);

      await this.s3Service.putObject(
        {
          data: buffer,
          type: this.getOutputType(reportRequest).getMimeType(),
          length: buffer.length,
        },
        s3Locator,
      );

      const s3Url = `https://${s3Locator.getBucket()}.s3.amazonaws.com/${encodeURIComponent(
        s3Locator.getKey(),
      )}`;
      this.logger.log(`Successfully uploaded report to S3: ${s3Url}`);
      return { storageUrl: s3Url };
    } catch (error) {
      this.logger.error(
        `Failed to upload report ${reportRequest.name} to S3: ${error.message}`,
        error.stack,
      );

      if (!reportStream.destroyed) {
        reportStream.destroy(error);
      }
      throw error;
    }
  }
}
