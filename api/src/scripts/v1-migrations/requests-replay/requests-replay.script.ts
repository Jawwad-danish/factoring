import { DatabaseService } from '@module-database';
import {
  RequestMethod,
  RequestStorageEntity,
  RequestStorageRepository,
} from '@module-persistence';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../modules/app/app.module';
import { FileReport, run } from '../../util';
import axios from 'axios';
import { AuthTokenService, UserTokenService } from '@module-auth';

const report = new FileReport('database-requests');
const replayRequestsAgainstDb = async () => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const databaseService = app.get(DatabaseService);
  const requestsRepository = app.get(RequestStorageRepository);
  const tokenService = app.get(UserTokenService);
  await databaseService.withRequestContext(
    async () => await replayRequests(requestsRepository, tokenService),
  );
};

async function replayRequests(
  requestsRepository: RequestStorageRepository,
  tokenService: AuthTokenService,
): Promise<void> {
  const startIndex = 0;
  const [requests] = await requestsRepository.findAll(
    {
      id: { $gte: startIndex },
    },
    {
      orderBy: {
        createdAt: 'ASC',
      },
    },
  );
  for (const request of requests) {
    await runRequest(request, tokenService);
  }
}

async function runRequest(
  request: RequestStorageEntity,
  tokenService: AuthTokenService,
) {
  const axiosMethod = mapRequestMethodToAxios(request);

  const url = new URL(request.route, 'http://localhost:4000').toString();
  let token = await tokenService.getAccessToken();
  if (!token.startsWith('Bearer ')) {
    token = `Bearer ${token}`;
  }
  try {
    console.log(`Sending request with ID`, request.id);
    return await axiosMethod(url, request.payload, {
      headers: {
        'Content-Type': 'application/json',
        'Skip-Storage': 'true',
        authorization: token,
      },
    });
  } catch (error) {
    console.error(`Error on request with ID ${request.id}`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      response: error.response?.data,
    });
    if (
      request.method === RequestMethod.Delete &&
      request.route.includes('activity')
    ) {
      console.debug(
        'Continuing because delete activity may be on an activity not imported',
      );
      return null;
    }
    if (error.response?.status === 404) {
      console.debug('Continuing because not found');
      return null;
    }
    throw error;
  }
}

function mapRequestMethodToAxios(request: RequestStorageEntity) {
  switch (request.method) {
    case RequestMethod.Post:
      return axios.post;
    case RequestMethod.Put:
      return axios.put;
    case RequestMethod.Patch:
      return axios.patch;
    case RequestMethod.Delete:
      return axios.delete;
    default:
      console.warn('mapRequestMethodToAxios defaulted to null.');
      return () => null;
  }
}

run(replayRequestsAgainstDb, report, __dirname, {
  logError: false,
});
