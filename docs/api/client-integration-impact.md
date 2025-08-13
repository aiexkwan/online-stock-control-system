# Alert System API Client Integration Impact Analysis

## Overview

This document analyzes the impact of Alert System API changes on various client integration patterns and provides specific guidance for different types of integrations commonly used with the NewPennine WMS Alert System.

## Client Integration Types

### 1. Web Frontend Applications

#### Current Integrations Analysis
Based on common web frontend patterns in warehouse management systems:

**JavaScript/TypeScript SPA Applications**
- **Impact Level**: 🔴 **Critical**
- **Affected Areas**: All API calls, response handling, error management
- **Estimated Migration Time**: 16-32 hours per application

**Frontend Framework Integrations**

| Framework | Common Pattern | Migration Complexity | Estimated Effort |
|-----------|----------------|---------------------|------------------|
| **React** | Custom hooks + fetch | High | 20-30 hours |
| **Vue.js** | Composables + axios | High | 18-25 hours |
| **Angular** | Services + HttpClient | High | 25-35 hours |
| **Svelte** | Stores + fetch | Medium | 15-20 hours |

#### Migration Impact Details

**React Integration Example**

*Legacy Code*:
```typescript
// Custom hook for alert rules (Legacy)
function useAlertRules() {
  const [rules, setRules] = useState<LegacyAlertRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/alerts/rules');
      const data = await response.json();
      
      if (data.status === 'success') {
        setRules(data.rules || []);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch rules');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { rules, loading, error, fetchRules };
}
```

*Migrated V1 Code*:
```typescript
// Custom hook for alert rules (V1)
interface UseAlertRulesOptions {
  enabled?: boolean;
  levels?: AlertLevel[];
  limit?: number;
  offset?: number;
}

function useAlertRules(options: UseAlertRulesOptions = {}) {
  const [data, setData] = useState<{
    rules: AlertRule[];
    pagination: Pagination;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (options.enabled !== undefined) {
        queryParams.set('enabled', String(options.enabled));
      }
      if (options.levels?.length) {
        queryParams.set('levels', options.levels.join(','));
      }
      if (options.limit) {
        queryParams.set('limit', String(options.limit));
      }
      if (options.offset) {
        queryParams.set('offset', String(options.offset));
      }

      const response = await fetch(`/api/v1/alerts/rules?${queryParams}`);
      const apiResult: ApiResult<{
        data: AlertRule[];
        pagination: Pagination;
      }> = await response.json();
      
      if (apiResult.success) {
        setData({
          rules: apiResult.data!.data,
          pagination: apiResult.data!.pagination
        });
        setError(null);
      } else {
        const apiError = new ApiError(
          apiResult.error || 'Failed to fetch rules',
          apiResult.code,
          apiResult.details
        );
        setError(apiError);
      }
    } catch (err) {
      setError(new ApiError(err.message, 'NETWORK_ERROR'));
    } finally {
      setLoading(false);
    }
  }, [options.enabled, options.levels, options.limit, options.offset]);

  return { 
    rules: data?.rules || [], 
    pagination: data?.pagination,
    loading, 
    error, 
    fetchRules 
  };
}
```

**Vue.js Integration Example**

*Legacy Composable*:
```typescript
// Vue composable (Legacy)
export function useAlerts() {
  const rules = ref<LegacyAlertRule[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchRules() {
    loading.value = true;
    try {
      const { data } = await axios.get('/api/alerts/rules');
      if (data.status === 'success') {
        rules.value = data.rules || [];
      } else {
        error.value = data.error;
      }
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  return {
    rules: readonly(rules),
    loading: readonly(loading),
    error: readonly(error),
    fetchRules
  };
}
```

*Migrated V1 Composable*:
```typescript
// Vue composable (V1)
export function useAlerts(options: UseAlertsOptions = {}) {
  const rules = ref<AlertRule[]>([]);
  const pagination = ref<Pagination | null>(null);
  const loading = ref(false);
  const error = ref<ApiError | null>(null);

  async function fetchRules() {
    loading.value = true;
    try {
      const params = new URLSearchParams();
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            params.set(key, value.join(','));
          } else {
            params.set(key, String(value));
          }
        }
      });

      const { data } = await axios.get(`/api/v1/alerts/rules?${params}`);
      
      if (data.success) {
        rules.value = data.data.data;
        pagination.value = data.data.pagination;
        error.value = null;
      } else {
        error.value = new ApiError(
          data.error,
          data.code,
          data.details
        );
      }
    } catch (err) {
      error.value = new ApiError(err.message, 'NETWORK_ERROR');
    } finally {
      loading.value = false;
    }
  }

  return {
    rules: readonly(rules),
    pagination: readonly(pagination),
    loading: readonly(loading),
    error: readonly(error),
    fetchRules
  };
}
```

### 2. Mobile Applications

#### React Native Integration

**Impact Level**: 🔴 **Critical**  
**Estimated Migration Time**: 20-30 hours per application

*Legacy Mobile Code*:
```typescript
// React Native service (Legacy)
class AlertService {
  private baseUrl = 'https://wms.newpennine.com/api/alerts';

  async getRules(): Promise<LegacyAlertRule[]> {
    const response = await fetch(`${this.baseUrl}/rules`, {
      headers: {
        'Authorization': `Bearer ${await AsyncStorage.getItem('token')}`
      }
    });
    
    const data = await response.json();
    if (data.status === 'success') {
      return data.rules || [];
    } else {
      throw new Error(data.error || 'Failed to fetch rules');
    }
  }

  async createRule(rule: CreateLegacyRuleRequest): Promise<LegacyAlertRule> {
    const response = await fetch(`${this.baseUrl}/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await AsyncStorage.getItem('token')}`
      },
      body: JSON.stringify(rule)
    });

    const data = await response.json();
    if (data.status === 'success') {
      return data.rule;
    } else {
      throw new Error(data.error || 'Failed to create rule');
    }
  }
}
```

*Migrated V1 Mobile Code*:
```typescript
// React Native service (V1)
class AlertServiceV1 {
  private baseUrl = 'https://wms.newpennine.com/api/v1/alerts';

  async getRules(options: {
    enabled?: boolean;
    levels?: AlertLevel[];
    limit?: number;
    offset?: number;
  } = {}): Promise<{ rules: AlertRule[]; pagination: Pagination }> {
    const queryParams = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          queryParams.set(key, value.join(','));
        } else {
          queryParams.set(key, String(value));
        }
      }
    });

    const response = await fetch(`${this.baseUrl}/rules?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${await AsyncStorage.getItem('token')}`
      }
    });
    
    const data: ApiResult<{
      data: AlertRule[];
      pagination: Pagination;
    }> = await response.json();
    
    if (data.success) {
      return {
        rules: data.data!.data,
        pagination: data.data!.pagination
      };
    } else {
      throw new ApiError(
        data.error || 'Failed to fetch rules',
        data.code,
        data.details
      );
    }
  }

  async createRule(rule: CreateAlertRuleRequest): Promise<AlertRule> {
    const response = await fetch(`${this.baseUrl}/rules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await AsyncStorage.getItem('token')}`
      },
      body: JSON.stringify(rule)
    });

    const data: ApiResult<AlertRule> = await response.json();
    if (data.success) {
      return data.data!;
    } else {
      throw new ApiError(
        data.error || 'Failed to create rule',
        data.code,
        data.details
      );
    }
  }
}
```

#### Flutter Integration

**Impact Level**: 🔴 **Critical**  
**Estimated Migration Time**: 25-35 hours per application

*Legacy Dart Code*:
```dart
// Flutter service (Legacy)
class AlertService {
  final String _baseUrl = 'https://wms.newpennine.com/api/alerts';
  final Dio _dio = Dio();

  Future<List<LegacyAlertRule>> getRules() async {
    try {
      final response = await _dio.get('$_baseUrl/rules');
      final data = response.data;
      
      if (data['status'] == 'success') {
        return (data['rules'] as List)
            .map((json) => LegacyAlertRule.fromJson(json))
            .toList();
      } else {
        throw Exception(data['error'] ?? 'Failed to fetch rules');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }
}
```

*Migrated V1 Dart Code*:
```dart
// Flutter service (V1)
class AlertServiceV1 {
  final String _baseUrl = 'https://wms.newpennine.com/api/v1/alerts';
  final Dio _dio = Dio();

  Future<AlertRulesResponse> getRules({
    bool? enabled,
    List<AlertLevel>? levels,
    int? limit,
    int? offset,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (enabled != null) queryParams['enabled'] = enabled.toString();
      if (levels != null && levels.isNotEmpty) {
        queryParams['levels'] = levels.map((l) => l.name).join(',');
      }
      if (limit != null) queryParams['limit'] = limit.toString();
      if (offset != null) queryParams['offset'] = offset.toString();

      final response = await _dio.get(
        '$_baseUrl/rules',
        queryParameters: queryParams,
      );
      
      final apiResult = ApiResult<AlertRulesData>.fromJson(
        response.data,
        (json) => AlertRulesData.fromJson(json as Map<String, dynamic>),
      );
      
      if (apiResult.success) {
        return AlertRulesResponse(
          rules: apiResult.data!.data,
          pagination: apiResult.data!.pagination,
        );
      } else {
        throw ApiException(
          message: apiResult.error ?? 'Failed to fetch rules',
          code: apiResult.code,
          details: apiResult.details,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(message: 'Network error: $e', code: 'NETWORK_ERROR');
    }
  }
}
```

### 3. Backend Services Integration

#### Node.js/Express Integration

**Impact Level**: 🟡 **Medium**  
**Estimated Migration Time**: 8-16 hours per service

*Legacy Backend Code*:
```typescript
// Node.js service (Legacy)
import axios from 'axios';

class AlertApiClient {
  private baseUrl = process.env.ALERT_API_URL || 'https://wms.newpennine.com/api/alerts';

  async createSystemAlert(alertData: {
    name: string;
    metric: string;
    threshold: number;
  }) {
    try {
      const response = await axios.post(`${this.baseUrl}/config`, {
        name: alertData.name,
        type: 'threshold',
        category: 'system',
        priority: 'high',
        condition: {
          metric: alertData.metric,
          operator: 'gt',
          value: alertData.threshold,
          duration: 300
        },
        actions: [
          {
            type: 'email',
            target: process.env.ADMIN_EMAIL
          }
        ],
        cooldown: 1800
      });

      if (response.data.status === 'success') {
        return response.data.rule;
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('Failed to create alert:', error);
      throw error;
    }
  }
}
```

*Migrated V1 Backend Code*:
```typescript
// Node.js service (V1)
import axios, { AxiosResponse } from 'axios';

class AlertApiClientV1 {
  private baseUrl = process.env.ALERT_API_URL || 'https://wms.newpennine.com/api/v1/alerts';

  async createSystemAlert(alertData: {
    name: string;
    metric: string;
    threshold: number;
    description?: string;
  }): Promise<AlertRule> {
    try {
      const ruleRequest: CreateAlertRuleRequest = {
        name: alertData.name,
        description: alertData.description || `System alert for ${alertData.metric}`,
        enabled: true,
        level: 'ERROR',
        metric: alertData.metric,
        condition: 'GREATER_THAN',
        threshold: alertData.threshold,
        timeWindow: 300,
        evaluationInterval: 60,
        notifications: [
          {
            id: 'system-email-notification',
            channel: 'EMAIL',
            enabled: true,
            config: {
              recipients: [process.env.ADMIN_EMAIL!],
              subject: `System Alert: ${alertData.name}`
            }
          }
        ],
        silenceTime: 1800,
        tags: {
          source: 'automated',
          category: 'system',
          environment: process.env.NODE_ENV || 'development'
        }
      };

      const response: AxiosResponse<ApiResult<AlertRule>> = await axios.post(
        `${this.baseUrl}/rules`,
        ruleRequest
      );

      if (response.data.success) {
        return response.data.data!;
      } else {
        throw new ApiError(
          response.data.error || 'Failed to create alert',
          response.data.code,
          response.data.details
        );
      }
    } catch (error) {
      console.error('Failed to create alert:', error);
      
      // Enhanced error handling for V1
      if (error instanceof ApiError) {
        if (error.isValidationError) {
          console.error('Validation errors:', error.getFieldErrors());
        }
        throw error;
      } else if (axios.isAxiosError(error)) {
        const apiResult = error.response?.data as ApiResult<never>;
        if (apiResult && !apiResult.success) {
          throw new ApiError(
            apiResult.error || 'API request failed',
            apiResult.code,
            apiResult.details
          );
        }
      }
      
      throw new ApiError(error.message || 'Unknown error', 'UNKNOWN_ERROR');
    }
  }

  async getAlertHistory(filters: {
    ruleIds?: string[];
    levels?: AlertLevel[];
    startTime?: Date;
    endTime?: Date;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ alerts: AlertHistoryItem[]; pagination: PaginationWithMore }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.ruleIds?.length) {
        queryParams.set('ruleIds', filters.ruleIds.join(','));
      }
      if (filters.levels?.length) {
        queryParams.set('levels', filters.levels.join(','));
      }
      if (filters.startTime) {
        queryParams.set('startTime', filters.startTime.toISOString());
      }
      if (filters.endTime) {
        queryParams.set('endTime', filters.endTime.toISOString());
      }
      if (filters.limit) {
        queryParams.set('limit', String(filters.limit));
      }
      if (filters.offset) {
        queryParams.set('offset', String(filters.offset));
      }

      const response: AxiosResponse<ApiResult<AlertHistoryItem[]>> = await axios.get(
        `${this.baseUrl}/history?${queryParams}`
      );

      if (response.data.success) {
        return {
          alerts: response.data.data!,
          pagination: response.data.pagination as PaginationWithMore
        };
      } else {
        throw new ApiError(
          response.data.error || 'Failed to fetch alert history',
          response.data.code
        );
      }
    } catch (error) {
      console.error('Failed to fetch alert history:', error);
      throw error;
    }
  }
}
```

### 4. Third-Party Integrations

#### Webhook Consumers

**Impact Level**: 🟢 **Low**  
**Estimated Migration Time**: 2-4 hours per integration

Alert data sent via webhooks will have updated format:

*Legacy Webhook Payload*:
```json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "rule": {
    "id": "cpu-alert",
    "name": "High CPU Usage",
    "priority": "high"
  },
  "condition": {
    "metric": "system.cpu",
    "operator": "gt",
    "value": 85
  },
  "current_value": 92,
  "message": "CPU usage is 92%, exceeding threshold of 85%"
}
```

*V1 Webhook Payload*:
```json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "alert": {
    "id": "alert-123",
    "ruleId": "cpu-alert",
    "level": "ERROR",
    "state": "TRIGGERED",
    "message": "CPU usage is 92%, exceeding threshold of 85%"
  },
  "rule": {
    "id": "cpu-alert",
    "name": "High CPU Usage",
    "level": "ERROR",
    "metric": "system.cpu",
    "condition": "GREATER_THAN",
    "threshold": 85
  },
  "currentValue": 92,
  "metadata": {
    "environment": "production",
    "hostname": "wms-server-01",
    "component": "system-monitor"
  }
}
```

#### Monitoring Integrations (Grafana, Datadog, etc.)

**Impact Level**: 🟡 **Medium**  
**Estimated Migration Time**: 4-8 hours per integration

*Legacy Grafana Dashboard Query*:
```json
{
  "targets": [
    {
      "expr": "alert_api_requests_total{endpoint=\"/api/alerts/config\"}",
      "legendFormat": "Config Requests"
    }
  ]
}
```

*V1 Grafana Dashboard Query*:
```json
{
  "targets": [
    {
      "expr": "alert_api_requests_total{endpoint=\"/api/v1/alerts/config\"}",
      "legendFormat": "Config Requests (V1)"
    },
    {
      "expr": "alert_api_errors_total{endpoint=\"/api/v1/alerts/config\",code=\"VALIDATION_001\"}",
      "legendFormat": "Validation Errors"
    }
  ]
}
```

### 5. SDK/Library Integrations

#### Custom JavaScript SDK

**Impact Level**: 🔴 **Critical**  
**Estimated Migration Time**: 30-50 hours

*Legacy SDK Structure*:
```typescript
// Legacy SDK
export class NewPennineAlertSDK {
  constructor(private config: {
    baseUrl: string;
    apiKey: string;
  }) {}

  async getRules(): Promise<LegacyAlertRule[]> {
    const response = await this.request('GET', '/alerts/rules');
    return response.rules || [];
  }

  async createRule(rule: CreateLegacyRuleRequest): Promise<LegacyAlertRule> {
    const response = await this.request('POST', '/alerts/config', rule);
    return response.rule;
  }

  private async request(method: string, endpoint: string, data?: any) {
    const response = await fetch(`${this.config.baseUrl}/api${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: data ? JSON.stringify(data) : undefined
    });

    const result = await response.json();
    if (result.status !== 'success') {
      throw new Error(result.error || 'API request failed');
    }
    return result;
  }
}
```

*V1 SDK Structure*:
```typescript
// V1 SDK
export class NewPennineAlertSDKV1 {
  constructor(private config: {
    baseUrl: string;
    apiKey: string;
    version?: string;
  }) {
    this.config.version = this.config.version || 'v1';
  }

  async getRules(options: {
    enabled?: boolean;
    levels?: AlertLevel[];
    pagination?: {
      limit?: number;
      offset?: number;
    };
    sort?: {
      by?: 'name' | 'created_at' | 'updated_at';
      order?: 'asc' | 'desc';
    };
  } = {}): Promise<{
    rules: AlertRule[];
    pagination: Pagination;
  }> {
    const queryParams = this.buildQueryParams(options);
    const response = await this.request<{
      data: AlertRule[];
      pagination: Pagination;
    }>('GET', `/alerts/rules${queryParams}`);
    
    return {
      rules: response.data,
      pagination: response.pagination
    };
  }

  async createRule(rule: CreateAlertRuleRequest): Promise<AlertRule> {
    const response = await this.request<AlertRule>('POST', '/alerts/rules', rule);
    return response;
  }

  async testNotification(config: {
    channel: NotificationChannel;
    config: Record<string, unknown>;
    testMessage?: string;
  }): Promise<TestNotificationResult> {
    const response = await this.request<TestNotificationResult>(
      'POST', 
      '/alerts/notifications/test', 
      config
    );
    return response;
  }

  private async request<T>(
    method: string, 
    endpoint: string, 
    data?: any
  ): Promise<T> {
    const response = await fetch(
      `${this.config.baseUrl}/api/${this.config.version}${endpoint}`, 
      {
        method,
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'NewPennine-Alert-SDK/1.0.0'
        },
        body: data ? JSON.stringify(data) : undefined
      }
    );

    const result: ApiResult<T> = await response.json();
    
    if (!result.success) {
      throw new AlertSDKError(
        result.error || 'API request failed',
        result.code,
        result.details,
        response.status
      );
    }
    
    return result.data!;
  }

  private buildQueryParams(options: any): string {
    const params = new URLSearchParams();
    
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'pagination') {
          Object.entries(value as object).forEach(([pKey, pValue]) => {
            if (pValue !== undefined) params.set(pKey, String(pValue));
          });
        } else if (key === 'sort') {
          Object.entries(value as object).forEach(([sKey, sValue]) => {
            if (sValue !== undefined) {
              const paramName = sKey === 'by' ? 'sortBy' : 'sortOrder';
              params.set(paramName, String(sValue));
            }
          });
        } else if (Array.isArray(value)) {
          params.set(key, value.join(','));
        } else {
          params.set(key, String(value));
        }
      }
    });

    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  }
}

export class AlertSDKError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any[],
    public httpStatus?: number
  ) {
    super(message);
    this.name = 'AlertSDKError';
  }

  get isValidationError(): boolean {
    return this.code?.startsWith('VALIDATION_') ?? false;
  }

  get isAuthError(): boolean {
    return this.code?.startsWith('AUTH_') ?? false;
  }

  get isRateLimitError(): boolean {
    return this.code === 'RATE_001';
  }
}
```

## Migration Priority Matrix

### High Priority (Migrate First)

| Integration Type | Priority | Risk | Business Impact |
|-----------------|----------|------|-----------------|
| **Production Web Apps** | 🔴 Critical | High | Service disruption |
| **Mobile Apps** | 🔴 Critical | High | User experience impact |
| **Core Backend Services** | 🔴 Critical | High | System functionality |
| **Official SDKs** | 🔴 Critical | Medium | Developer adoption |

### Medium Priority (Migrate Second)

| Integration Type | Priority | Risk | Business Impact |
|-----------------|----------|------|-----------------|
| **Internal Tools** | 🟡 Medium | Medium | Operational efficiency |
| **Monitoring Dashboards** | 🟡 Medium | Low | Visibility impact |
| **Automation Scripts** | 🟡 Medium | Low | Process automation |

### Low Priority (Migrate Last)

| Integration Type | Priority | Risk | Business Impact |
|-----------------|----------|------|-----------------|
| **Development Tools** | 🟢 Low | Low | Development productivity |
| **Testing Utilities** | 🟢 Low | Low | QA processes |
| **Documentation Examples** | 🟢 Low | Low | Developer resources |

## Testing Strategies

### 1. API Contract Testing

```typescript
// Contract test example
describe('Alert API Contract Tests', () => {
  const legacyClient = new AlertAPILegacy();
  const v1Client = new AlertAPIV1();

  test('should return equivalent data from both endpoints', async () => {
    const legacyRules = await legacyClient.getRules();
    const v1Result = await v1Client.getRules({ limit: 1000 });
    
    // Verify count matches
    expect(v1Result.rules).toHaveLength(legacyRules.length);
    
    // Verify data integrity with mapping
    legacyRules.forEach((legacyRule, index) => {
      const v1Rule = v1Result.rules[index];
      expect(v1Rule.name).toBe(legacyRule.name);
      expect(v1Rule.metric).toBe(legacyRule.condition.metric);
      // Add more mappings...
    });
  });
});
```

### 2. Load Testing

```typescript
// Load test configuration
const loadTestConfig = {
  scenarios: {
    legacy_endpoint: {
      executor: 'constant-vus',
      vus: 50,
      duration: '5m',
      exec: 'testLegacyEndpoint',
    },
    v1_endpoint: {
      executor: 'constant-vus', 
      vus: 50,
      duration: '5m',
      exec: 'testV1Endpoint',
    },
  },
};

export function testLegacyEndpoint() {
  const response = http.get('https://wms.newpennine.com/api/alerts/rules');
  check(response, {
    'legacy status is 200': (r) => r.status === 200,
    'legacy response time < 500ms': (r) => r.timings.duration < 500,
  });
}

export function testV1Endpoint() {
  const response = http.get('https://wms.newpennine.com/api/v1/alerts/rules');
  check(response, {
    'v1 status is 200': (r) => r.status === 200,
    'v1 response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

### 3. Integration Testing

```typescript
// Integration test suite
class IntegrationTestSuite {
  async runAllTests() {
    const tests = [
      this.testWebFrontend,
      this.testMobileApp,
      this.testBackendService,
      this.testWebhookConsumer,
      this.testSDK
    ];

    const results = await Promise.allSettled(
      tests.map(test => test.call(this))
    );

    this.reportResults(results);
  }

  async testWebFrontend() {
    // Test React app integration
    const page = await browser.newPage();
    await page.goto('http://localhost:3000/alerts');
    
    // Wait for rules to load
    await page.waitForSelector('[data-testid="alert-rules-list"]');
    
    const rulesCount = await page.$$eval(
      '[data-testid="alert-rule-item"]',
      items => items.length
    );
    
    expect(rulesCount).toBeGreaterThan(0);
  }

  async testMobileApp() {
    // Test React Native app
    const response = await fetch('http://localhost:8081/api/v1/alerts/rules', {
      headers: { 'X-Platform': 'react-native' }
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  }

  async testBackendService() {
    // Test Node.js service integration
    const alertClient = new AlertApiClientV1();
    const rules = await alertClient.getRules({ limit: 10 });
    
    expect(rules.rules).toHaveLength(10);
    expect(rules.pagination.total).toBeGreaterThan(0);
  }
}
```

## Support and Maintenance

### 1. Monitoring Integration Health

```typescript
class IntegrationHealthMonitor {
  private metrics = {
    legacyRequests: 0,
    v1Requests: 0,
    migrationErrors: 0,
    integrationFailures: 0
  };

  trackLegacyRequest() {
    this.metrics.legacyRequests++;
  }

  trackV1Request() {
    this.metrics.v1Requests++;
  }

  trackMigrationError(error: Error, integration: string) {
    this.metrics.migrationErrors++;
    console.error(`Migration error in ${integration}:`, error);
  }

  getMigrationProgress(): number {
    const total = this.metrics.legacyRequests + this.metrics.v1Requests;
    if (total === 0) return 0;
    return (this.metrics.v1Requests / total) * 100;
  }

  generateHealthReport() {
    return {
      migrationProgress: this.getMigrationProgress(),
      totalRequests: this.metrics.legacyRequests + this.metrics.v1Requests,
      errorRate: this.metrics.migrationErrors / (this.metrics.legacyRequests + this.metrics.v1Requests),
      recommendations: this.getRecommendations()
    };
  }

  private getRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.getMigrationProgress() < 50) {
      recommendations.push('Accelerate migration to V1 endpoints');
    }
    
    if (this.metrics.migrationErrors > 0) {
      recommendations.push('Review and fix migration errors');
    }
    
    return recommendations;
  }
}
```

### 2. Support Documentation Templates

**Issue Report Template**:
```markdown
## Alert API Migration Issue

**Integration Type**: (Web App / Mobile App / Backend Service / SDK / Other)
**Priority**: (Critical / High / Medium / Low)

### Problem Description
[Describe the issue encountered during migration]

### Current Behavior
[What is currently happening]

### Expected Behavior  
[What should happen after migration]

### Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Error Messages
```
[Include any error messages or logs]
```

### Environment
- Application: [App name/version]
- Platform: [Web/iOS/Android/Node.js/etc.]
- API Endpoint: [Legacy/V1]
- Environment: [Development/Staging/Production]

### Additional Context
[Any other relevant information]
```

## Communication Plan

### 1. Developer Communications

**Email Template for Teams**:
```
Subject: Alert System API Migration - Action Required

Dear Development Team,

The Alert System API is being upgraded from legacy endpoints (/api/alerts/*) to 
v1 endpoints (/api/v1/alerts/*). Your application may be affected.

TIMELINE:
- Phase 1 (Current): Legacy endpoints deprecated but functional
- Phase 2 (Q2 2025): Deprecation warnings added to responses  
- Phase 3 (Q3 2025): Legacy endpoints removed

ACTION REQUIRED:
1. Review your application's usage of Alert System APIs
2. Plan migration to v1 endpoints using our migration guide
3. Update your integration before July 31, 2025

RESOURCES:
- Migration Guide: [Link]
- API Documentation: [Link]
- Support Channel: #alert-api-migration

SUPPORT:
Contact dev@newpennine.com for migration assistance.

Best regards,
NewPennine Development Team
```

### 2. Stakeholder Updates

**Status Report Template**:
```markdown
# Alert System API Migration Status Report

## Executive Summary
Migration from legacy Alert API endpoints to v1 endpoints is X% complete.

## Progress by Integration Type
- Web Applications: X/Y migrated (Z%)
- Mobile Applications: X/Y migrated (Z%)  
- Backend Services: X/Y migrated (Z%)
- Third-party Integrations: X/Y migrated (Z%)

## Risks and Mitigation
- **Risk**: [Description]
  **Mitigation**: [Plan]

## Timeline
- **Current Phase**: [Phase description]
- **Next Milestone**: [Date and description]
- **Completion Target**: [Date]

## Support Activity
- Migration requests handled: X
- Issues resolved: Y
- Critical issues pending: Z

## Next Steps
1. [Next step 1]
2. [Next step 2]
3. [Next step 3]
```

---

**Related Documentation**:
- [Migration Guide](./alert-system-migration-guide.md)
- [Breaking Changes](./alert-system-breaking-changes.md)
- [Error Code Reference](./alert-system-error-codes.md)
- [API Versioning Strategy](./api-versioning-strategy.md)