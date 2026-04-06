import { Exclude, Expose, Type } from 'class-transformer';
import { IsString, ValidateNested } from 'class-validator';

class StepFunctionDetail {
  @Expose()
  @IsString()
  input: string;
}

@Exclude()
export class StepFunctionEvent {
  @Expose()
  @ValidateNested()
  @Type(() => StepFunctionDetail)
  detail: StepFunctionDetail;
}
