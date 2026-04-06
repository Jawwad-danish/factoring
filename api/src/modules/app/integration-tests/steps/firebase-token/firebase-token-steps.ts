import { CreateFirebaseTokenRequest } from '@module-firebase';
import { StepsInput } from '../step';
import { CreateFirebaseTokenSteps } from './firebase-token-create-steps';
import { DeleteFirebaseTokenSteps } from './firebase-token-delete-steps';
import { DeleteAllFirebaseTokensSteps } from './firebase-token-delete-all-steps';
import { DatabaseService } from '@module-database';
import { FirebaseTokenRepository } from '@module-persistence';

export class FirebaseTokenSteps {
  private readonly createSteps: CreateFirebaseTokenSteps;
  private readonly deleteSteps: DeleteFirebaseTokenSteps;
  private readonly deleteAllSteps: DeleteAllFirebaseTokensSteps;

  constructor(readonly appManager: StepsInput) {
    this.createSteps = new CreateFirebaseTokenSteps(appManager);
    this.deleteSteps = new DeleteFirebaseTokenSteps(appManager);
    this.deleteAllSteps = new DeleteAllFirebaseTokensSteps(appManager);
  }

  async getAllTokens(userId: string) {
    const { app } = this.appManager;
    const databaseService = app.get(DatabaseService);
    const firebaseTokenRepository = app.get(FirebaseTokenRepository);
    const firebaseTokens = await databaseService.withRequestContext(
      async () => {
        return await firebaseTokenRepository.findAll({
          user: { id: userId },
        });
      },
    );

    return firebaseTokens[0];
  }

  async getUserTokenByToken(token: string, userId: string) {
    const { app } = this.appManager;
    const databaseService = app.get(DatabaseService);
    const firebaseTokenRepository = app.get(FirebaseTokenRepository);
    const firebaseToken = await databaseService.withRequestContext(async () => {
      return await firebaseTokenRepository.findOneByToken(token, userId);
    });

    return firebaseToken;
  }

  create(request: CreateFirebaseTokenRequest) {
    return this.createSteps.create(request);
  }

  delete(token: string) {
    return this.deleteSteps.delete(token);
  }

  deleteAll() {
    return this.deleteAllSteps.deleteAll();
  }
}
