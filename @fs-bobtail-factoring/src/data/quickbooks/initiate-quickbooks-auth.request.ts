import { IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { BaseModel } from '../common';

export class InitiateQuickbooksAuthRequest extends BaseModel<InitiateQuickbooksAuthRequest> {
  @IsNotEmpty()
  @IsString()
  @IsUrl({ require_tld: false })
  returnUrl!: string;
}
