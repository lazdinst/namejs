function getEnvVariable(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
}

const config = {
  port: parseInt(getEnvVariable("PORT", "4000"), 10),
  environment: getEnvVariable("NODE_ENV", "development"),
};

export default config;
