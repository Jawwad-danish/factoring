import { environment } from '@core/environment';
import { AWSModule, S3ObjectLocator, S3Service } from '@module-aws';
import { createLambdaNestContext } from '../common/nest-context';
import { DocumentPayload } from '../types';

export const run = async (
  payload: DocumentPayload[],
): Promise<DocumentPayload[]> => {
  const app = await createLambdaNestContext(AWSModule);
  const s3Service = app.get(S3Service);

  const response: DocumentPayload[] = [];
  for (const item of payload) {
    const destination = new S3ObjectLocator(
      environment.lambda.bucket(),
      item.name,
      true,
    );
    const s3Response = await s3Service.putObjectFromURL(
      item.internalUrl,
      destination,
    );
    if (s3Response.$metadata.httpStatusCode !== 200) {
      console.error(
        `Could not put object item.documentUrl to ${destination.getBucket()}`,
      );
      continue;
    }
    response.push({
      id: item.id,
      name: item.name,
      type: item.type,
      internalUrl: `https://${destination.getBucket()}.s3.amazonaws.com/${encodeURIComponent(
        destination.getKey(),
      )}`,
      externalUrl: null, //This is null because the new version is not hosted in filestack
    });
  }

  return response;
};
