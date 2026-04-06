import { Injectable } from '@nestjs/common';
import { Transform } from 'stream';
import { ReportSerializer } from '../report.serializer';
import { ReportSerializerOptions } from '../serialization-options';
import { ExcelTransformer } from './excel.transformer';

/**
 * Creates a transform stream that converts standardized data into Excel format.
 */
@Injectable()
export class ExcelSerializer<TStandardized extends object>
  implements ReportSerializer<TStandardized>
{
  createTransformStream(
    options: ReportSerializerOptions<TStandardized>,
  ): Transform {
    return new ExcelTransformer(options);
  }
}
