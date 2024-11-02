import dotenv from "dotenv";

dotenv.config();

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;

  if (value === undefined) {
    throw new Error(`Enviroment variable ${key} is missing`);
  }

  return value;
};

export const MONGODB_URL = getEnv("MONGODB_URL");
export const NODE_ENV = getEnv("NODE_ENV", "development");
export const PORT = getEnv("PORT", "4004");
export const APP_ORIGIN = getEnv("APP_ORIGIN");
export const JWT_SECRET = getEnv("JWT_SECRET");
export const JWT_REFRESH_SECRET = getEnv("JWT_REFRESH_SECRET");
export const GMAIL_SECRET = getEnv("GMAIL_SECRET");
export const BASE_URL = getEnv("BASE_URL");
