/**
 * OpenAI API Test Endpoint
 * 測試 Vercel 環境中的 OpenAI API 連接
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Type definitions for OpenAI diagnostics
interface ApiKeyInfo {
  present: boolean;
  length: number;
  prefix: string;
  suffix: string;
  startsWithSK: boolean;
}

interface EnvironmentInfo {
  NODE_ENV?: string;
  VERCEL?: string;
  VERCEL_ENV?: string;
  VERCEL_REGION?: string;
  VERCEL_URL?: string;
}

interface TestResult {
  success: boolean;
  responseTime?: number;
  response?: string;
  tokensUsed?: number;
  modelCount?: number;
  sampleModels?: string[];
  error?: string;
  code?: number;
  type?: string;
}

interface DiagnosticsInfo {
  timestamp: string;
  environment: EnvironmentInfo;
  apiKey: ApiKeyInfo;
  tests: Record<string, TestResult>;
  recommendations?: string[];
}

interface OpenAIError extends Error {
  response?: {
    status: number;
    statusText?: string;
    data?: unknown;
  };
  constructor: {
    name: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    const diagnostics: DiagnosticsInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV,
        VERCEL_REGION: process.env.VERCEL_REGION,
        VERCEL_URL: process.env.VERCEL_URL,
      },
      apiKey: {
        present: !!apiKey,
        length: apiKey?.length || 0,
        prefix: apiKey?.substring(0, 10) || 'missing',
        suffix: apiKey?.substring(apiKey?.length - 4) || 'missing',
        startsWithSK: apiKey?.startsWith('sk-') || false,
      },
      tests: {},
    };

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'OPENAI_API_KEY not configured',
        diagnostics,
      }, { status: 500 });
    }

    // Initialize OpenAI client
    const openai = new OpenAI({ 
      apiKey,
      maxRetries: 1,
      timeout: 15000,
    });

    // Test 1: Simple completion with gpt-3.5-turbo
    try {
      const startTime = Date.now();
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a test assistant.' },
          { role: 'user', content: 'Reply with OK' }
        ],
        max_tokens: 10,
        temperature: 0,
      });

      diagnostics.tests['gpt-3.5-turbo'] = {
        success: true,
        responseTime: Date.now() - startTime,
        response: completion.choices[0]?.message?.content?.trim(),
        tokensUsed: completion.usage?.total_tokens,
      };
    } catch (error: unknown) {
      const openaiError = error as OpenAIError;
      diagnostics.tests['gpt-3.5-turbo'] = {
        success: false,
        error: openaiError.message || 'Unknown error',
        code: openaiError.response?.status,
        type: openaiError.constructor?.name,
      };
    }

    // Test 2: Try gpt-4o-mini
    try {
      const startTime = Date.now();
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a test assistant.' },
          { role: 'user', content: 'Reply with OK' }
        ],
        max_tokens: 10,
        temperature: 0,
      });

      diagnostics.tests['gpt-4o-mini'] = {
        success: true,
        responseTime: Date.now() - startTime,
        response: completion.choices[0]?.message?.content?.trim(),
        tokensUsed: completion.usage?.total_tokens,
      };
    } catch (error: unknown) {
      const openaiError = error as OpenAIError;
      diagnostics.tests['gpt-4o-mini'] = {
        success: false,
        error: openaiError.message || 'Unknown error',
        code: openaiError.response?.status,
        type: openaiError.constructor?.name,
      };
    }

    // Test 3: List models (validate API key)
    try {
      const startTime = Date.now();
      const models = await openai.models.list();
      const modelArray = models.data;
      
      diagnostics.tests.listModels = {
        success: true,
        responseTime: Date.now() - startTime,
        modelCount: modelArray.length,
        sampleModels: modelArray.slice(0, 3).map((m: OpenAI.Model) => m.id),
      };
    } catch (error: unknown) {
      const openaiError = error as OpenAIError;
      diagnostics.tests.listModels = {
        success: false,
        error: openaiError.message || 'Unknown error',
        code: openaiError.response?.status,
        type: openaiError.constructor?.name,
      };
    }

    // Determine overall success
    const anyTestSucceeded = Object.values(diagnostics.tests).some((test: TestResult) => test.success);
    
    // Add recommendations
    diagnostics.recommendations = [];
    
    if (!anyTestSucceeded) {
      if (diagnostics.tests['gpt-3.5-turbo']?.error?.includes('Connection')) {
        diagnostics.recommendations.push('Network issue detected. OpenAI API may be blocked from this Vercel region.');
        diagnostics.recommendations.push('Try changing Vercel deployment region in vercel.json');
      }
      if (diagnostics.tests['gpt-3.5-turbo']?.code === 401) {
        diagnostics.recommendations.push('Invalid API key. Check OPENAI_API_KEY in Vercel dashboard.');
      }
      if (diagnostics.tests['gpt-3.5-turbo']?.code === 429) {
        diagnostics.recommendations.push('Rate limit or quota exceeded. Check OpenAI usage dashboard.');
      }
    }

    return NextResponse.json({
      success: anyTestSucceeded,
      message: anyTestSucceeded ? 'OpenAI API connection successful' : 'All tests failed',
      diagnostics,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      success: false,
      error: `Test endpoint error: ${errorMessage}`,
      diagnostics: {
        timestamp: new Date().toISOString(),
        error: errorMessage,
      },
    }, { status: 500 });
  }
}