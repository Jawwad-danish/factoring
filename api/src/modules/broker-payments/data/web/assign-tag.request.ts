import { TagDefinitionKey } from '@module-persistence';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class TagRequest {
  @IsEnum(TagDefinitionKey)
  @ApiProperty({
    title: 'Tag key',
    description: 'The tag key used for tagging',
    enum: TagDefinitionKey,
  })
  key: TagDefinitionKey;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    title: 'Tag note',
    description: 'The tag note',
  })
  note?: string;
}
