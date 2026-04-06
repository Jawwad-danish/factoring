import { TagDefinition } from '@fs-bobtail/factoring/data';
import { UsedByType } from '@module-persistence/entities';
import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  UseInterceptors,
} from '@nestjs/common';
import { ApiExcludeController, ApiExcludeEndpoint } from '@nestjs/swagger';
import { TagDefinitionService } from '../services';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('tag-definitions')
@ApiExcludeController()
export class TagDefinitionController {
  constructor(private tagDefinitionService: TagDefinitionService) {}

  @Get('/user')
  @HttpCode(200)
  @ApiExcludeEndpoint()
  findByUserType(): Promise<TagDefinition[]> {
    return this.tagDefinitionService.findByType(UsedByType.User);
  }
}
