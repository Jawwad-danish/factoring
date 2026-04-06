import { Convert } from '@core/services';
import { DocumentPayload } from '../types';

export const run = async (
  invoiceDocuments: DocumentPayload[],
  convert: Convert,
): Promise<DocumentPayload[]> => {
  const result: DocumentPayload[] = [];
  for (const document of invoiceDocuments) {
    const compressedUrl = await convert.compress(document.internalUrl);
    const orientationUrl = await convert.orient(compressedUrl);
    result.push({
      id: document.id,
      name: document.name,
      type: document.type,
      internalUrl: orientationUrl,
      externalUrl: null,
    });
  }
  return result;
};
