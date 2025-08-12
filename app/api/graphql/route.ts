/**
 * GraphQL API Route Handler
 * Next.js App Router endpoint for GraphQL
 */

import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { getApolloServer, createGraphQLContext } from '@/lib/graphql/server';
import { NextRequest, NextResponse } from 'next/server';

// Use globalThis to persist handler across hot reloads in development
declare global {
  var graphqlHandler: ReturnType<typeof startServerAndCreateNextHandler> | undefined;
  var graphqlHandlerPromise: Promise<ReturnType<typeof startServerAndCreateNextHandler>> | undefined;
}

async function getHandler() {
  // Check if handler already exists in global scope
  if (globalThis.graphqlHandler) {
    return globalThis.graphqlHandler;
  }

  // If promise exists, wait for it
  if (globalThis.graphqlHandlerPromise) {
    return await globalThis.graphqlHandlerPromise;
  }

  // Create new handler
  globalThis.graphqlHandlerPromise = (async () => {
    try {
      const server = await getApolloServer();
      const handler = startServerAndCreateNextHandler(server, {
        context: async (req: NextRequest) => createGraphQLContext(req),
      });
      
      // Store the handler globally
      globalThis.graphqlHandler = handler;
      
      return handler;
    } catch (error) {
      // Clear the promise on error so it can be retried
      globalThis.graphqlHandlerPromise = undefined;
      throw error;
    }
  })();

  return await globalThis.graphqlHandlerPromise;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Export handlers for different HTTP methods
export async function GET(request: NextRequest) {
  try {
    const h = await getHandler();
    const response = await h(request);
    
    // Add CORS headers to response
    const headers = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });
    
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    console.error('[GraphQL GET] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if request has body
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('[GraphQL POST] Non-JSON content type:', contentType);
    }
    
    // Clone request to check body
    const clonedRequest = request.clone();
    const body = await clonedRequest.text();
    
    if (!body || body.trim() === '') {
      console.error('[GraphQL POST] Empty request body');
      return NextResponse.json(
        { error: 'Bad Request', message: 'Request body is empty' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    const h = await getHandler();
    const response = await h(request);
    
    // Add CORS headers to response
    const headers = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });
    
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    console.error('[GraphQL POST] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// Enable CORS for GraphQL endpoint
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';