/**
 * Security Monitoring API Endpoint
 * Provides security metrics and reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { securityMonitor } from '@/lib/security/production-monitor';

export async function GET(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'metrics':
        // Get current security metrics
        const metrics = securityMonitor.getMetrics();
        return NextResponse.json(metrics);

      case 'report':
        // Generate security report
        const startDate = searchParams.get('start');
        const endDate = searchParams.get('end');

        if (!startDate || !endDate) {
          return NextResponse.json({ error: 'Start and end dates required' }, { status: 400 });
        }

        const report = securityMonitor.exportReport(new Date(startDate), new Date(endDate));

        return NextResponse.json(report);

      case 'health':
        // Get security system health
        const health = {
          status: 'operational',
          timestamp: new Date().toISOString(),
          metrics: securityMonitor.getMetrics(),
        };

        return NextResponse.json(health);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Security monitor API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'log-event':
        // Manually log a security event
        const { event } = body;
        if (!event) {
          return NextResponse.json({ error: 'Event data required' }, { status: 400 });
        }

        securityMonitor.logEvent(event);

        return NextResponse.json({ success: true });

      case 'check-threat':
        // Check for threats in provided data
        const { request: requestData } = body;
        if (!requestData) {
          return NextResponse.json({ error: 'Request data required' }, { status: 400 });
        }

        const threats = securityMonitor.detectThreats(requestData);

        return NextResponse.json({ threats });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Security monitor API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
