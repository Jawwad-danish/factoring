import { Filestack } from '../../core/services/filestack';
import { DocumentPayload } from '../types';

export const run = async (
  invoiceDocuments: DocumentPayload[],
  filestack: Filestack,
): Promise<DocumentPayload[]> => {
  const result: DocumentPayload[] = [];
  console.log(`Iterating over ${invoiceDocuments.length} invoice documents`);
  const validExtensions = ['png', 'jpg', 'jpeg'];
  for (const document of invoiceDocuments) {
    if (
      validExtensions.some((ext) =>
        document.name.toLowerCase().includes(ext),
      ) &&
      document.externalUrl
    ) {
      const conversionResult = await filestack.convertImageToPdf(
        document.externalUrl,
      );
      result.push({
        id: document.id,
        internalUrl: `https://${
          conversionResult.container
        }.s3.amazonaws.com/${encodeURIComponent(conversionResult.key)}`,
        externalUrl: conversionResult.url,
        type: document.type,
        name: conversionResult.filename,
      });
    } else {
      result.push(document);
    }
  }

  return result;
};
