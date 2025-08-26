# Credential Management Security Guide

## Overview

This document provides guidelines for secure credential management in the Online Stock Control System. Following these practices helps prevent security breaches and unauthorized access to sensitive resources.

## Security Audit Status

Last audit: 2025-08-26
Status: ✅ Secured

## Key Security Principles

### 1. Never Commit Sensitive Information

**DO NOT** commit the following to version control:

- API Keys (OpenAI, Resend, etc.)
- Database credentials (Supabase service role keys)
- JWT tokens
- Passwords (including test passwords)
- Access tokens
- Private keys

### 2. Use Environment Variables

All sensitive credentials **MUST** be stored in environment variables:

```javascript
// ✅ CORRECT
const apiKey = process.env.OPENAI_API_KEY;

// ❌ WRONG - Never hardcode
const apiKey = 'sk-proj-abc123...';
```

### 3. File Configuration

#### Required Files

- `.env` - Local environment variables (NEVER commit)
- `.env.example` - Template with placeholder values (safe to commit)
- `.mcp.json` - MCP server configuration (NEVER commit)
- `.mcp.json.example` - Template configuration (safe to commit)

#### .gitignore Configuration

Ensure these entries exist in `.gitignore`:

```gitignore
# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Configuration files with sensitive data
.mcp.json
```

## Credential Types and Management

### 1. Supabase Credentials

```bash
# Public (safe in client-side code)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Private (server-side only)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ACCESS_TOKEN=your-access-token
```

### 2. API Keys

```bash
# OpenAI
OPENAI_API_KEY=sk-proj-...

# Email Service
RESEND_API_KEY=re_...
```

### 3. Test Credentials

```bash
# Use environment variables even for test credentials
TEST_SYS_LOGIN=test@example.com
TEST_SYS_PASSWORD=test-password
```

## Security Tools

### 1. Automated Security Audit

Run the security audit before committing:

```bash
./scripts/security-audit.sh
```

This script checks for:

- Hardcoded API keys
- JWT tokens in code
- Passwords in source files
- Tracked sensitive files

### 2. Credential Manager

Use the built-in credential manager for secure access:

```typescript
import { credentialsManager } from '@/lib/security/credentials-manager';

// Get validated credentials
const apiKey = credentialsManager.get('OPENAI_API_KEY');
```

### 3. Logger Sanitization

The logger automatically sanitizes sensitive data:

```typescript
import { logger } from '@/lib/logger';

// Sensitive data is automatically redacted
logger.info('User login', {
  email: user.email,
  password: 'will-be-redacted', // Automatically replaced with [REDACTED]
});
```

## Production Deployment

### Vercel Environment Variables

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add each credential as a separate environment variable
3. Select appropriate environments (Production, Preview, Development)
4. Never expose service role keys to client-side code

### Security Checklist

Before deploying to production:

- [ ] Run security audit script: `./scripts/security-audit.sh`
- [ ] Verify `.env` is not tracked in git
- [ ] Confirm all API keys are in environment variables
- [ ] Test with `.env.example` to ensure documentation is complete
- [ ] Review Vercel environment variables configuration
- [ ] Enable audit logging for credential access
- [ ] Set up key rotation schedule

## Key Rotation

Implement regular key rotation:

1. **Monthly**: Rotate test credentials
2. **Quarterly**: Rotate API keys (OpenAI, Resend)
3. **Bi-annually**: Rotate Supabase service keys
4. **Immediately**: If any key is suspected to be compromised

## Incident Response

If credentials are accidentally exposed:

1. **Immediately revoke** the exposed credentials
2. **Generate new credentials** from the service provider
3. **Update** all environment variables (local and production)
4. **Audit logs** for any unauthorized access
5. **Notify** the security team and affected stakeholders
6. **Document** the incident and prevention measures

## Development Best Practices

### Local Development

1. Copy `.env.example` to `.env`
2. Fill in your local credentials
3. Never share `.env` files between developers
4. Use different credentials for development and production

### Code Reviews

During code reviews, check for:

- Hardcoded credentials
- Proper use of environment variables
- Correct gitignore configuration
- Secure credential access patterns

### Testing

For testing, use:

- Mock credentials in test files
- Environment-specific test credentials
- Never use production credentials in tests

## Common Mistakes to Avoid

1. **Committing .env files** - Always check git status before committing
2. **Logging credentials** - Even for debugging, never log sensitive data
3. **Hardcoding "temporary" credentials** - No exceptions, always use env vars
4. **Sharing credentials via chat/email** - Use secure credential sharing tools
5. **Using production credentials locally** - Always use separate development credentials

## Resources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [OpenAI API Key Management](https://platform.openai.com/docs/guides/security)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [OWASP Secrets Management](https://owasp.org/www-project-secrets-management/)

## Contact

For security concerns or questions:

- Security Team: security@pennineindustries.com
- Report vulnerabilities: Use private security advisory on GitHub

---

Last Updated: 2025-08-26
Next Review: 2025-09-26
