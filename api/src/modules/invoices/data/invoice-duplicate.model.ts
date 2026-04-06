import { Expose } from 'class-transformer';
import { DuplicateDetectionItem } from '../services';

export class InvoiceDuplicate {
  @Expose()
  result: boolean;

  @Expose()
  items: DuplicateDetectionItem[];
}
