# Security Checklist for Production Deployment

## Overview
This checklist provides comprehensive security verification steps for manual security audits. It covers critical security areas including authentication, authorization, data protection, and vulnerability prevention.

Last Updated: 2025-08-26
Version: 1.0.0

---

## Pre-Deployment Security Checklist

### 1. Authentication & Session Management

#### Password Security
- [ ] Minimum password length enforced (≥ 8 characters)
- [ ] Password complexity requirements implemented
- [ ] Password history tracking (prevent reuse of last 5 passwords)
- [ ] Account lockout after failed attempts (5 attempts)
- [ ] Password reset tokens expire within 1 hour
- [ ] Multi-factor authentication available for admin accounts

#### Session Security
- [ ] Session tokens use secure random generation
- [ ] Session timeout configured (30 minutes idle)
- [ ] Session invalidation on logout
- [ ] Concurrent session limits enforced
- [ ] Session tokens rotated after privilege changes
- [ ] HttpOnly and Secure flags set on session cookies

### 2. Authorization & Access Control

#### Role-Based Access Control
- [ ] User roles properly defined and documented
- [ ] Least privilege principle applied
- [ ] Admin functions restricted to admin roles
- [ ] Role changes logged and audited
- [ ] Privilege escalation protection in place

#### API Access Control
- [ ] All API endpoints require authentication
- [ ] API rate limiting implemented
- [ ] API keys rotated regularly (every 90 days)
- [ ] API access logged and monitored
- [ ] CORS policy properly configured

### 3. Input Validation & Sanitization

#### SQL Injection Prevention
- [ ] All database queries use parameterized statements
- [ ] Stored procedures validated for SQL injection
- [ ] Input validation on all user inputs
- [ ] Database error messages sanitized
- [ ] Database user permissions restricted

**Test Commands:**
```bash
# Test SQL injection protection
npm run test:sql-injection

# Manual test examples
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{"input": "1 OR 1=1"}'
```

#### Cross-Site Scripting (XSS) Prevention
- [ ] Output encoding for all user-generated content
- [ ] Content Security Policy (CSP) headers configured
- [ ] JavaScript execution in user content disabled
- [ ] HTML sanitization library implemented
- [ ] DOM-based XSS protection in place

**Test Vectors:**
```javascript
// Common XSS test strings
const xssTestVectors = [
  '<script>alert(1)</script>',
  '"><script>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
  'javascript:alert(1)',
  '<svg onload=alert(1)>'
];
```

#### Cross-Site Request Forgery (CSRF) Protection
- [ ] CSRF tokens generated for all state-changing operations
- [ ] CSRF tokens validated on server-side
- [ ] SameSite cookie attribute configured
- [ ] Referrer validation implemented
- [ ] Double-submit cookie pattern used

### 4. Data Protection

#### Sensitive Data Handling
- [ ] PII data encrypted at rest
- [ ] PII data encrypted in transit (TLS 1.2+)
- [ ] Sensitive data masked in logs
- [ ] Credit card data PCI-DSS compliant
- [ ] Personal data deletion policy implemented

#### Encryption Standards
- [ ] Strong encryption algorithms used (AES-256)
- [ ] Secure key management system in place
- [ ] Keys rotated regularly
- [ ] Encryption keys stored separately from data
- [ ] TLS certificates valid and not expired

### 5. Error Handling & Logging

#### Error Messages
- [ ] Generic error messages for users
- [ ] Detailed errors logged server-side only
- [ ] Stack traces never exposed to users
- [ ] Database errors sanitized
- [ ] File paths not revealed in errors

#### Security Logging
- [ ] Authentication attempts logged
- [ ] Authorization failures logged
- [ ] Input validation failures logged
- [ ] Security exceptions logged
- [ ] Log retention policy defined (90 days minimum)

### 6. File Upload Security

#### Upload Validation
- [ ] File type validation (whitelist approach)
- [ ] File size limits enforced
- [ ] Filename sanitization
- [ ] Anti-virus scanning implemented
- [ ] Upload directory outside webroot

**Allowed File Types:**
```javascript
const ALLOWED_EXTENSIONS = [
  '.pdf', '.png', '.jpg', '.jpeg', '.gif',
  '.doc', '.docx', '.xls', '.xlsx', '.csv'
];

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv'
];
```

### 7. Security Headers

#### HTTP Security Headers
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] X-XSS-Protection: 1; mode=block
- [ ] Strict-Transport-Security configured
- [ ] Content-Security-Policy implemented
- [ ] Referrer-Policy: strict-origin-when-cross-origin

**Verification Command:**
```bash
# Check security headers
curl -I https://your-domain.com | grep -E "X-Frame-Options|X-Content-Type-Options|X-XSS-Protection|Strict-Transport-Security|Content-Security-Policy"
```

### 8. Database Security

#### Database Configuration
- [ ] Default database accounts disabled
- [ ] Strong passwords for database users
- [ ] Database connections use SSL/TLS
- [ ] Database ports not publicly exposed
- [ ] Regular database backups configured

#### Row-Level Security (RLS)
- [ ] RLS policies defined for all tables
- [ ] RLS policies tested for each role
- [ ] Service role usage minimized
- [ ] Anonymous access properly restricted
- [ ] Policy bypass scenarios documented

**RLS Test Queries:**
```sql
-- Test user access restrictions
SET ROLE authenticated_user;
SELECT * FROM sensitive_table;

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### 9. Third-Party Dependencies

#### Dependency Management
- [ ] All dependencies from trusted sources
- [ ] Dependencies regularly updated
- [ ] Security vulnerabilities scanned (npm audit)
- [ ] License compliance verified
- [ ] Unused dependencies removed

**Security Scanning Commands:**
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Check outdated packages
npm outdated

# License compliance check
npx license-checker --summary
```

### 10. API Security

#### GraphQL Security
- [ ] Query depth limiting implemented
- [ ] Query complexity analysis enabled
- [ ] Introspection disabled in production
- [ ] Rate limiting per query complexity
- [ ] Field-level authorization implemented

#### REST API Security
- [ ] Input validation on all endpoints
- [ ] Output filtering for sensitive data
- [ ] Proper HTTP methods used (GET, POST, PUT, DELETE)
- [ ] API versioning implemented
- [ ] Deprecated endpoints monitored

### 11. Infrastructure Security

#### Server Configuration
- [ ] Unnecessary services disabled
- [ ] Firewall rules configured
- [ ] SSH key-based authentication only
- [ ] Regular security updates applied
- [ ] Intrusion detection system active

#### Container Security
- [ ] Base images from trusted sources
- [ ] Container images regularly updated
- [ ] Secrets not hardcoded in images
- [ ] Container runtime security configured
- [ ] Resource limits defined

### 12. Incident Response

#### Preparedness
- [ ] Incident response plan documented
- [ ] Security contact list maintained
- [ ] Backup restoration tested
- [ ] Security monitoring alerts configured
- [ ] Post-incident review process defined

---

## Security Testing Procedures

### Manual Penetration Testing

#### 1. Authentication Bypass Attempts
```bash
# Test direct access to protected routes
curl -X GET http://localhost:3000/admin

# Test with invalid tokens
curl -X GET http://localhost:3000/admin \
  -H "Authorization: Bearer invalid-token"

# Test expired tokens
curl -X GET http://localhost:3000/admin \
  -H "Authorization: Bearer expired-token"
```

#### 2. SQL Injection Testing
```bash
# Test various injection patterns
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "1'"'"' OR '"'"'1'"'"'='"'"'1"}'

curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "1; DROP TABLE users; --"}'
```

#### 3. XSS Testing
```bash
# Test reflected XSS
curl -X GET "http://localhost:3000/search?q=<script>alert(1)</script>"

# Test stored XSS
curl -X POST http://localhost:3000/api/comments \
  -H "Content-Type: application/json" \
  -d '{"comment": "<img src=x onerror=alert(1)>"}'
```

#### 4. CSRF Testing
```html
<!-- Test CSRF attack -->
<form action="http://localhost:3000/api/transfer" method="POST">
  <input type="hidden" name="amount" value="1000">
  <input type="hidden" name="to" value="attacker">
</form>
<script>document.forms[0].submit();</script>
```

#### 5. File Upload Testing
```bash
# Test malicious file upload
curl -X POST http://localhost:3000/api/upload \
  -F "file=@malicious.exe"

# Test file size limit
dd if=/dev/zero of=large.file bs=1M count=100
curl -X POST http://localhost:3000/api/upload \
  -F "file=@large.file"
```

### Automated Security Scanning

#### 1. Dependency Scanning
```bash
# npm audit
npm audit --audit-level=moderate

# Snyk scanning
npx snyk test

# OWASP dependency check
dependency-check --scan . --format HTML --out dependency-report.html
```

#### 2. Code Security Analysis
```bash
# ESLint security plugin
npx eslint . --ext .js,.jsx,.ts,.tsx

# Semgrep security scanning
semgrep --config=auto .

# GitHub CodeQL
gh codeql database create mydb --language=javascript
gh codeql database analyze mydb javascript-security-extended
```

#### 3. Infrastructure Scanning
```bash
# Port scanning
nmap -p- localhost

# SSL/TLS testing
testssl.sh https://your-domain.com

# Security headers testing
python -m http.client your-domain.com 443
```

---

## Security Metrics & KPIs

### Key Security Metrics to Track

1. **Authentication Metrics**
   - Failed login attempts per hour
   - Average session duration
   - Password reset requests per day
   - MFA adoption rate

2. **Authorization Metrics**
   - Unauthorized access attempts
   - Privilege escalation attempts
   - API authentication failures
   - Role change frequency

3. **Vulnerability Metrics**
   - Time to patch critical vulnerabilities
   - Number of security incidents per month
   - False positive rate in security alerts
   - Security training completion rate

4. **Compliance Metrics**
   - Security audit findings
   - Policy compliance rate
   - Security control effectiveness
   - Incident response time

---

## Security Review Schedule

### Daily Checks
- [ ] Review security monitoring dashboards
- [ ] Check for failed authentication attempts
- [ ] Review security alert notifications
- [ ] Monitor API rate limiting violations

### Weekly Reviews
- [ ] Analyze security logs
- [ ] Review user access patterns
- [ ] Check for dependency updates
- [ ] Verify backup integrity

### Monthly Audits
- [ ] Comprehensive security scan
- [ ] Penetration testing
- [ ] Security policy review
- [ ] Incident response drill

### Quarterly Assessments
- [ ] Full security audit
- [ ] Third-party security assessment
- [ ] Security training review
- [ ] Policy and procedure updates

---

## Emergency Response Procedures

### Security Incident Response

1. **Immediate Actions**
   - Isolate affected systems
   - Preserve evidence
   - Notify security team
   - Begin incident logging

2. **Investigation Steps**
   - Determine scope of breach
   - Identify attack vector
   - Assess data exposure
   - Document timeline

3. **Remediation Actions**
   - Patch vulnerabilities
   - Reset compromised credentials
   - Update security controls
   - Implement additional monitoring

4. **Post-Incident Activities**
   - Conduct post-mortem review
   - Update security procedures
   - Notify affected parties
   - Submit compliance reports

---

## Security Contacts

| Role | Contact | Escalation |
|------|---------|------------|
| Security Lead | security@company.com | Primary |
| DevOps Lead | devops@company.com | Secondary |
| CTO | cto@company.com | Executive |
| External Security | vendor@security.com | Third-party |

---

## Compliance Requirements

### Regulatory Compliance
- [ ] GDPR compliance verified
- [ ] PCI-DSS requirements met
- [ ] SOC 2 controls implemented
- [ ] ISO 27001 standards followed
- [ ] Industry-specific regulations addressed

### Documentation Requirements
- [ ] Security policies documented
- [ ] Incident response plan updated
- [ ] Data retention policies defined
- [ ] Privacy policy current
- [ ] Security training materials available

---

## Security Tools & Resources

### Recommended Security Tools
- **Vulnerability Scanning**: OWASP ZAP, Burp Suite
- **Dependency Checking**: Snyk, npm audit, Dependabot
- **Code Analysis**: SonarQube, Semgrep, CodeQL
- **Monitoring**: Datadog, New Relic, ELK Stack
- **Secret Management**: HashiCorp Vault, AWS Secrets Manager

### Security References
- OWASP Top 10: https://owasp.org/Top10/
- CWE Top 25: https://cwe.mitre.org/top25/
- NIST Cybersecurity Framework: https://www.nist.gov/cyberframework
- Security Best Practices: https://cheatsheetseries.owasp.org/

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2025-08-26 | Initial security checklist | Security Team |

---

## Checklist Completion

**Reviewer:** _______________________
**Date:** _______________________
**Signature:** _______________________

**Approval:** _______________________
**Date:** _______________________
**Signature:** _______________________