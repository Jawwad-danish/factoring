import { Authentication, Authority, Principal } from '@core/app-context';
import { Permissions } from '@module-common';
import { AuthorizationManager } from './authorization-manager';

describe('AuthorizationManager', () => {
  const manager = new AuthorizationManager();
  beforeAll(() => {});
  it('Superuser has access to anything', async () => {
    const user = new Authentication(
      new Principal('1', 'superuser@bobtail.com'),
      new Authority([Permissions.SuperUser]),
    );
    const requiredPermissions = ['delete-database'];
    const result = manager.hasRequiredPermissions(user, requiredPermissions);
    expect(result).toStrictEqual(true);
  });

  it('Regular user with all required permissions has access', async () => {
    const user = new Authentication(
      new Principal('1', 'client@company.com'),
      new Authority([
        'view-invoice',
        'view-invoice-details',
        'some-other-permission',
      ]),
    );
    const requiredPermissions = ['view-invoice', 'view-invoice-details'];
    const result = manager.hasRequiredPermissions(user, requiredPermissions);
    expect(result).toStrictEqual(true);
  });

  it('Regular user with partial permissions does not have access', async () => {
    const user = new Authentication(
      new Principal('1', 'client@company.com'),
      new Authority(['view-invoice', 'some-other-permission']),
    );
    const requiredPermissions = ['view-invoice', 'view-invoice-details'];
    const result = manager.hasRequiredPermissions(user, requiredPermissions);
    expect(result).toStrictEqual(false);
  });

  it('No required permissions gives access', async () => {
    const user = new Authentication(
      new Principal('1', 'client@company.com'),
      new Authority(['view-invoice', 'some-other-permission']),
    );
    const requiredPermissions = [];
    const result = manager.hasRequiredPermissions(user, requiredPermissions);
    expect(result).toStrictEqual(true);
  });
});
