import { ClassConstructor, Expose, Type } from 'class-transformer';
import { IsString, IsUUID, ValidateNested } from 'class-validator';

class DocumentGenerationEventInvoice {
  @Expose()
  @IsUUID()
  id: string;
}

class DocumentGenerationEventHeaders {
  @Expose()
  @IsString()
  authorization: string;
}

export const DocumentGenerationEventMixin = <T>(
  bodyClass: ClassConstructor<T>,
) => {
  class Event {
    @Expose()
    @ValidateNested()
    @Type(() => DocumentGenerationEventHeaders)
    headers: DocumentGenerationEventHeaders;

    @Expose()
    @ValidateNested()
    @Type(() => bodyClass)
    body: T;
  }
  return Event;
};

export class DocumentGenerationEvent extends DocumentGenerationEventMixin(
  DocumentGenerationEventInvoice,
) {}
