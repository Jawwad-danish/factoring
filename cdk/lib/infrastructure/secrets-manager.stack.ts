import { App, Stack, StackProps } from 'aws-cdk-lib';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { EnvProps } from '../cdk.config';

export interface SecretsManagerProps extends StackProps {
  envProps: EnvProps;
}

export class SecretsManagerStack extends Stack {
  public readonly filestackSecret;
  public readonly referralRockSecret;
  public readonly convertapiSecret;
  public readonly auth0Secret;
  public readonly auth0M2MSecret;
  public readonly cognitoSecret;
  public readonly modernTreasurySecret;
  public readonly slackSecret;
  public readonly segmentSecret;
  public readonly peruseSecret;
  public readonly launchDarklySecret;
  public readonly twilioSecret;
  public readonly firebaseSecret;
  public readonly quickbooksSecret;
  public readonly encryptionSecret;

  constructor(scope: App, id: string, props: SecretsManagerProps) {
    super(scope, id, props);

    this.filestackSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      'FilestackSecret',
      'Filestack',
    );
    this.referralRockSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      `${props.envProps.shortName}-ReferralRockSecret`,
      `${props.envProps.shortName}-ReferralRock`,
    );
    this.convertapiSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      'ConvertapiSecret',
      'Convertapi',
    );
    this.auth0Secret = secretsmanager.Secret.fromSecretNameV2(
      this,
      `${props.envProps.shortName}-Auth0Secret`,
      `${props.envProps.shortName}-Auth0`,
    );

    this.auth0M2MSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      `${props.envProps.shortName}-Auth0M2MSecret`,
      `${props.envProps.shortName}-Auth0M2M`,
    );
    this.cognitoSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      `${props.envProps.shortName}-CognitoSecret`,
      `${props.envProps.shortName}-Cognito`,
    );

    this.modernTreasurySecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      `${props.envProps.shortName}-ModernTreasurySecret`,
      `${props.envProps.shortName}-ModernTreasury`,
    );

    this.slackSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      `${props.envProps.shortName}-SlackSecret`,
      `${props.envProps.shortName}-Slack`,
    );

    this.segmentSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      `${props.envProps.shortName}-SegmentSecret`,
      `${props.envProps.shortName}-Segment`,
    );

    this.peruseSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      `${props.envProps.shortName}-PeruseSecret`,
      `${props.envProps.shortName}-Peruse`,
    );
    this.launchDarklySecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      `${props.envProps.shortName}-LaunchDarklySecret`,
      `${props.envProps.shortName}-LaunchDarkly`,
    );
    this.twilioSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      `${props.envProps.shortName}-TwilioSecret`,
      `${props.envProps.shortName}-Twilio`,
    );

    this.firebaseSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      `${props.envProps.shortName}-FirebaseSecret`,
      `${props.envProps.shortName}-Firebase`,
    );
    this.quickbooksSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      `${props.envProps.shortName}-QuickbooksSecret`,
      `${props.envProps.shortName}-Quickbooks`,
    );
    this.encryptionSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      `${props.envProps.shortName}-EncryptionSecret`,
      `${props.envProps.shortName}-Encryption`,
    );
  }
}
