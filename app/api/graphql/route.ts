/**
 * GraphQL API Route Handler
 * Next.js App Router endpoint for GraphQL
 */

import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { getApolloServer, createGraphQLContext } from '@/lib/graphql/server';
import { NextRequest } from 'next/server';

// Create the handler
const handler = startServerAndCreateNextHandler(await getApolloServer(), {
  context: async (req: NextRequest) => createGraphQLContext(req),
});

// Export handlers for different HTTP methods
export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  return handler(request);
}

// Enable CORS for GraphQL endpoint
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';