import { Identity } from '@core/data';
import {
  ClientBankAccount,
  ClientBankAccountMarkPrimaryRequest,
} from '@fs-bobtail/factoring/data';
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { CreateBankAccountRequest } from '../api/data';
import { ClientBankAccountService } from '../services';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('clients/:id/bank-accounts')
@ApiExcludeController()
export class ClientBankAccountsController {
  constructor(
    private readonly clientBankAccountService: ClientBankAccountService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param() identity: Identity,
    @Body() payload: CreateBankAccountRequest,
  ): Promise<ClientBankAccount> {
    return this.clientBankAccountService.createClientBankAccount(
      identity.id,
      payload,
    );
  }

  @Post(':bankAccountId/mark-primary')
  @HttpCode(HttpStatus.OK)
  async markAsPrimary(
    @Param('id') clientId: string,
    @Param('bankAccountId') bankAccountId: string,
    @Body() payload: ClientBankAccountMarkPrimaryRequest,
  ): Promise<ClientBankAccount> {
    return this.clientBankAccountService.markBankAccountAsPrimary(
      clientId,
      bankAccountId,
      payload,
    );
  }
}
