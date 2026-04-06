import { Injectable } from '@nestjs/common';
import { Transform } from 'stream';
import { ReportSerializer } from '../report.serializer';
import { ReportSerializerOptions } from '../serialization-options';
import { CsvTransformer } from './csv.transformer';

@Injectable()
export class CsvSerializer<TStandardized extends object>
  implements ReportSerializer<TStandardized>
{
  createTransformStream(
    options: ReportSerializerOptions<TStandardized>,
  ): Transform {
    return new CsvTransformer(options);
  }
}
