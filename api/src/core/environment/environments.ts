enum Environments {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
  Local = 'local',
  Test = 'test',
}

export const isLocal = () => {
  return process.env.NODE_ENV === Environments.Local;
};

export const isTest = () => {
  //only for testing purpose with jest
  return process.env.NODE_ENV === Environments.Test;
};

export const isDevelopment = () => {
  return process.env.NODE_ENV === Environments.Development;
};

export const isStaging = () => {
  return process.env.NODE_ENV === Environments.Staging;
};

export const isProduction = () => {
  return process.env.NODE_ENV === Environments.Production;
};

export const isLambdaContext = () => {
  return process.env['AWS_LAMBDA_FUNCTION_NAME'] ? true : false;
};
