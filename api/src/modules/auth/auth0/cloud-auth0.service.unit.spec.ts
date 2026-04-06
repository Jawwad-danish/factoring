import { CloudAuth0Service } from './cloud-auth0.service';
import { Auth0Error } from './auth0.error';

describe('CloudAuth0Service', () => {
  let service: CloudAuth0Service;
  let mockAuthClient: any;
  let mockManagementClient: any;

  beforeEach(() => {
    mockAuthClient = {
      requestChangePasswordEmail: jest.fn(),
      refreshToken: jest.fn(),
      clientCredentialsGrant: jest.fn(),
    };

    mockManagementClient = {
      getUsersByEmail: jest.fn(),
      updateUser: jest.fn(),
    };

    service = Reflect.construct(CloudAuth0Service, [
      mockAuthClient,
      mockManagementClient,
      'test-audience',
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requestChangePasswordEmail', () => {
    it('should successfully request password change email', async () => {
      const email = 'test@example.com';
      const mockResult = { success: true };

      mockAuthClient.requestChangePasswordEmail.mockResolvedValue(mockResult);

      await service.requestChangePasswordEmail(email);

      expect(mockAuthClient.requestChangePasswordEmail).toHaveBeenCalledWith({
        email,
        connection: 'Username-Password-Authentication',
      });
    });

    it('should throw Auth0Error with correct details when request fails', async () => {
      const email = 'test@example.com';
      const mockError = new Error('Auth0 API error');

      mockAuthClient.requestChangePasswordEmail.mockRejectedValue(mockError);

      try {
        await service.requestChangePasswordEmail(email);
        fail('Should have thrown Auth0Error');
      } catch (error) {
        expect(error).toBeInstanceOf(Auth0Error);
        expect(error.id).toBe('auth0-reset-password');
        expect(error.message).toBe('Could not send password reset email');
      }

      expect(mockAuthClient.requestChangePasswordEmail).toHaveBeenCalledWith({
        email,
        connection: 'Username-Password-Authentication',
      });
    });
  });
});
