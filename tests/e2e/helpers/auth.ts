/**
 * E2E Authentication Helper
 * Provides authentication utilities for Playwright tests
 */

import { Page } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  role: string;
}

export const testUsers = {
  admin: {
    email: process.env.SYS_LOGIN || 'test@example.com',
    password: process.env.SYS_PASSWORD || 'password',
    role: 'ADMIN',
  },
  viewer: {
    email: 'viewer@example.com',
    password: 'password',
    role: 'VIEWER',
  },
};

export async function loginUser(page: Page, user: TestUser) {
  await page.goto('/auth/signin');
  await page.fill('#email', user.email);
  await page.fill('#password', user.password);
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
}

export async function logoutUser(page: Page) {
  await page.click('[data-testid="user-menu"]');
  await page.click('[data-testid="logout-button"]');
  await page.waitForNavigation();
}

export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    await page.waitForSelector('[data-testid="user-menu"]', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

// Convenience function for logging in with default admin user
export async function login(page: Page) {
  return loginUser(page, testUsers.admin);
}
