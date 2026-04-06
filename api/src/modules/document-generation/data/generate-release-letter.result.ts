import { BaseModel } from '@core/data';

export class GenerateReleaseLetterResult extends BaseModel<GenerateReleaseLetterResult> {
  constructor(readonly url: string, readonly name: string) {
    super();
  }
}
