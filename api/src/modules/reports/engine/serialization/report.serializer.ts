import { Transform } from 'stream';
import { ReportSerializerOptions } from './serialization-options';

export interface ReportSerializer<TStandardized extends object> {
  createTransformStream(
    options: ReportSerializerOptions<TStandardized>,
  ): Transform;
}
