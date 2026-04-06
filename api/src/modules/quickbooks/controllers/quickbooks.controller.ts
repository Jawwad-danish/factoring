import {
  Criteria,
  Identity,
  PageResult,
  PaginationResult,
  QueryCriteria,
} from '@core/data';
import {
  InitiateQuickbooksAuthRequest,
  QuickbooksJournalEntry,
} from '@fs-bobtail/factoring/data';
import {
  Controller,
  Get,
  HttpCode,
  HttpRedirectResponse,
  HttpStatus,
  Param,
  Post,
  Query,
  Redirect,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { Arrays } from '../../../core';
import { DevelopmentEnvironmentGuard } from '../../common';
import { JournalEntryMapper } from '../data';
import { SyncQuickbooksClientsCronJob } from '../services/cron-jobs';
import { QuickbooksService } from '../services/quickbooks.service';

@Controller('quickbooks')
export class QuickbooksController {
  constructor(
    private readonly quickbooksService: QuickbooksService,
    private readonly syncQuickbooksClientsCronJob: SyncQuickbooksClientsCronJob,
    private journalEntryMapper: JournalEntryMapper,
  ) {}

  @Get('callback')
  @Redirect()
  async loginCallback(@Req() request: Request): Promise<HttpRedirectResponse> {
    const { code, state, realmId } = request.query as {
      code: string;
      state: string;
      realmId: string;
    };

    const returnUrl = await this.quickbooksService.finishAuth(
      code,
      state,
      realmId,
    );
    return { url: returnUrl, statusCode: HttpStatus.FOUND };
  }

  @Get('initiate-auth')
  @Redirect()
  async initiateAuth(
    @Query() query: InitiateQuickbooksAuthRequest,
  ): Promise<HttpRedirectResponse> {
    const url = await this.quickbooksService.getAuthorizationUrl(
      query.returnUrl,
    );
    return { url, statusCode: HttpStatus.FOUND };
  }

  @Get('journal-entries')
  async findJournalEntries(
    @Criteria({
      parseFilterValues: false,
    })
    criteria: QueryCriteria,
  ): Promise<PageResult<QuickbooksJournalEntry>> {
    const result = await this.quickbooksService.findJournalEntries(criteria);
    return new PageResult(
      await Arrays.mapAsync(
        result.entities,
        async (journalEntry) =>
          await this.journalEntryMapper.entityToModel(journalEntry),
      ),
      new PaginationResult(
        criteria.page.page,
        criteria.page.limit,
        result.count,
      ),
    );
  }

  @Post('/journal-entries/:id/sync')
  @HttpCode(HttpStatus.OK)
  async syncJournalEntry(@Param() identity: Identity): Promise<void> {
    return await this.quickbooksService.syncJournalEntry(identity.id);
  }

  @Post('sync-accounts')
  @HttpCode(HttpStatus.OK)
  async syncAccounts(): Promise<void> {
    return await this.quickbooksService.syncAccounts();
  }

  @Post('/cron/sync-clients')
  @HttpCode(HttpStatus.OK)
  @UseGuards(DevelopmentEnvironmentGuard)
  async syncClients(): Promise<void> {
    return await this.syncQuickbooksClientsCronJob.execute();
  }
}
