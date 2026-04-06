import { Identity, User } from '@core/data';
import { ApiIdentityParam } from '@core/web';
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { UpdateUserRequest, UserContext } from '../data';
import { UserService } from '../services';
import { AppContextHolder } from '@core/app-context';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Patch(':id')
  @HttpCode(200)
  @ApiIdentityParam()
  @ApiOkResponse({
    description: 'User was updated successfully',
  })
  async update(
    @Param() identity: Identity,
    @Body() request: UpdateUserRequest,
  ): Promise<UserContext> {
    return this.userService.update(identity.id, request);
  }

  @Get('/me')
  @HttpCode(200)
  async getUserConfig(): Promise<User> {
    const { email } = AppContextHolder.get().getAuthentication().principal;
    return await this.userService.getUserConfig(email);
  }

  @Get(':id')
  @HttpCode(200)
  async getUserById(@Param() identity: Identity): Promise<User> {
    return await this.userService.getUserById(identity.id);
  }
}
