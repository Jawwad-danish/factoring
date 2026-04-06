import { environment } from '../environment';

export class Principal {
  constructor(readonly id: string, readonly email: string) {}
}

export class Authority {
  constructor(readonly permissions: string[]) {}
}

export class Authentication {
  constructor(readonly principal: Principal, readonly authority: Authority) {}

  static getSystem() {
    const id = environment.core.systemId();
    const email = environment.core.systemEmail();
    return new Authentication(new Principal(id, email), new Authority(['*']));
  }
}
