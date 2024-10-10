function getEnvVariable(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
}

export const SERVER_PORT: number = parseInt(getEnvVariable("PORT", "4000"), 10);
export const ENVIRONMENT: string = getEnvVariable("NODE_ENV", "development");
