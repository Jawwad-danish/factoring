import { ClientBatchPayment } from '@fs-bobtail/factoring/data';
import { Transactional } from '@module-database';
import { Injectable } from '@nestjs/common';
import { CreateClientBatchPaymentRequest } from '../data';
import { CreateClientBatchPaymentOperation } from '../operations/create-client-batch-payment-operation/create-client-batch-payment-operation';

@Injectable()
export class ClientBatchPaymentService {
  constructor(
    private createClientBatchPaymentOperation: CreateClientBatchPaymentOperation,
  ) {}
  @Transactional()
  async create(
    createClientBatchPaymentRequest: CreateClientBatchPaymentRequest,
  ): Promise<ClientBatchPayment> {
    return this.createClientBatchPaymentOperation.run(
      createClientBatchPaymentRequest,
    );
  }
}
