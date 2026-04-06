export const checkAndGetForEnvVariable = (variable: string): string => {
  if (!process.env[variable]) {
    throw new Error(`Missing ${variable} environment variable`);
  }
  return process.env[variable] as string;
};
