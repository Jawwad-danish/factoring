import { Client } from '@module-clients';
import { Command } from '@module-cqrs';
import { GenerateReleaseLetterResult } from '../../data';

export class GenerateReleaseLetterCommand extends Command<GenerateReleaseLetterResult> {
  constructor(readonly client: Client) {
    super();
  }
}
