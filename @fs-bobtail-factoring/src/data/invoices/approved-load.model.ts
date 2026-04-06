import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, IsUUID } from 'class-validator';

export class ApprovedLoad {
  @IsUUID()
  @Expose()
  @ApiProperty({
    title: 'Invoice ID',
    description: 'The ID of the approved invoice',
    format: 'uuid',
  })
  id!: string;

  @IsString()
  @Expose()
  @ApiProperty({
    title: 'Load Number',
    description: 'The load number of the approved invoice',
  })
  loadNumber!: string;
}
