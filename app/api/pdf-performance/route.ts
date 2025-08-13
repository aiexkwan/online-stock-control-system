/**
 * PDF Performance API Route
 * Provides endpoints for performance monitoring and optimization
 */

import { NextRequest, NextResponse } from 'next/server';
import { pdfPerformanceService } from '@/lib/performance/pdf-performance-service';
import { pdfPerformanceMonitor } from '@/lib/performance/pdf-performance-monitor';
import { pdfCacheOptimizer } from '@/lib/performance/pdf-cache-optimizer';
import { systemLogger } from '@/lib/logger';

/**
 * GET /api/pdf-performance
 * Get performance metrics and statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'summary';
    
    switch (type) {
      case 'summary':
        // Get overall performance summary
        const summary = pdfPerformanceService.getPerformanceReport();
        return NextResponse.json({
          success: true,
          data: summary,
          timestamp: new Date().toISOString()
        });
        
      case 'metrics':
        // Get detailed metrics
        const metrics = pdfPerformanceMonitor.getMetrics();
        return NextResponse.json({
          success: true,
          data: metrics,
          timestamp: new Date().toISOString()
        });
        
      case 'cache':
        // Get cache statistics
        const cacheStats = pdfCacheOptimizer.getStatistics();
        const cacheSummary = pdfCacheOptimizer.getCacheSummary();
        return NextResponse.json({
          success: true,
          data: {
            statistics: cacheStats,
            summary: cacheSummary
          },
          timestamp: new Date().toISOString()
        });
        
      case 'history':
        // Get request history
        const limit = parseInt(searchParams.get('limit') || '100');
        const history = pdfPerformanceMonitor.getRequestHistory(limit);
        return NextResponse.json({
          success: true,
          data: history,
          count: history.length,
          timestamp: new Date().toISOString()
        });
        
      case 'export':
        // Export all performance data
        const exportData = pdfPerformanceService.exportPerformanceData();
        return NextResponse.json({
          success: true,
          data: exportData,
          timestamp: new Date().toISOString()
        });
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid type parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    systemLogger.error({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, '[PDF Performance API] GET request failed');
    
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve performance data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pdf-performance
 * Process PDF with performance optimization
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = (formData.get('fileName') as string) || file?.name;
    const priority = (formData.get('priority') as string) || 'normal';
    const skipCache = formData.get('skipCache') === 'true';
    const skipBatching = formData.get('skipBatching') === 'true';
    
    if (!file || !fileName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: file or fileName' },
        { status: 400 }
      );
    }
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    
    // Process with performance optimization
    const result = await pdfPerformanceService.extractPDF(
      fileBuffer,
      fileName,
      {
        priority: priority as 'high' | 'normal' | 'low',
        skipCache,
        skipBatching
      }
    );
    
    // Log performance metrics
    systemLogger.info({
      requestId: result.requestId,
      fileName,
      responseTime: result.performance.responseTime,
      cacheHit: result.performance.cacheHit,
      tokensUsed: result.performance.tokensUsed,
      cost: result.performance.cost,
      batchProcessed: result.performance.batchProcessed,
    }, '[PDF Performance API] PDF processed successfully');
    
    return NextResponse.json({
      success: true,
      data: {
        requestId: result.requestId,
        extractedData: result.extractedData,
        orderData: result.orderData,
        performance: result.performance,
        metadata: result.metadata
      },
      processingTime: Date.now() - startTime
    });
    
  } catch (error) {
    systemLogger.error({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, '[PDF Performance API] POST request failed');
    
    return NextResponse.json(
      { success: false, error: 'PDF processing failed' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/pdf-performance
 * Update performance configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const config = await request.json();
    
    // Validate configuration
    if (!config || typeof config !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid configuration' },
        { status: 400 }
      );
    }
    
    // Update configuration
    pdfPerformanceService.updateConfig(config);
    
    // Get updated configuration
    const updatedConfig = pdfPerformanceService.getConfig();
    
    systemLogger.info({
      config: updatedConfig,
    }, '[PDF Performance API] Configuration updated');
    
    return NextResponse.json({
      success: true,
      data: updatedConfig,
      message: 'Configuration updated successfully'
    });
    
  } catch (error) {
    systemLogger.error({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, '[PDF Performance API] PUT request failed');
    
    return NextResponse.json(
      { success: false, error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/pdf-performance
 * Clear caches and reset metrics
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'cache';
    
    switch (action) {
      case 'cache':
        // Clear cache only
        pdfCacheOptimizer.clear();
        systemLogger.info('[PDF Performance API] Cache cleared');
        return NextResponse.json({
          success: true,
          message: 'Cache cleared successfully'
        });
        
      case 'metrics':
        // Reset metrics only
        pdfPerformanceMonitor.resetMetrics();
        systemLogger.info('[PDF Performance API] Metrics reset');
        return NextResponse.json({
          success: true,
          message: 'Metrics reset successfully'
        });
        
      case 'all':
        // Clear everything
        pdfPerformanceService.clearAll();
        systemLogger.info('[PDF Performance API] All data cleared');
        return NextResponse.json({
          success: true,
          message: 'All caches and metrics cleared successfully'
        });
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    systemLogger.error({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, '[PDF Performance API] DELETE request failed');
    
    return NextResponse.json(
      { success: false, error: 'Failed to clear data' },
      { status: 500 }
    );
  }
}