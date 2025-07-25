/**
 * E2E GraphQL Helper
 * Provides GraphQL testing utilities for Playwright tests
 */

import { Page } from '@playwright/test';

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{ message: string; path?: string[] }>;
}

export interface GraphQLRequest {
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
}

export async function waitForGraphQLResponse(
  page: Page,
  operationName: string,
  timeout = 10000
): Promise<GraphQLResponse> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`GraphQL operation ${operationName} timed out after ${timeout}ms`));
    }, timeout);

    page.on('response', async response => {
      if (response.url().includes('/api/graphql')) {
        try {
          const body = await response.json();
          if (body?.data || body?.errors) {
            clearTimeout(timeoutId);
            resolve(body);
          }
        } catch (error) {
          // Not a GraphQL response, continue listening
        }
      }
    });
  });
}

export async function interceptGraphQL(
  page: Page,
  operationName: string,
  mockResponse: GraphQLResponse
) {
  await page.route('/api/graphql', async route => {
    const request = route.request();
    const postData = request.postData();

    if (postData?.includes(operationName)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse),
      });
    } else {
      await route.continue();
    }
  });
}

export function createMockGraphQLResponse<T>(
  data: T,
  errors?: Array<{ message: string; path?: string[] }>
): GraphQLResponse<T> {
  return { data, errors };
}

// Alias for backward compatibility
export const waitForGraphQL = waitForGraphQLResponse;
