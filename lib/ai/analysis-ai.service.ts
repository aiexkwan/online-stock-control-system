/**
 * AnalysisAI Service
 * AI-powered analysis service integrating with OpenAI GPT-4o for intelligent insights
 * Based on 16-specialist design recommendations
 */

import { OpenAI } from 'openai';
import { 
  AnalysisType, 
  AnalysisUrgency, 
  AiInsight, 
  InsightType, 
  InsightSeverity 
} from '@/types/generated/graphql';

// Data sanitization utility
class DataSanitizer {
  static sanitizeForAI(data: any): SanitizedData {
    // Remove sensitive information before sending to AI
    const sanitized = JSON.parse(JSON.stringify(data));
    
    // Remove personal identifiers
    this.removeSensitiveFields(sanitized, [
      'email', 'phone', 'ssn', 'credit_card', 'password',
      'user_id', 'customer_id', 'personal_info'
    ]);
    
    // Aggregate small values to protect privacy
    this.aggregateSmallValues(sanitized);
    
    // Limit data size for AI processing
    return this.limitDataSize(sanitized, 50000); // 50KB limit
  }
  
  private static removeSensitiveFields(obj: any, sensitiveFields: string[]): void {
    if (typeof obj !== 'object' || obj === null) return;
    
    for (const key in obj) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        this.removeSensitiveFields(obj[key], sensitiveFields);
      }
    }
  }
  
  private static aggregateSmallValues(obj: any): void {
    // Group items with count < 5 into "Others" category for privacy
    if (Array.isArray(obj)) {
      const grouped = obj.reduce((acc, item) => {
        if (item.count && item.count < 5) {
          acc.others = (acc.others || 0) + item.count;
        } else {
          acc.items = acc.items || [];
          acc.items.push(item);
        }
        return acc;
      }, {});
      
      if (grouped.others) {
        grouped.items = grouped.items || [];
        grouped.items.push({ category: 'Others', count: grouped.others });
      }
      
      return grouped.items || obj;
    }
  }
  
  private static limitDataSize(data: any, maxBytes: number): SanitizedData {
    const jsonString = JSON.stringify(data);
    if (jsonString.length <= maxBytes) {
      return data;
    }
    
    // Truncate arrays to fit size limit
    const truncated = { ...data };
    for (const key in truncated) {
      if (Array.isArray(truncated[key])) {
        const maxItems = Math.floor(truncated[key].length * 0.7);
        truncated[key] = truncated[key].slice(0, maxItems);
        
        if (JSON.stringify(truncated).length <= maxBytes) {
          break;
        }
      }
    }
    
    return truncated;
  }
}

interface SanitizedData {
  [key: string]: any;
}

interface AnalysisData {
  analysisType: AnalysisType;
  summary: any;
  details: any;
  metadata: any;
}

export class AnalysisAIService {
  private openai: OpenAI;
  private fastModel = 'gpt-4o-mini';
  private thoroughModel = 'gpt-4o';
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  
  async generateInsights(
    data: AnalysisData, 
    urgency: AnalysisUrgency = AnalysisUrgency.Normal
  ): Promise<AiInsight[]> {
    try {
      // Data sanitization for privacy protection
      const sanitizedData = DataSanitizer.sanitizeForAI(data);
      
      switch (urgency) {
        case AnalysisUrgency.Fast:
          return this.fastAnalysis(sanitizedData, data.analysisType);
        case AnalysisUrgency.Thorough:
          return this.thoroughAnalysis(sanitizedData, data.analysisType);
        case AnalysisUrgency.Normal:
        default:
          return this.hybridAnalysis(sanitizedData, data.analysisType);
      }
    } catch (error) {
      console.error('[AnalysisAI] Error generating insights:', error);
      return this.generateFallbackInsights(data.analysisType);
    }
  }
  
  private async fastAnalysis(data: SanitizedData, type: AnalysisType): Promise<AiInsight[]> {
    const startTime = Date.now();
    
    try {
      const prompt = this.buildFastAnalysisPrompt(data, type);
      
      const response = await this.openai.chat.completions.create({
        model: this.fastModel,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.3,
      });
      
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from AI');
      }
      
      const processingTime = Date.now() - startTime;
      return this.parseAIResponse(content, type, 0.7, this.fastModel, processingTime);
      
    } catch (error) {
      console.error('[AnalysisAI] Fast analysis error:', error);
      return this.generateFallbackInsights(type);
    }
  }
  
  private async thoroughAnalysis(data: SanitizedData, type: AnalysisType): Promise<AiInsight[]> {
    const startTime = Date.now();
    
    try {
      const prompt = this.buildThoroughAnalysisPrompt(data, type);
      
      const response = await this.openai.chat.completions.create({
        model: this.thoroughModel,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 3000,
        temperature: 0.2,
      });
      
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from AI');
      }
      
      const processingTime = Date.now() - startTime;
      return this.parseAIResponse(content, type, 0.9, this.thoroughModel, processingTime);
      
    } catch (error) {
      console.error('[AnalysisAI] Thorough analysis error:', error);
      return this.generateFallbackInsights(type);
    }
  }
  
  private async hybridAnalysis(data: SanitizedData, type: AnalysisType): Promise<AiInsight[]> {
    try {
      // Parallel processing: quick preview + detailed analysis
      const [quickInsights, detailedInsights] = await Promise.allSettled([
        this.fastAnalysis(data, type),
        this.thoroughAnalysis(data, type)
      ]);
      
      const quick = quickInsights.status === 'fulfilled' ? quickInsights.value : [];
      const detailed = detailedInsights.status === 'fulfilled' ? detailedInsights.value : [];
      
      return this.mergeInsights(quick, detailed);
    } catch (error) {
      console.error('[AnalysisAI] Hybrid analysis error:', error);
      return this.generateFallbackInsights(type);
    }
  }
  
  private buildFastAnalysisPrompt(data: SanitizedData, type: AnalysisType): string {
    const typeContext = this.getAnalysisTypeContext(type);
    
    return `
You are an expert warehouse management analyst. Provide a QUICK analysis of this ${type} data.

ANALYSIS CONTEXT: ${typeContext}

DATA TO ANALYZE:
${JSON.stringify(data, null, 2)}

RESPOND WITH EXACTLY 3 INSIGHTS in this JSON format:
[
  {
    "type": "TREND_ANALYSIS|ANOMALY_DETECTION|OPTIMIZATION_SUGGESTION|RISK_ASSESSMENT|PERFORMANCE_INSIGHT|PREDICTIVE_FORECAST",
    "severity": "INFO|WARNING|CRITICAL|OPTIMIZATION",
    "title": "Brief insight title (max 50 chars)",
    "content": "Insight description (max 200 chars)",
    "recommendations": ["action1", "action2"],
    "confidence": 0.0-1.0
  }
]

Focus on the most actionable insights for warehouse operations optimization.
`;
  }
  
  private buildThoroughAnalysisPrompt(data: SanitizedData, type: AnalysisType): string {
    const typeContext = this.getAnalysisTypeContext(type);
    
    return `
You are a senior warehouse operations analyst with expertise in supply chain optimization and predictive analytics.

ANALYSIS TYPE: ${type}
CONTEXT: ${typeContext}

COMPREHENSIVE DATA ANALYSIS:
${JSON.stringify(data, null, 2)}

Provide a thorough analysis with 5-7 insights in this JSON format:
[
  {
    "type": "TREND_ANALYSIS|ANOMALY_DETECTION|OPTIMIZATION_SUGGESTION|RISK_ASSESSMENT|PERFORMANCE_INSIGHT|PREDICTIVE_FORECAST",
    "severity": "INFO|WARNING|CRITICAL|OPTIMIZATION", 
    "title": "Detailed insight title",
    "content": "Comprehensive analysis with specific data points and business impact",
    "recommendations": ["specific actionable steps", "implementation guidance", "success metrics"],
    "confidence": 0.0-1.0,
    "relatedData": {"key": "supporting data points"}
  }
]

ANALYSIS REQUIREMENTS:
1. Identify patterns, trends, and anomalies
2. Assess business risks and opportunities
3. Provide specific, actionable recommendations
4. Include confidence scores based on data quality
5. Reference specific data points in your analysis
6. Consider seasonal patterns and industry benchmarks
7. Focus on ROI and operational efficiency improvements

Ensure insights are prioritized by business impact and implementation feasibility.
`;
  }
  
  private getAnalysisTypeContext(type: AnalysisType): string {
    switch (type) {
      case AnalysisType.InventoryOrderMatching:
        return 'Analyze inventory levels against order demand to optimize stock allocation and prevent stockouts or overstock situations.';
      case AnalysisType.OperationalDashboard:
        return 'Evaluate operational efficiency metrics including throughput, cycle times, resource utilization, and process bottlenecks.';
      case AnalysisType.PerformanceAnalysis:
        return 'Assess KPI performance, productivity metrics, and operational effectiveness across warehouse operations.';
      case AnalysisType.TrendForecasting:
        return 'Identify historical patterns and predict future trends in demand, inventory, and operational metrics.';
      case AnalysisType.AnomalyDetection:
        return 'Detect unusual patterns, outliers, and potential issues in warehouse operations that require attention.';
      default:
        return 'General warehouse management analysis focusing on operational optimization and efficiency improvements.';
    }
  }
  
  private parseAIResponse(
    content: string, 
    type: AnalysisType, 
    baseConfidence: number,
    model: string,
    processingTime: number
  ): AiInsight[] {
    try {
      // Extract JSON from AI response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }
      
      const insights = JSON.parse(jsonMatch[0]);
      
      return insights.map((insight: any, index: number) => ({
        id: `ai-insight-${Date.now()}-${index}`,
        type: this.validateInsightType(insight.type),
        confidence: Math.min(Math.max(insight.confidence || baseConfidence, 0), 1),
        title: insight.title || 'Analysis Insight',
        content: insight.content || 'No content provided',
        recommendations: Array.isArray(insight.recommendations) ? insight.recommendations : [],
        severity: this.validateInsightSeverity(insight.severity),
        relatedData: insight.relatedData || null,
        generatedAt: new Date().toISOString(),
        modelUsed: model,
        processingTime: processingTime / 1000, // Convert to seconds
      }));
      
    } catch (error) {
      console.error('[AnalysisAI] Error parsing AI response:', error);
      return this.generateFallbackInsights(type);
    }
  }
  
  private validateInsightType(type: string): InsightType {
    const validTypes = Object.values(InsightType);
    return validTypes.includes(type as InsightType) ? 
      type as InsightType : InsightType.PerformanceInsight;
  }
  
  private validateInsightSeverity(severity: string): InsightSeverity {
    const validSeverities = Object.values(InsightSeverity);
    return validSeverities.includes(severity as InsightSeverity) ? 
      severity as InsightSeverity : InsightSeverity.Info;
  }
  
  private mergeInsights(quickInsights: AiInsight[], detailedInsights: AiInsight[]): AiInsight[] {
    // Combine insights, prioritizing detailed ones and removing duplicates
    const combined = [...detailedInsights];
    
    quickInsights.forEach(quickInsight => {
      const isDuplicate = detailedInsights.some(detailedInsight => 
        detailedInsight.title.toLowerCase().includes(quickInsight.title.toLowerCase()) ||
        quickInsight.title.toLowerCase().includes(detailedInsight.title.toLowerCase())
      );
      
      if (!isDuplicate) {
        combined.push(quickInsight);
      }
    });
    
    // Sort by severity and confidence
    return combined.sort((a, b) => {
      const severityOrder: Record<string, number> = { CRITICAL: 4, WARNING: 3, OPTIMIZATION: 2, INFO: 1 };
      const severityDiff = (severityOrder[b.severity as string] || 0) - (severityOrder[a.severity as string] || 0);
      
      if (severityDiff !== 0) return severityDiff;
      return b.confidence - a.confidence;
    });
  }
  
  private generateFallbackInsights(type: AnalysisType): AiInsight[] {
    // Fallback insights when AI service is unavailable
    const timestamp = new Date().toISOString();
    
    return [
      {
        id: `fallback-insight-${Date.now()}`,
        type: InsightType.PerformanceInsight,
        confidence: 0.5,
        title: 'Analysis Service Unavailable',
        content: 'AI analysis service is currently unavailable. Please try again later or contact support.',
        recommendations: [
          'Check your internet connection',
          'Retry the analysis in a few minutes',
          'Contact technical support if the issue persists'
        ],
        severity: InsightSeverity.Warning,
        relatedData: null,
        generatedAt: timestamp,
        modelUsed: 'fallback',
        processingTime: 0,
      }
    ];
  }
  
  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.fastModel,
        messages: [{ role: 'user', content: 'Health check - respond with "OK"' }],
        max_tokens: 10,
      });
      
      return response.choices[0]?.message?.content?.includes('OK') || false;
    } catch (error) {
      console.error('[AnalysisAI] Health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const analysisAIService = new AnalysisAIService();