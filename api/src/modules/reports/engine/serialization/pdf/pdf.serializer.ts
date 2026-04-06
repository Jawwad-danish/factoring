import { Injectable } from '@nestjs/common';
import { Transform } from 'stream';
import { ReportSerializer } from '../report.serializer';
import { ReportSerializerOptions } from '../serialization-options';
import { PdfTransformer } from './pdf.transformer';

@Injectable()
export class PdfSerializer<TStandardized extends object>
  implements ReportSerializer<TStandardized>
{
  createTransformStream(
    options: ReportSerializerOptions<TStandardized>,
    template: string = '',
    publicResourcesBucket = '',
  ): Transform {
    return new PdfTransformer<TStandardized>(
      options,
      template,
      publicResourcesBucket,
    );
  }
}
