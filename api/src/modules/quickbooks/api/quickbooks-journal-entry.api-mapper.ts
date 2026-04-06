import {
  JournalEntry,
  JournalEntryLineDetail,
} from '@balancer-team/quickbooks/dist/schemas';
import { penniesToDollars } from '@core/formulas';
import { Arrays } from '@core/util';
import {
  QuickbooksJournalEntryEntity,
  QuickbooksJournalPostingType,
} from '@module-persistence/entities';
import { ClientFactoringConfigsRepository } from '@module-persistence/repositories';
import { Injectable } from '@nestjs/common';

@Injectable()
export class QuickbooksJournalEntryApiMapper {
  constructor(
    private readonly clientFactoringConfigsRepository: ClientFactoringConfigsRepository,
  ) {}
  async entityToApiJournalEntry(
    entity: QuickbooksJournalEntryEntity,
  ): Promise<JournalEntry> {
    const lines: JournalEntryLineDetail[] = await Arrays.mapAsync(
      entity.lines.getItems(),
      async (line) => {
        const apiLine: JournalEntryLineDetail = {
          Amount: penniesToDollars(line.amount).toNumber(),
          DetailType: 'JournalEntryLineDetail',
          JournalEntryLineDetail: {
            PostingType:
              line.type === QuickbooksJournalPostingType.Debit
                ? 'Debit'
                : 'Credit',
            AccountRef: {
              value: line.account.quickbooksId || '',
              name: line.account.name || '',
            },
          },
        };

        if (line.clientId) {
          await this.addClientReference(apiLine, line.clientId);
        }

        return apiLine;
      },
    );

    const journalEntry: JournalEntry = {
      DocNumber: entity.docName,
      TxnDate: entity.businessDay,
      Line: lines,
    };

    return journalEntry;
  }

  private async addClientReference(
    apiLine: JournalEntryLineDetail,
    clientId: string,
  ) {
    const client = await this.clientFactoringConfigsRepository.getOneByClientId(
      clientId,
    );
    apiLine.JournalEntryLineDetail.Entity = {
      EntityRef: {
        value: client.quickbooksId || '',
        name: client.quickbooksName || '',
      },
      Type: 'Customer',
    };
  }
}
