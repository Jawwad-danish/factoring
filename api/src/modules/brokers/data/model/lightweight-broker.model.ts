import { Expose } from 'class-transformer';

export class LightweightBroker {
  @Expose()
  id: string;

  @Expose()
  legalName: string;

  @Expose()
  doingBusinessAs: string;

  @Expose()
  mc: string;

  @Expose()
  dot: string;
}
