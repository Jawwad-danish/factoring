import { Command } from './command';

export abstract class RequestCommand<REQUEST, RESULT> extends Command<RESULT> {
  constructor(readonly request: REQUEST) {
    super();
  }
}
