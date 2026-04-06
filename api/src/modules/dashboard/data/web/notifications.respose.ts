import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

interface Stats {
  count: number;
  total: number;
}

export class NotificationsResponse {
  @Expose()
  @ApiProperty({
    title: 'Chargebacks',
    description: 'Upcoming invoice chargeback statistics',
    format: 'uuid',
  })
  upcomingChargebacksStats: Stats;

  @Expose()
  @ApiProperty({
    title: 'Paperwork issues',
    description: 'Invoice paperwork issues statistics',
    format: 'uuid',
  })
  paperworkIssuesStats: Stats;

  @Expose()
  @ApiProperty({
    title: 'Originals required',
    description: 'Originals required statistics',
    format: 'uuid',
  })
  originalsRequiredStats: Stats;
}
