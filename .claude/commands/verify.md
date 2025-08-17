# Verify Accuracy of Claimed Progress

## Description
Performs comprehensive verification of claimed project progress by analyzing actual code, deployments, and deliverables against reported completion status. Provides detailed audit report with evidence-based findings.

## Target
- Conduct thorough and complete verification of $ARGUMENTS stated progress and completion claims
- Identify discrepancies between reported and actual progress
- Provide evidence-based assessment of true completion status
- Generate actionable recommendations for addressing gaps

## Pre-Workflow Preparation

### Agent Assignment
Invoke and assign the following specialized agents:
- **[code-reviewer](../agents/code-reviewer.md)** - Analyze code quality and completeness
- **[security-auditor](../agents/security-auditor.md)** - Verify security requirements implementation
- **[progress-auditor](../agents/progress-auditor.md)** - Lead audit and compile findings
- **[test-automator](../agents/test-automator.md)** - Verify test coverage and results
- **[deployment-engineer](../agents/deployment-engineer.md)** - Check deployment status
- **[database-optimizer](../agents/database-optimizer.md)** - Verify database changes if applicable

### Access Requirements
Ensure access to:
- [ ] Source code repository (all branches)
- [ ] Project documentation and reports
- [ ] CI/CD pipelines and build logs
- [ ] Test results and coverage reports
- [ ] Deployment environments (staging/production)
- [ ] Project management tools
- [ ] Database schemas and migrations
- [ ] API documentation and endpoints

## Core Principles

### Trust Nothing, Verify Everything
- **NEVER** accept any statement in documents at face value
- **ALWAYS** seek concrete evidence in codebase and systems
- **VERIFY** every claim with multiple sources of truth
- **DOCUMENT** all evidence supporting or contradicting claims

### Evidence Hierarchy
1. **Production deployment** - Highest trust
2. **Passing tests in CI/CD** - High trust
3. **Code in main branch** - Medium trust
4. **Code in feature branches** - Low trust
5. **Documentation only** - Requires verification

## Detailed Workflow

### Phase 0: Document Analysis
1. Parse $ARGUMENTS document thoroughly
2. Extract all progress claims and percentages
3. List all deliverables mentioned
4. Identify milestones and deadlines
5. Note any assumptions or dependencies
6. Create verification checklist from claims

### Phase 1: Repository Investigation
```bash
# Check git activity
git log --since="[project_start_date]" --stat
git shortlog -sn --all
git branch -a --sort=-committerdate

# Analyze code changes
git diff --stat [baseline_commit] HEAD
cloc . --exclude-dir=node_modules,dist,build

# Check recent activity
git log --oneline --graph --all --since="1 week ago"
```

**Verify:**
- [ ] Commit frequency matches claimed development pace
- [ ] Feature branches align with reported features
- [ ] Code changes substantial enough for claimed progress
- [ ] Authors match team members working on project
- [ ] Merge patterns indicate completed features

### Phase 2: Feature Verification
For each claimed feature:
1. Locate implementation in codebase
2. Check completeness of implementation
3. Verify integration with other components
4. Test functionality if possible
5. Review associated tests
6. Check documentation updates

**Evidence Collection:**
- Screenshot of working features
- Code snippets proving implementation
- Test execution results
- API endpoint responses
- Database schema changes

### Phase 3: Infrastructure & Deployment Check

#### Supabase Verification
```sql
-- Check RPC functions
SELECT routine_name, created, last_altered 
FROM information_schema.routines 
WHERE routine_type = 'FUNCTION';

-- Verify tables and schemas
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check row counts for data population
SELECT 'table_name', COUNT(*) FROM table_name;
```

#### GraphQL Schema Verification
- Compare schema definition with implementation
- Test all queries and mutations
- Verify resolver implementations
- Check error handling
- Validate authorization rules

#### Deployment Status
- [ ] Staging environment deployed and functional
- [ ] Production deployment completed
- [ ] Environment variables configured
- [ ] SSL certificates valid
- [ ] Monitoring and logging active
- [ ] Backup procedures in place

### Phase 4: Quality Assurance Verification

#### Test Coverage Analysis
```bash
# Run test suite with coverage
npm test -- --coverage
pytest --cov=. --cov-report=html

# Check test results
cat coverage/lcov-report/index.html
```

**Verify:**
- Overall coverage percentage
- Critical path coverage
- Edge case handling
- Integration test presence
- E2E test results

#### Security Audit
- [ ] Authentication implemented correctly
- [ ] Authorization checks in place
- [ ] Input validation present
- [ ] SQL injection prevention
- [ ] XSS protection implemented
- [ ] Sensitive data encrypted
- [ ] Security headers configured

### Phase 5: Documentation Review
- [ ] README updated with setup instructions
- [ ] API documentation complete
- [ ] Database schema documented
- [ ] Deployment guide available
- [ ] User documentation prepared
- [ ] Changelog maintained
- [ ] Known issues documented

### Phase 6: Performance & Monitoring
```bash
# Check performance metrics
lighthouse [URL] --output json --output-path ./lighthouse-report.json

# API response times
curl -w "@curl-format.txt" -o /dev/null -s [API_ENDPOINT]
```

**Verify:**
- Page load times acceptable
- API response times within SLA
- Database query performance optimized
- Resource usage within limits
- Error rates acceptable

## Audit Report Structure

### 1. Executive Summary
```markdown
## Executive Summary

**Project:** [Project Name]
**Audit Date:** [Date]
**Claimed Completion:** [X]%
**Verified Completion:** [Y]%
**Risk Level:** [Critical|High|Medium|Low]

### Key Findings
- Finding 1 with evidence
- Finding 2 with evidence
- Finding 3 with evidence

### Critical Gaps
- Gap 1 and impact
- Gap 2 and impact
```

### 2. Detailed Findings

For each major component/feature:
```markdown
### [Component/Feature Name]

**Claimed Status:** [Status and percentage]
**Actual Status:** [Verified status and percentage]
**Evidence:** 
- [Specific evidence point 1]
- [Specific evidence point 2]

**Gaps Identified:**
- [ ] Gap 1
- [ ] Gap 2

**Risk Assessment:** [Risk level and explanation]
```

### 3. Evidence Documentation
```markdown
## Evidence Collected

### Code Evidence
- Commit hash: [hash] - [description]
- File: [path] - [what it proves]
- Test result: [result] - [implication]

### System Evidence
- Screenshot: [description and location]
- Log entry: [relevant log demonstrating status]
- Metric: [performance/quality metric]
```

### 4. Variance Analysis
```markdown
## Variance Analysis

| Component | Claimed | Actual | Variance | Impact |
|-----------|---------|--------|----------|--------|
| Feature A | 100%    | 75%    | -25%     | High   |
| Feature B | 80%     | 80%    | 0%       | None   |
| Feature C | 50%     | 10%    | -40%     | Critical |
```

### 5. Risk Assessment
```markdown
## Risk Assessment

### Critical Risks
1. [Risk description] - [Mitigation required]

### High Risks
1. [Risk description] - [Recommended action]

### Medium Risks
1. [Risk description] - [Suggested improvement]
```

### 6. Recommendations
```markdown
## Recommendations

### Immediate Actions (Within 24 hours)
1. [Action item with owner]
2. [Action item with owner]

### Short-term Actions (Within 1 week)
1. [Action item with owner]
2. [Action item with owner]

### Long-term Improvements
1. [Improvement suggestion]
2. [Improvement suggestion]
```

### 7. Appendices
```markdown
## Appendices

### A. Test Coverage Report
[Summary of test coverage data]

### B. Performance Metrics
[Performance testing results]

### C. Security Scan Results
[Security audit findings]

### D. Complete File List Reviewed
[List of all files and resources examined]
```

## Output Format

The audit report should be:
1. Generated as a markdown file
2. Include timestamp and version
3. Contain hyperlinks to evidence
4. Be digitally signed/checksummed
5. Stored in project repository under `/audit-reports/`

## Post-Audit Actions

1. **Present findings** to project stakeholders
2. **Track remediation** of identified gaps
3. **Schedule follow-up** audit if needed
4. **Update project plan** based on actual progress
5. **Document lessons learned** for future projects

## Command Options

```bash
# Basic audit
/audit-progress project_status_report.md

# Comprehensive audit with specific focus
/audit-progress project_status_report.md --focus=security,performance

# Quick audit (essential checks only)
/audit-progress project_status_report.md --quick

# Audit with comparison to previous
/audit-progress project_status_report.md --baseline=last_week_report.md
```

## Success Criteria

The audit is considered complete when:
- [ ] All claimed deliverables verified
- [ ] All code repositories examined
- [ ] All deployments checked
- [ ] All tests reviewed
- [ ] Evidence documented for all findings
- [ ] Risk assessment completed
- [ ] Recommendations provided
- [ ] Report reviewed and finalized

## Notes

- Always maintain professional objectivity
- Focus on facts and evidence, not opinions
- Provide constructive feedback alongside criticism
- Recognize genuine achievements while identifying gaps
- Ensure findings are reproducible and verifiable