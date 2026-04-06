import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, ValidateNested } from 'class-validator';

export enum AddressType {
  Pickup = 'pickup',
  Delivery = 'delivery',
}

export enum PeruseJobStatus {
  Success = 'success',
  Error = 'error',
  Pending = 'pending',
}

export class Document {
  @Expose({ name: 'external_id' })
  @IsNotEmpty()
  externalId: string;

  @Expose({ name: 'url' })
  @IsNotEmpty()
  url: string;
}

export class ProcessingConfigOverride {
  @Expose({ name: 'autoSplit' })
  autoSplit: boolean;
}

export class Input {
  @Expose({ name: 'document' })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => Document)
  document: Document;

  @Expose({ name: 'extract' })
  @IsBoolean()
  extract: boolean;

  @Expose({ name: 'callback_url' })
  @IsNotEmpty()
  callbackUrl: string;

  @Expose({ name: 'processing-config-override' })
  @ValidateNested()
  @Type(() => ProcessingConfigOverride)
  processingConfigOverride: ProcessingConfigOverride;
}
