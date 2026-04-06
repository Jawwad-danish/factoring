import { Invoice } from '@fs-bobtail/factoring/data';
import {
  ArgumentMetadata,
  Injectable,
  NotFoundException,
  PipeTransform,
} from '@nestjs/common';
import { InvoiceService } from './services';

/**
 * Transforms a ID (uuid string value) into an Invoice
 * by searching into the database by the ID.
 *
 * If no invoice is found then an NotFoundException is thrown.
 */
@Injectable()
export class InvoiceByIdPipe
  implements PipeTransform<string, Promise<Invoice>>
{
  constructor(private readonly invoiceService: InvoiceService) {}

  async transform(
    id: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _metadata: ArgumentMetadata,
  ): Promise<Invoice> {
    const invoice = await this.invoiceService.getOneById(id);
    if (invoice === null) {
      throw new NotFoundException(`Invoice with id ${id} does not exist!`);
    }
    return invoice;
  }
}
