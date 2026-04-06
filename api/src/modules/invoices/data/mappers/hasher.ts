import { InvoiceEntity } from '@module-persistence/entities';
import { Logger } from '@nestjs/common';
import { hashFile } from '@core/services';

export class Hasher {
  private static logger = new Logger(Hasher.name);

  static async apply(invoice: InvoiceEntity): Promise<void> {
    if (!invoice.documents || invoice.documents.length === 0) {
      return;
    }

    Hasher.logger.log(`Applying hashes to invoice documents`, {
      loadNumber: invoice.loadNumber,
    });
    for (const document of invoice.documents) {
      const hash = await hashFile(document.internalUrl);
      if (hash) {
        document.fileHash = hash;
      }
    }
  }
}
