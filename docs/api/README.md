# API Documentation

## Overview

This directory contains API documentation for the Online Stock Control System (OSCS). As of August 2025, the Alert System has been completely removed from the platform for security and maintainability reasons.

## 🚨 Important Notice - Alert System Removal Complete

**The Alert System has been permanently removed as of August 13, 2025**

All Alert System endpoints (`/api/alerts/*` and `/api/v1/alerts/*`) have been completely removed and will return HTTP 404 Not Found responses. This removal was completed for security reasons following a comprehensive security audit.

## 📚 Current API Documentation

### Core API Endpoints

#### Authentication APIs
- `/api/auth/*` - User authentication and session management
- `/api/v1/auth/*` - Enhanced authentication with OAuth integration

#### Inventory Management APIs  
- `/api/inventory/*` - Stock control and inventory management
- `/api/v1/inventory/*` - Advanced inventory operations with real-time updates

#### Printing Services APIs
- `/api/printing/*` - Label printing and document generation
- `/api/v1/printing/*` - Enhanced printing with template management

#### System Management APIs
- `/api/system/*` - System configuration and health monitoring
- `/api/v1/system/*` - Advanced system management features

### API Versioning Strategy
- **Legacy APIs** (`/api/*`): Stable versions for backward compatibility
- **V1 APIs** (`/api/v1/*`): Enhanced versions with improved security and features
- **GraphQL Endpoint**: `/api/graphql` - For complex queries and real-time subscriptions

## 🚀 Quick Start Guide

### 1. API Authentication
```javascript
// Authenticate using JWT tokens
const response = await fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ email, password })
});
```

### 2. Making API Calls
```javascript
// Standard API response format
const response = await fetch('/api/v1/inventory/items');
const data = await response.json();

if (data.success) {
  return data.data; // Actual response data
} else {
  throw new Error(data.error);
}
```

### 3. Error Handling
```javascript
try {
  const result = await apiCall();
} catch (error) {
  if (error.status === 401) {
    // Handle authentication error
    redirectToLogin();
  } else if (error.status === 403) {
    // Handle authorization error
    showAccessDeniedMessage();
  }
}
```

## 🛠️ Development Tools

### API Testing Tools
- **GraphQL Playground**: Interactive GraphQL query interface
- **Swagger UI**: Auto-generated API documentation and testing
- **Postman Collection**: Complete API collection for all endpoints

### Code Generation Tools
```bash
# Generate TypeScript types from GraphQL schema
npm run codegen

# Generate API client code
npm run api:generate-client

# Validate API contracts
npm run api:validate
```

### Development Scripts
```bash
# Start development server
npm run dev

# Run API tests
npm run test:api

# Build production API
npm run build
```

## 📅 System Architecture History

| Phase | Date Range | Status | Description |
|-------|------------|---------|-------------|
| **Alert System** | 2024-2025 | ✅ Completed | Alert system completely removed for security reasons |
| **GraphQL Integration** | Q2 2025 | ✅ Active | Full GraphQL API implementation completed |
| **API V2 Planning** | Q4 2025 | 📅 Planned | Next generation API with enhanced performance |

### Recent Changes
- **August 13, 2025**: Alert System permanently removed
- **July 2025**: GraphQL API reached 100% feature coverage
- **June 2025**: Enhanced security implementation completed

## 🆘 Support & Resources

### Getting Help
- **API Support Team**: api-support@newpennine.com
- **Development Team**: dev@newpennine.com
- **Slack Channel**: #api-support
- **Emergency Support**: Available through support channels

### Development Assistance
- **Documentation**: Comprehensive API documentation available
- **Code Examples**: Sample implementations for common use cases
- **Testing Support**: Access to staging environments for development

### Community Resources
- **Developer Portal**: https://developer.newpennine.com
- **API Status Page**: https://status.newpennine.com
- **Release Notes**: https://docs.newpennine.com/releases
- **Community Forum**: https://community.newpennine.com

## 🔍 Additional Resources

### API Documentation
- [OpenAPI Interactive Explorer](https://api.newpennine.com/docs)
- [GraphQL Playground](https://api.newpennine.com/graphql) (v1.2+)
- [WebSocket API Docs](https://docs.newpennine.com/websocket) (v2.0+)

### SDK Documentation
- [JavaScript SDK](https://github.com/newpennine/js-sdk)
- [Python SDK](https://github.com/newpennine/python-sdk)
- [Go SDK](https://github.com/newpennine/go-sdk)
- [.NET SDK](https://github.com/newpennine/dotnet-sdk)

### Integration Examples
- [React Integration Example](https://github.com/newpennine/examples/tree/main/react-alerts)
- [Vue.js Integration Example](https://github.com/newpennine/examples/tree/main/vue-alerts)
- [Node.js Backend Example](https://github.com/newpennine/examples/tree/main/node-alerts)
- [React Native Mobile Example](https://github.com/newpennine/examples/tree/main/rn-alerts)

## 🧪 Testing Your Migration

### Integration Testing Checklist
- [ ] Authentication flow working correctly
- [ ] API response format validation
- [ ] Error handling for all HTTP status codes
- [ ] Query parameters and pagination
- [ ] Rate limiting compliance
- [ ] GraphQL queries and mutations
- [ ] Real-time subscriptions (if applicable)

### Performance Testing
- [ ] Response times within acceptable limits
- [ ] Memory usage optimized
- [ ] Error rates below 0.1%
- [ ] Concurrent request handling
- [ ] Database query performance

### Business Logic Testing
- [ ] Inventory management operations
- [ ] User authentication and authorization
- [ ] Printing service functionality
- [ ] Data integrity and validation

## 📊 API Monitoring and Analytics

Monitor your API usage and performance:

```bash
# Check API health status
npm run api:health-check

# Generate API usage report
npm run api:usage-report
```

### API Monitoring Dashboard
Access the API monitoring dashboard at:
https://console.newpennine.com/api/monitoring

**Dashboard Features**:
- Real-time API usage statistics
- Performance metrics and trends
- Error rates and response times
- Security alerts and notifications
- System health indicators

## ⚠️ Important Notes

1. **Alert System Removal**: All alert-related functionality has been permanently removed
2. **Security**: Enhanced security measures implemented across all endpoints
3. **Error Handling**: Standardized error response format across all APIs
4. **Testing**: Comprehensive testing required for all API integrations
5. **Documentation**: Keep API documentation up to date with latest changes
6. **Performance**: Monitor API performance and optimize as needed

---

## 📝 Document Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-15 | Initial documentation release |
| 1.0.1 | 2025-01-20 | Added migration tools section |
| 1.0.2 | 2025-01-25 | Updated testing checklist |

---

**Last Updated**: August 13, 2025  
**Document Version**: 2.0.0  
**API Version Coverage**: Legacy, V1.0, V1.1, GraphQL

For questions or suggestions about this documentation, please contact: docs@newpennine.com