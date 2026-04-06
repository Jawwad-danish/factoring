import { ChangeActions } from '../data';

export interface ChangeActionsRule<TInput> {
  run(input: TInput): Promise<ChangeActions>;
}

export class ChangeActionsRuleExecutor<TInput> {
  constructor(private readonly rules: ChangeActionsRule<TInput>[]) {}

  async execute(input: TInput): Promise<ChangeActions> {
    const changeActions: ChangeActions = ChangeActions.empty();
    for (const rule of this.rules) {
      const ruleResult = await rule.run(input);
      changeActions.concat(ruleResult);
    }
    return changeActions;
  }
}
