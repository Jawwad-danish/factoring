import { ChangeActions } from '@common';
import { CommandInvoiceContext, InvoiceContext } from '@module-invoices/data';
import { QueryRunner, RequestCommand } from '@module-cqrs';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import { InvoiceRepository } from '@module-persistence';
import { InvoiceEntity } from '@module-persistence/entities';
import { FindBrokerClientQuery } from '../../queries';
import { InvoiceRuleService, InvoiceValidationService } from './common';

export abstract class BaseInvoiceCommandHandler<
  TRequest,
  C extends RequestCommand<TRequest, InvoiceContext>,
> {
  constructor(
    readonly queryRunner: QueryRunner,
    readonly invoiceRepository: InvoiceRepository,
    readonly validationService: InvoiceValidationService<TRequest>,
    readonly ruleService: InvoiceRuleService<TRequest>,
    readonly invoiceChangeActionsExecutor: InvoiceChangeActionsExecutor,
  ) {}

  async execute(command: C): Promise<InvoiceContext> {
    const entity = await this.loadEntity(command);

    const queryResult = await this.queryRunner.run(
      new FindBrokerClientQuery(entity.clientId, entity.brokerId),
    );
    const context: CommandInvoiceContext<TRequest> = {
      client: queryResult[0],
      broker: queryResult[1],
      entity: entity,
      payload: command.request,
    };
    await this.validationService.validate(context);
    const preRuleResults = await this.prepareContext(context);
    await this.validationService.validatePostPreparation(context);
    const ruleResults = await this.ruleService.execute(context);
    preRuleResults.concat(ruleResults);
    await this.invoiceChangeActionsExecutor.apply(
      context.entity,
      preRuleResults,
    );
    const persistedEntity = await this.invoiceRepository.persistAndFlush(
      context.entity,
    );
    context.entity = persistedEntity;
    await this.postSaveHooks(context);
    return context;
  }

  protected abstract loadEntity(command: C): Promise<InvoiceEntity>;

  protected async prepareContext(
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: CommandInvoiceContext<TRequest>,
  ): Promise<ChangeActions> {
    return ChangeActions.empty();
  }

  protected async postSaveHooks(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _context: CommandInvoiceContext<TRequest>,
  ): Promise<void> {
    return;
  }
}
