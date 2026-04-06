import { IsNumber, Max, Min } from 'class-validator';
import { BaseModel } from '../common';

export class PageCriteria extends BaseModel<PageCriteria> {
  @IsNumber()
  @Min(1)
  page!: number;

  @IsNumber()
  @Min(1)
  @Max(100)
  limit!: number;

  getOffset(): number {
    return (this.page - 1) * this.limit;
  }
}
