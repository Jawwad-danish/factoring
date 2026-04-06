import { IsArray, IsString, IsUUID } from 'class-validator';
import { BaseModel } from './base.model';

export class Identity extends BaseModel<Identity> {
  @IsString()
  @IsUUID()
  id: string;
}

export class Identities {
  @IsArray()
  @IsUUID(4, { each: true })
  ids: string[];
}
