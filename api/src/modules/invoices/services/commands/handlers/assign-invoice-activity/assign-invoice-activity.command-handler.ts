import { ChangeActions, ChangeActor } from '@common';
import { Note } from '@core/data';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import { InvoiceTaggedContext } from '@module-invoices/data';
import {
  InvoiceRepository,
  TagDefinitionRepository,
} from '@module-persistence/repositories';
import { CommandHandler } from '@nestjs/cqrs';
import { AssignInvoiceActivityCommand } from '../../assign-tag-invoice.command';
import { AssignInvoiceActivityRuleService } from './rules';
import { BasicCommandHandler } from '@module-cqrs';
import { buildResolvedTagsNote } from '../../../../utils';

@CommandHandler(AssignInvoiceActivityCommand)
export class AssignInvoiceActivityCommandHandler
  implements BasicCommandHandler<AssignInvoiceActivityCommand>
{
  constructor(
    readonly invoiceRepository: InvoiceRepository,
    private readonly ruleService: AssignInvoiceActivityRuleService,
    readonly invoiceChangeActionsExecutor: InvoiceChangeActionsExecutor,
    private tagRepository: TagDefinitionRepository,
  ) {}

  async execute(
    command: AssignInvoiceActivityCommand,
  ): Promise<InvoiceTaggedContext> {
    const { invoiceId, request } = command;
    const tag = await this.tagRepository.getByKey(request.key);
    const invoice = await this.invoiceRepository.getOneById(invoiceId);

    const ruleBasedActions = await this.ruleService.execute({
      invoice,
      changeActions: ChangeActions.empty(),
      request,
    });
    const resolvedTagsNote = buildResolvedTagsNote(ruleBasedActions);

    const allActions = ChangeActions.addTagAndActivity(
      tag.key,
      Note.from({
        payload: {
          ...request.payload,
        },
        text:
          (request.note || 'Invoice tagged without additional notes.') +
          resolvedTagsNote,
      }),
      { actor: ChangeActor.User, activityId: request.id },
    );
    allActions.concat(ruleBasedActions);

    await this.invoiceChangeActionsExecutor.apply(invoice, allActions);

    return {
      invoice,
      changeActions: allActions,
    };
  }
}
