import { Injectable } from '@nestjs/common';
import {
  FirebaseTokenEntity,
  FirebaseTokenRepository,
} from '@module-persistence';
import {
  CreateFirebaseTokenRequest,
  DeleteFirebaseTokenRequest,
} from '../data/web';
import { CommandRunner } from '@module-cqrs';
import {
  CreateFirebaseTokenCommand,
  DeleteAllFirebaseTokensCommand,
  DeleteFirebaseTokenCommand,
} from './commands';
import { CrossCuttingConcerns } from '@core/util';
import { Transactional } from '@module-database';
import {
  DeleteAllFirebaseTokenError,
  CreateFirebaseTokenError,
  DeleteFirebaseTokenError,
} from './errors';

@Injectable()
export class FirebaseTokenService {
  constructor(
    private readonly firebaseRepository: FirebaseTokenRepository,
    private readonly commandRunner: CommandRunner,
  ) {}

  @CrossCuttingConcerns({
    error: {
      errorSupplier: (cause, userId: string) =>
        new CreateFirebaseTokenError(userId, cause),
    },
    logging: (userId: string) => {
      return {
        message: 'Create firebase token',
        payload: {
          userId,
        },
      };
    },
  })
  @Transactional('create-firebase-token')
  async create(
    payload: CreateFirebaseTokenRequest,
    userId: string,
  ): Promise<string> {
    return await this.commandRunner.run(
      new CreateFirebaseTokenCommand(userId, payload),
    );
  }

  @CrossCuttingConcerns({
    error: {
      errorSupplier: (cause, token: string) =>
        new DeleteFirebaseTokenError(token, cause),
    },
    logging: (token: string) => {
      return {
        message: 'Delete firebase token',
        payload: {
          token,
        },
      };
    },
  })
  @Transactional('delete-firebase-token')
  async delete(
    token: string,
    userId: string,
    payload: DeleteFirebaseTokenRequest,
  ): Promise<void> {
    await this.commandRunner.run(
      new DeleteFirebaseTokenCommand(token, userId, payload),
    );
  }

  @CrossCuttingConcerns({
    error: {
      errorSupplier: (cause, userId: string) =>
        new DeleteAllFirebaseTokenError(userId, cause),
    },
    logging: (userId: string) => {
      return {
        message: `Delete All firebase tokens`,
        payload: {
          userId,
        },
      };
    },
  })
  @Transactional('delete-all-firebase-tokens')
  async deleteAllTokens(userId: string): Promise<void> {
    await this.commandRunner.run(new DeleteAllFirebaseTokensCommand(userId));
  }

  async getByUserId(userId: string): Promise<FirebaseTokenEntity[]> {
    return this.firebaseRepository.findTokensByUserId(userId);
  }
}
