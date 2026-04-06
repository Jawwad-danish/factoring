import { BaseModel } from '@core/data';

export class TransferCreated extends BaseModel<TransferCreated> {
  static readonly EVENT_NAME: string = 'transfer.created';

  constructor(readonly transferId: string) {
    super();
  }
}
