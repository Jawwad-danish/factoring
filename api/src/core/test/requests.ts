import supertest from 'supertest';
import { environment } from '@core/environment';

type SuperAgentProps = keyof supertest.SuperAgentTest;
const supertestProxyTrap = {
  get:
    (target: supertest.SuperTest<supertest.Test>, property: SuperAgentProps) =>
    (...args: any[]) => {
      // Headers can be set only after HTTP methods
      if (
        typeof property === 'string' &&
        ['get', 'patch', 'post', 'put', 'delete'].includes(property)
      ) {
        return target[property](...args).set({
          'Content-type': 'application/json',
          Authorization: environment.util.checkAndGetForEnvVariable(
            'TESTING_AUTHORIZATION_TOKEN',
          ),
          'Skip-Storage': 'true',
        });
      }
      return target[property](...args);
    },
};

export const testingRequest = (app: any): supertest.SuperTest<supertest.Test> =>
  new Proxy(supertest(app), supertestProxyTrap);
