import { S3EventRecord } from 'aws-lambda';
import { AxiosResponse } from 'axios';
import {
  BatchPaymentStatusUpdateCommand,
  CreateBatchPaymentCommand,
  CreateClientfactoringConfigCommand,
  UpdateUserActivityCommand,
} from './commands';
import { CreateEmailActivityCommand } from './commands/create-email-activity.command';
import { Operation } from './operations';

export interface AxiosCommand {
  run(): Promise<AxiosResponse<any, any> | null>;
}

const getS3Operation = (record: S3EventRecord): string => {
  const operation = record.s3.object.key.split('_')[0];
  return operation;
};

export const commandFactory = (record: S3EventRecord): AxiosCommand | null => {
  const operation = getS3Operation(record);
  console.log(`Finding command for operation ${operation}`);

  switch (operation) {
    case Operation.CreateBatchPayment:
      return new CreateBatchPaymentCommand(record);
    case Operation.BatchPaymentStatusUpdate:
      return new BatchPaymentStatusUpdateCommand(record);
    case Operation.CreateEmailActivity:
      return new CreateEmailActivityCommand(record);
    case Operation.CreateClientFactoringConfig:
      return new CreateClientfactoringConfigCommand(record);
    case Operation.UpdateUser:
      return new UpdateUserActivityCommand(record);

    default:
      console.warn(`No implementation found for operation ${operation}`);
      return null;
  }
};
