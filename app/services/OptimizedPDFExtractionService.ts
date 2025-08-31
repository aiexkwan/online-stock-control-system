/**
 * Optimized PDF Extraction Service
 * Performance-focused implementation with advanced caching and token optimization
 * Target: < 5 seconds processing time, < 2000 tokens per request
 */

import * as crypto from 'crypto';
import OpenAI from 'openai';
import { EnhancedPDFCache } from '../../lib/cache/EnhancedPDFCache';
import { systemLogger } from '../../lib/logger';
import { PDFExtractionService, ExtractedPDFData } from './pdfExtractionService';

// Performance metrics tracking
interface PerformanceMetrics {
  extractionTime: number;
  llmTime: number;
  cacheHit: boolean;
  tokensUsed: number;
  totalTime: number;
  method: 'cache' | 'optimized-llm' | 'chunked' | 'fallback';
}

// Optimized result structure
interface OptimizedExtractionResult {
  success: boolean;
  data?: {
    order_ref: string;
    products: Array<{
      product_code: string;
      product_desc: string;
      product_qty: number;
      unit_price?: string;
    }>;
    metadata?: {
      account_num?: string;
      delivery_add?: string;
    };
  };
  metrics: PerformanceMetrics;
  error?: string;
}

// Token estimation utilities
class TokenEstimator {
  // Average: 1 token ≈ 4 characters for English text
  private static readonly CHARS_PER_TOKEN = 4;

  static estimate(text: string): number {
    return Math.ceil(text.length / this.CHARS_PER_TOKEN);
  }

  static truncateToTokenLimit(text: string, maxTokens: number): string {
    const maxChars = maxTokens * this.CHARS_PER_TOKEN;
    if (text.length <= maxChars) return text;

    // Smart truncation - try to keep complete sections
    const truncated = text.substring(0, maxChars);
    const lastCompleteSection = truncated.lastIndexOf('\n===');

    if (lastCompleteSection > maxChars * 0.8) {
      return truncated.substring(0, lastCompleteSection);
    }

    return truncated;
  }
}

export class OptimizedPDFExtractionService {
  private static instance: OptimizedPDFExtractionService;
  private pdfService: PDFExtractionService;
  private openai: OpenAI;
  private cache: EnhancedPDFCache<OptimizedExtractionResult['data']>;

  // Performance configuration
  private readonly _config = {
    maxTokensPerRequest: 1500, // Reduced from 8192
    maxResponseTokens: 1000, // Reduced from 4096
    temperature: 0.0, // Deterministic for caching
    cacheEnabled: true,
    smartChunking: true,
    parallelProcessing: true,
    maxRetries: 2,
    timeoutMs: 5000, // 5 second timeout
  };

  // Rate limiting
  private rateLimiter = {
    requestsPerMinute: 20,
    requestQueue: [] as number[],
    lastRequestTime: 0,
    minRequestInterval: 100, // 100ms between requests
  };

  private constructor() {
    this.pdfService = PDFExtractionService.getInstance();

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    this.openai = new OpenAI({
      apiKey,
      timeout: this._config.timeoutMs,
      maxRetries: 2,
    });

    // Initialize cache with optimized settings
    this.cache = new EnhancedPDFCache({
      maxSize: 100 * 1024 * 1024, // 100MB
      maxEntries: 500, // More entries for better hit rate
      defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
    });
  }

  public static getInstance(): OptimizedPDFExtractionService {
    if (!OptimizedPDFExtractionService.instance) {
      OptimizedPDFExtractionService.instance = new OptimizedPDFExtractionService();
    }
    return OptimizedPDFExtractionService.instance;
  }

  /**
   * Main extraction method with performance optimizations
   */
  public async extractFromPDF(
    fileBuffer: ArrayBuffer,
    fileName: string
  ): Promise<OptimizedExtractionResult> {
    const _startTime = Date.now();
    const metrics: PerformanceMetrics = {
      extractionTime: 0,
      llmTime: 0,
      cacheHit: false,
      tokensUsed: 0,
      totalTime: 0,
      method: 'optimized-llm',
    };

    try {
      // Step 1: Generate content hash for cache lookup
      const contentHash = this.generateContentHash(fileBuffer);

      // Step 2: Check cache first
      if (this._config.cacheEnabled) {
        const cached = this.cache.get(contentHash);
        if (cached) {
          metrics.cacheHit = true;
          metrics.method = 'cache';
          metrics.totalTime = Date.now() - _startTime;

          systemLogger.info(
            {
              fileName,
              cacheHit: true,
              processingTime: metrics.totalTime,
            },
            '[OptimizedPDFExtraction] Cache hit'
          );

          return {
            success: true,
            data: cached,
            metrics,
          };
        }
      }

      // Step 3: Extract PDF text
      const extractionStart = Date.now();
      const extractedData = await this.pdfService.extractText(fileBuffer);
      metrics.extractionTime = Date.now() - extractionStart;

      // Step 4: Quick validation - fail fast if invalid
      const validation = this.pdfService.validateExtractedText(extractedData.text);
      if (!validation.isValid) {
        throw new Error(`Invalid PDF: missing ${validation.missingElements.join(', ')}`);
      }

      // Step 5: Extract with optimized LLM call
      const llmStart = Date.now();
      const result = await this.extractWithOptimizedLLM(extractedData, fileName);
      metrics.llmTime = Date.now() - llmStart;
      metrics.tokensUsed = result.tokensUsed || 0;

      // Step 6: Cache the result
      if (this._config.cacheEnabled && result.data) {
        this.cache.set(contentHash, result.data, fileBuffer);
      }

      metrics.totalTime = Date.now() - _startTime;

      systemLogger.info(
        {
          fileName,
          success: true,
          productsFound: result.data?.products.length || 0,
          metrics,
        },
        '[OptimizedPDFExtraction] Extraction completed'
      );

      return {
        success: true,
        data: result.data,
        metrics,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      metrics.totalTime = Date.now() - _startTime;

      systemLogger.error(
        {
          fileName,
          error: errorMessage,
          metrics,
        },
        '[OptimizedPDFExtraction] Extraction failed'
      );

      return {
        success: false,
        metrics,
        error: errorMessage,
      };
    }
  }

  /**
   * Optimized LLM extraction with token management
   */
  private async extractWithOptimizedLLM(
    extractedData: ExtractedPDFData,
    fileName: string
  ): Promise<{ data?: OptimizedExtractionResult['data']; tokensUsed: number }> {
    // Prepare optimized prompt
    const optimizedText = this.optimizeTextForLLM(extractedData);

    // Check if we need chunking
    const estimatedTokens = TokenEstimator.estimate(optimizedText);

    if (estimatedTokens > this._config.maxTokensPerRequest && this._config.smartChunking) {
      return await this.extractWithChunking(extractedData);
    }

    // Rate limiting
    await this.enforceRateLimit();

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini', // Use faster, cheaper model
        messages: [
          {
            role: 'system',
            content: this.getOptimizedSystemPrompt(),
          },
          {
            role: 'user',
            content: optimizedText,
          },
        ],
        temperature: this._config.temperature,
        max_tokens: this._config.maxResponseTokens,
        response_format: { type: 'json_object' },
        seed: 42, // For reproducibility
      });

      const responseText = completion.choices[0]?.message?.content || '{}';
      const tokensUsed = completion.usage?.total_tokens || 0;

      const parsed = JSON.parse(responseText);

      return {
        data: this.normalizeResponse(parsed),
        tokensUsed,
      };
    } catch (error) {
      if (this.isRateLimitError(error)) {
        // Retry with exponential backoff
        await this.handleRateLimit(error instanceof Error ? error : new Error('Rate limit error'));
        return this.extractWithOptimizedLLM(extractedData, fileName);
      }
      throw error;
    }
  }

  /**
   * Smart chunking for large PDFs
   */
  private async extractWithChunking(
    extractedData: ExtractedPDFData
  ): Promise<{ data?: OptimizedExtractionResult['data']; tokensUsed: number }> {
    const chunks = this.createSmartChunks(extractedData);
    const results: Array<{ data?: OptimizedExtractionResult['data']; tokensUsed: number }> = [];
    let totalTokens = 0;

    // Process chunks in parallel (with concurrency limit)
    const concurrencyLimit = 3;
    for (let i = 0; i < chunks.length; i += concurrencyLimit) {
      const batch = chunks.slice(i, i + concurrencyLimit);
      const batchPromises = batch.map(chunk => this.processChunk(chunk));

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      totalTokens += batchResults.reduce((sum, r) => sum + r.tokensUsed, 0);
    }

    // Merge results
    const merged = this.mergeChunkResults(
      results.map(r => r.data).filter(Boolean) as Array<
        NonNullable<OptimizedExtractionResult['data']>
      >
    );

    return {
      data: merged,
      tokensUsed: totalTokens,
    };
  }

  /**
   * Create smart chunks that preserve context
   */
  private createSmartChunks(extractedData: ExtractedPDFData): string[] {
    const chunks: string[] = [];
    const maxChunkTokens = this._config.maxTokensPerRequest - 200; // Leave room for prompt

    // Always include header info in first chunk
    const header = this.extractHeaderInfo(extractedData.text);

    // Split by pages if available
    if (extractedData.pages && extractedData.pages.length > 1) {
      for (const page of extractedData.pages) {
        const pageText = `${header}\n${page.text}`;
        const estimatedTokens = TokenEstimator.estimate(pageText);

        if (estimatedTokens <= maxChunkTokens) {
          chunks.push(pageText);
        } else {
          // Further split large pages
          const subChunks = this.splitLargePage(pageText, maxChunkTokens);
          chunks.push(...subChunks);
        }
      }
    } else {
      // Fallback to smart splitting
      chunks.push(...this.splitByProducts(extractedData.text, maxChunkTokens));
    }

    return chunks;
  }

  /**
   * Process a single chunk
   */
  private async processChunk(chunk: string): Promise<{
    data?: OptimizedExtractionResult['data'];
    tokensUsed: number;
  }> {
    await this.enforceRateLimit();

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: this.getChunkSystemPrompt(),
        },
        {
          role: 'user',
          content: chunk,
        },
      ],
      temperature: 0,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const tokensUsed = completion.usage?.total_tokens || 0;
    const parsed = JSON.parse(responseText);

    return {
      data: this.normalizeResponse(parsed),
      tokensUsed,
    };
  }

  /**
   * Optimize text for LLM processing
   */
  private optimizeTextForLLM(extractedData: ExtractedPDFData): string {
    let optimized = '';

    // Extract critical information first
    const metadata = this.pdfService.extractMetadata(extractedData.text);

    // Add structured header
    optimized += `ORDER_REF: ${metadata.orderRef || 'EXTRACT'}\n`;
    optimized += `ACCOUNT: ${metadata.accountNum || 'EXTRACT'}\n`;
    optimized += `PAGES: ${extractedData.numPages}\n\n`;

    // Extract and clean product section only
    const productSection = this.extractProductSection(extractedData.text);
    optimized += productSection;

    // Truncate if needed
    optimized = TokenEstimator.truncateToTokenLimit(
      optimized,
      this._config.maxTokensPerRequest - 200 // Leave room for system prompt
    );

    return optimized;
  }

  /**
   * Extract product section from text
   */
  private extractProductSection(text: string): string {
    // Find product table markers
    const productMarkers = [
      /Item\s+Code.*?Pack\s+Size/i,
      /Product\s+Code.*?Description/i,
      /Code.*?Qty/i,
    ];

    let startIndex = -1;
    for (const marker of productMarkers) {
      const match = text.match(marker);
      if (match && match.index !== undefined) {
        startIndex = match.index;
        break;
      }
    }

    if (startIndex === -1) {
      // Fallback: look for product code patterns
      const productCodePattern = /^[A-Z][A-Z0-9]{2,}/m;
      const match = text.match(productCodePattern);
      if (match && match.index !== undefined) {
        startIndex = Math.max(0, match.index - 100);
      }
    }

    if (startIndex === -1) {
      return text; // Return full text if no product section found
    }

    // Extract from start to end or reasonable length
    const extracted = text.substring(startIndex);

    // Clean up
    return extracted
      .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
      .replace(/\s{2,}/g, ' ') // Remove excessive spaces
      .trim();
  }

  /**
   * Optimized system prompt
   */
  private getOptimizedSystemPrompt(): string {
    return `Extract products from order. Return JSON only:
{
  "order_ref": "number",
  "products": [
    {"product_code": "code", "product_desc": "description", "product_qty": number}
  ]
}
Rules:
- Skip Trans/TransDPD/TransC (shipping)
- Each product separate entry
- No explanations`;
  }

  /**
   * Chunk processing prompt
   */
  private getChunkSystemPrompt(): string {
    return `Extract products from this section. JSON only:
{"products": [{"product_code": "code", "product_desc": "desc", "product_qty": qty}]}`;
  }

  /**
   * Generate content hash for caching
   */
  private generateContentHash(buffer: ArrayBuffer): string {
    const hash = crypto.createHash('sha256');
    hash.update(Buffer.from(buffer));
    return hash.digest('hex');
  }

  /**
   * Normalize response format
   */
  private normalizeResponse(parsed: Record<string, unknown>): OptimizedExtractionResult['data'] {
    if (!parsed || (!parsed.products && !parsed.orders)) {
      return undefined;
    }

    const products = Array.isArray(parsed.products)
      ? parsed.products
      : Array.isArray(parsed.orders)
        ? parsed.orders
        : [];

    return {
      order_ref: String(
        parsed.order_ref ||
          (products.length > 0
            ? String((products[0] as Record<string, unknown>).order_ref || '')
            : '')
      ),
      products: products.map((p: Record<string, unknown>) => ({
        product_code: String(p.product_code || ''),
        product_desc: String(p.product_desc || p.description || ''),
        product_qty: parseInt(String(p.product_qty || p.quantity || '1')),
        unit_price: p.unit_price ? String(p.unit_price) : undefined,
      })),
      metadata: {
        account_num: parsed.account_num ? String(parsed.account_num) : undefined,
        delivery_add: parsed.delivery_add ? String(parsed.delivery_add) : undefined,
      },
    };
  }

  /**
   * Merge results from multiple chunks
   */
  private mergeChunkResults(
    results: Array<NonNullable<OptimizedExtractionResult['data']>>
  ): OptimizedExtractionResult['data'] {
    const allProducts: Array<{
      product_code: string;
      product_desc: string;
      product_qty: number;
      unit_price?: string;
    }> = [];
    let orderRef = '';

    for (const result of results) {
      if (result?.products && Array.isArray(result.products)) {
        allProducts.push(...result.products);
      }
      if (result?.order_ref && !orderRef) {
        orderRef = result.order_ref;
      }
    }

    // Deduplicate products
    const uniqueProducts = this.deduplicateProducts(allProducts);

    return {
      order_ref: orderRef,
      products: uniqueProducts,
      metadata: {},
    };
  }

  /**
   * Deduplicate products based on product code
   */
  private deduplicateProducts(
    products: Array<{
      product_code: string;
      product_desc: string;
      product_qty: number;
      unit_price?: string;
    }>
  ): Array<{
    product_code: string;
    product_desc: string;
    product_qty: number;
    unit_price?: string;
  }> {
    const seen = new Set<string>();
    const unique: Array<{
      product_code: string;
      product_desc: string;
      product_qty: number;
      unit_price?: string;
    }> = [];

    for (const product of products) {
      const key = `${product.product_code}-${product.product_qty}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(product);
      }
    }

    return unique;
  }

  /**
   * Extract header information
   */
  private extractHeaderInfo(text: string): string {
    const lines = text.split('\n');
    const headerLines: string[] = [];

    for (const line of lines) {
      if (line.match(/Order\s+Reference|Account\s+No|Delivery\s+Address/i)) {
        headerLines.push(line);
      }
      // Stop after finding product section
      if (line.match(/Item\s+Code|Product\s+Code/i)) {
        break;
      }
      // Limit header size
      if (headerLines.length > 10) {
        break;
      }
    }

    return headerLines.join('\n');
  }

  /**
   * Split large page into smaller chunks
   */
  private splitLargePage(pageText: string, maxTokens: number): string[] {
    const chunks: string[] = [];
    const lines = pageText.split('\n');
    let currentChunk = '';

    for (const line of lines) {
      const testChunk = currentChunk + '\n' + line;
      if (TokenEstimator.estimate(testChunk) > maxTokens) {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        currentChunk = line;
      } else {
        currentChunk = testChunk;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  /**
   * Split by product boundaries
   */
  private splitByProducts(text: string, maxTokens: number): string[] {
    const chunks: string[] = [];
    const productPattern = /^[A-Z][A-Z0-9]{2,}/gm;
    const matches = Array.from(text.matchAll(productPattern));

    if (matches.length === 0) {
      return [text];
    }

    let currentChunk = text.substring(0, matches[0].index);

    for (let i = 0; i < matches.length; i++) {
      const productStart = matches[i].index!;
      const productEnd = matches[i + 1]?.index || text.length;
      const productText = text.substring(productStart, productEnd);

      const testChunk = currentChunk + productText;
      if (TokenEstimator.estimate(testChunk) > maxTokens) {
        chunks.push(currentChunk);
        currentChunk = productText;
      } else {
        currentChunk = testChunk;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  /**
   * Rate limiting enforcement
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();

    // Clean old entries
    this.rateLimiter.requestQueue = this.rateLimiter.requestQueue.filter(
      time => now - time < 60000
    );

    // Check rate limit
    if (this.rateLimiter.requestQueue.length >= this.rateLimiter.requestsPerMinute) {
      const oldestRequest = this.rateLimiter.requestQueue[0];
      const waitTime = 60000 - (now - oldestRequest) + 100;

      systemLogger.debug(
        {
          waitTime,
          queueLength: this.rateLimiter.requestQueue.length,
        },
        '[OptimizedPDFExtraction] Rate limit reached, waiting'
      );

      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Enforce minimum interval
    const timeSinceLastRequest = now - this.rateLimiter.lastRequestTime;
    if (timeSinceLastRequest < this.rateLimiter.minRequestInterval) {
      await new Promise(resolve =>
        setTimeout(resolve, this.rateLimiter.minRequestInterval - timeSinceLastRequest)
      );
    }

    // Record request
    this.rateLimiter.requestQueue.push(now);
    this.rateLimiter.lastRequestTime = now;
  }

  /**
   * Check if error is rate limit
   */
  private isRateLimitError(error: unknown): boolean {
    if (error instanceof Error) {
      return (
        error.message.toLowerCase().includes('rate') ||
        error.message.includes('429') ||
        error.message.includes('quota')
      );
    }
    return false;
  }

  /**
   * Handle rate limit with exponential backoff
   */
  private async handleRateLimit(error: Error): Promise<void> {
    const match = error.message?.match(/(\d+(?:\.\d+)?)\s*seconds?/);
    const retryAfter = match ? parseFloat(match[1]) * 1000 : 5000;

    systemLogger.warn(
      {
        retryAfter,
        error: error.message,
      },
      '[OptimizedPDFExtraction] Handling rate limit'
    );

    await new Promise(resolve => setTimeout(resolve, retryAfter));
  }

  /**
   * Get performance statistics
   */
  public getPerformanceStats(): {
    cacheStats: ReturnType<EnhancedPDFCache<OptimizedExtractionResult['data']>['getStats']>;
    averageProcessingTime: number;
    tokensSaved: number;
  } {
    const cacheStats = this.cache.getStats();

    // Calculate tokens saved from cache hits
    const avgTokensPerRequest = 2000; // Estimated average
    const tokensSaved = cacheStats.totalHits * avgTokensPerRequest;

    return {
      cacheStats,
      averageProcessingTime: cacheStats.avgAccessTime,
      tokensSaved,
    };
  }

  /**
   * Warm cache with common patterns
   */
  public async warmCache(): Promise<void> {
    // This could be called on startup to pre-load common PDFs
    systemLogger.info('[OptimizedPDFExtraction] Cache warming started');

    // Example: Load test patterns or common PDF structures
    // In production, this could load from a database of recent PDFs
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
    systemLogger.info('[OptimizedPDFExtraction] Cache cleared');
  }
}

// Export singleton instance
export const optimizedPDFService = OptimizedPDFExtractionService.getInstance();
