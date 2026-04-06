import { Injectable } from '@nestjs/common';

@Injectable()
export class EmptySlackService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async postErrorMessage(_message: string, _blocks: any): Promise<void> {}
}
