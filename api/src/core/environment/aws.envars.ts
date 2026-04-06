export const defaultRegion = (): string => {
  if (!process.env.AWS_DEFAULT_REGION) {
    return 'us-east-1';
  }
  return process.env.AWS_DEFAULT_REGION;
};

export const defaultEndpoint = (service: string): string => {
  if (!process.env.AWS_DEFAULT_ENDPOINT) {
    return `https://${service}.${defaultRegion()}.amazonaws.com`;
  }
  return process.env.AWS_DEFAULT_ENDPOINT;
};
