import { Command } from '@module-cqrs';

export class DeleteAllFirebaseTokensCommand extends Command<void> {
  constructor(readonly userId: string) {
    super();
  }
}
