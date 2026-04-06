import { V1AwareBaseModel } from '@core/data';
import { TransformFromBig, TransformToBig } from '@core/decorators';
import { ApiProperty } from '@nestjs/swagger';
import { Big } from 'big.js';
import { Type } from 'class-transformer';
import { IsOptional } from 'class-validator';

export class PurchaseInvoiceRequest extends V1AwareBaseModel<PurchaseInvoiceRequest> {
  @IsOptional()
  @TransformToBig()
  @TransformFromBig()
  @Type(() => String)
  @ApiProperty({
    title: 'Invoice deduction',
    description: 'The invoice deduction value',
    type: 'number',
    pattern: '[0-9]+',
    default: '0',
    required: false,
  })
  deduction?: Big;
}
