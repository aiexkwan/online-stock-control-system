/**
 * Environment utility functions
 */

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}

export function isNotProduction(): boolean {
  return (process.env.NODE_ENV as string) !== 'production';
}

export function getNodeEnv(): string {
  return process.env.NODE_ENV || 'development';
}