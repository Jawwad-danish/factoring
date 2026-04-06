import { CreateClientBatchPaymentRequest } from '../../../data';
import { Injectable } from '@nestjs/common';
import { ClientBatchPaymentValidationService } from '../../common';

@Injectable()
export class CreateClientBatchPaymentValidationService extends ClientBatchPaymentValidationService<CreateClientBatchPaymentRequest> {
  constructor() {
    super([]);
  }
}
