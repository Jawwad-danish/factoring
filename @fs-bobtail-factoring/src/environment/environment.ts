export class Environment {
  static isProduction() {
    return process.env.NODE_ENV === "production";
  }

  static isTest() {
    return process.env.NODE_ENV === "test";
  }

  static isDevelopment() {
    return process.env.NODE_ENV === "development";
  }

  static isLocal() {
    return process.env.NODE_ENV === "local";
  }

  static isStaging() {
    return process.env.NODE_ENV === "staging";
  }

  static isLambdaContext() {
    return process.env["AWS_LAMBDA_FUNCTION_NAME"] ? true : false;
  }
}
