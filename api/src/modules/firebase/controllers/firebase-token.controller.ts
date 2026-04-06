import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CreateFirebaseTokenRequest,
  DeleteFirebaseTokenRequest,
} from '../data/web';
import { FirebaseTokenService } from '../services';
import { AppContextHolder } from '@core/app-context';
import { Identity } from '@core/data';

@ApiTags('firebase-tokens')
@Controller('firebase-tokens')
export class FirebaseTokenController {
  constructor(private readonly firebaseTokenService: FirebaseTokenService) {}

  @ApiOperation({
    description: 'Create a firebase token record',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
  })
  @Post('')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() payload: CreateFirebaseTokenRequest): Promise<Identity> {
    const userId = AppContextHolder.get().getAuthentication().principal.id;
    const id = await this.firebaseTokenService.create(payload, userId);
    return new Identity({ id });
  }

  @ApiOperation({
    description: 'delete a firebase token record',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
  })
  @Delete('/:token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('token') token: string,
    @Body() payload: DeleteFirebaseTokenRequest,
  ): Promise<void> {
    const userId = AppContextHolder.get().getAuthentication().principal.id;
    return await this.firebaseTokenService.delete(token, userId, payload);
  }

  @ApiOperation({
    description: 'delete all firebase tokens of a user',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
  })
  @Delete('')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAllTokens(): Promise<void> {
    const userId = AppContextHolder.get().getAuthentication().principal.id;
    return await this.firebaseTokenService.deleteAllTokens(userId);
  }
}
