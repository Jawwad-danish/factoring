import { AuditBaseModel } from '@core/data';
import { TransformFromBig } from '@core/decorators';
import { ProcessingNotes } from '@module-processing-notes';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { BrokerLimitHistory } from './broker-factoring-limit-history.model';

export class BrokerFactoringConfig extends AuditBaseModel<BrokerFactoringConfig> {
  @Expose()
  @ApiProperty({
    title: 'ID',
    description: 'ID of the broker factoring config entity',
  })
  id: string;

  @ApiProperty({
    title: 'Broker ID',
    description: 'ID of the broker',
  })
  brokerId: string;

  @Expose()
  @TransformFromBig()
  @ApiProperty({
    title: 'Broker limit',
    description: `Threshold for a broker's invoice amount in aging`,
    type: 'string',
    pattern: '^d+((.)|(.d{0,1})?)$',
    example: '3000.0',
    nullable: true,
  })
  limitAmount: null | Big;

  @Expose()
  @ApiProperty({
    title: 'Broker limit amount history',
    description: 'The history of broker limit amount applied to the broker',
  })
  limitHistory: BrokerLimitHistory[];

  @Expose()
  @ApiProperty({
    title: 'Processing notes',
    description: 'The processing notes for the broker',
  })
  processingNotes: ProcessingNotes[];

  @Expose()
  @ApiProperty({
    title: 'Verification Delay',
    description: 'Indicates if there is a verification delay for the broker',
    type: 'boolean',
    nullable: true,
  })
  verificationDelay?: boolean;

  @Expose()
  @ApiProperty({
    title: 'Preferences',
    description: 'Preferences associated with the broker',
    type: 'string',
    maxLength: 255,
    nullable: true,
  })
  preferences?: string;
}
