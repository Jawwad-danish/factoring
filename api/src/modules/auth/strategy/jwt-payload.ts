export interface JWTPayload {
  /** AWS Cognito access token for the user to access factoring */
  cognitoAccessToken: string;
  /** Issuer (who created and signed this token) */
  iss: string;
  /** Subject (whom the token refers to) */
  sub: string;
  /** Email (Email of the user) */
  email: string;
  /** Audience (who or what the token is intended for) */
  aud: string[];
  /** Issued at (seconds since Unix epoch) */
  iat: number;
  /** Expiration time (seconds since Unix epoch) */
  exp: number;
  /** Authorization party (the party to which this token was issued) */
  azp: string;
  /** Token scope (what the token has access to) */
  scope: string;
  /** User attributes. User can modify these fields */
  user_metadata?: Record<string, string>;
  /** User app attributes. User can not modify these fields */
  app_metadata?: Record<string, string>;
  /** User permissions*/
  permissions: string[];
  /** Grant type */
  gty?: string;
}
