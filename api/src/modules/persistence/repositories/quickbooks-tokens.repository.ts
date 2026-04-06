import { EncryptionService } from '@module-common';
import { DatabaseService } from '@module-database';
import { Inject, Injectable } from '@nestjs/common';
import { QuickbookTokensEntity } from '../entities';
import { BasicRepository } from './basic-repository';
import { Token } from '@balancer-team/quickbooks/dist/schemas';

@Injectable()
export class QuickbooksTokensRepository extends BasicRepository<QuickbookTokensEntity> {
  constructor(
    @Inject(DatabaseService) databaseService: DatabaseService,
    private readonly encryptionService: EncryptionService,
  ) {
    super(databaseService, QuickbookTokensEntity);
  }

  async setToken(tokenData: Token) {
    let entity = await this.retrieveEncryptedToken();
    if (!entity) {
      entity = new QuickbookTokensEntity();
    }
    const encryptedToken = this.encryptionService.encrypt(
      JSON.stringify(tokenData),
    );
    entity.encryptedToken = encryptedToken;
    return this.persistAndFlush(entity);
  }

  async getToken(): Promise<Token | null> {
    const entity = await this.retrieveEncryptedToken();
    if (!entity) {
      return null;
    }
    const decryptedToken = this.encryptionService.decrypt(
      entity.encryptedToken,
    );
    return JSON.parse(decryptedToken) as Token;
  }

  private async retrieveEncryptedToken(): Promise<QuickbookTokensEntity | null> {
    const result = await this.repository.find({}, { limit: 1 });
    return result[0];
  }
}
