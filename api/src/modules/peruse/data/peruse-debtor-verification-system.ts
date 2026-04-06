import { Expose } from 'class-transformer';
import { IsDefined } from 'class-validator';

export class DebtorSystemVerification {
  @Expose({ name: 'verifier' })
  @IsDefined()
  verifier: null | string = null;

  @Expose({ name: 'load_is_verified' })
  @IsDefined()
  loadIsVerified: null | boolean = null;

  @Expose({ name: 'load_number' })
  @IsDefined()
  loadNumber: null | string = null;
}
