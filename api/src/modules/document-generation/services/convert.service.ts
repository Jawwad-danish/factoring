import { Convert } from '@core/services';
import { Logger } from '@nestjs/common';

export class ConvertService {
  private convert: Convert;
  private readonly logger = new Logger(ConvertService.name);

  constructor(private readonly key: string, private readonly uri: string) {
    this.convert = new Convert(this.key, this.uri);
  }

  async urlToPDF(url: string) {
    this.logger.debug('Converting URL to PDF', {
      url,
    });
    const result = await this.convert.urlToPDF(url);
    this.logger.debug('Conversion finished from URL to PDF', {
      url,
      pdf: result,
    });
    return result;
  }
}
