# Interactive Analysis and Cleanup of Unused Files

## Overview
A comprehensive multi-agent workflow for analyzing and safely removing unused files through interactive verbal discussion. This command performs deep dependency analysis and provides real-time verbal feedback to ensure safe cleanup without breaking functionality.

## Command Syntax
```bash
/system-cleanup <target_path> [options]
```

### Arguments
- `<target_path>` - The file, folder, or pattern to analyze (supports glob patterns)
- `--dry-run` - Preview changes without deletion
- `--force` - Skip confirmation prompts (use with extreme caution)
- `--depth <n>` - Limit dependency search depth (default: unlimited)
- `--exclude <pattern>` - Exclude files matching pattern from analysis

## 🚨 Critical Safety Rules

### MUST FOLLOW
1. **NO DELETION WITHOUT CONFIRMATION** - Never perform any deletions until explicit user confirmation
2. **BACKUP FIRST** - Always suggest creating backups before any deletion
3. **TEST AFTER DELETION** - Recommend running tests after cleanup
4. **DOCUMENT CHANGES** - Update history documentation for all deletions

## 📊 Impact Severity Classification

### 🔴 **HIGH IMPACT** (Critical - Do Not Delete)
**Characteristics:**
- Core system dependencies
- Files imported by 5+ components
- Part of public API or exports
- Database migrations or schemas
- Configuration files (env, config, settings)
- Security-related files

**Action:** 
- ❌ **RETAIN** unless fully replaced
- Requires comprehensive testing before removal
- Need migration plan if deprecating

**Examples:**
```
- /src/core/auth/*
- /config/database.js
- /migrations/*.sql
- .env files
```

### 🟠 **MEDIUM IMPACT** (Caution Required)
**Characteristics:**
- Used by 2-4 components
- Feature-specific utilities
- Legacy code with partial usage
- Test files for active code
- Documentation for active features

**Action:**
- ⚠️ **REVIEW CAREFULLY** before removal
- Check for indirect dependencies
- May require refactoring dependent code
- Update imports after removal

**Examples:**
```
- /src/utils/helpers.js
- /components/deprecated/*
- /docs/legacy-features/*
```

### 🟢 **LOW IMPACT** (Safe to Remove)
**Characteristics:**
- Zero imports or references
- Commented out code
- Backup files (.bak, .old)
- Outdated documentation
- Duplicate files
- Empty folders
- Development/debug files

**Action:**
- ✅ **SAFE TO DELETE** after verification
- Quick manual check recommended
- Can be batch deleted

**Examples:**
```
- *.backup
- /tmp/*
- /src/components/unused/*
- .DS_Store files
```

## 🔄 Multi-Agent Workflow

### Phase 1: Discovery & Analysis

#### Step 0: Initial Investigation
**Agent:** [deployment-engineer](../agents/deployment-engineer.md)
```bash
# Tasks:
- Scan git history for recent modifications
- Check last access/modification timestamps
- Identify file type and structure
- Map initial dependency tree
```

#### Step 1: Code Quality Assessment
**Agent:** [code-reviewer](../agents/code-reviewer.md)
```bash
# Tasks:
- Identify technical debt indicators
- Check for duplicate code patterns
- Analyze code complexity metrics
- Flag deprecated API usage
```

### Phase 2: Dependency Analysis

#### Step 2: Import/Export Analysis
**Agent:** [code-reviewer](../agents/code-reviewer.md)
```bash
# Tasks:
- Trace all import statements
- Map export usage across codebase
- Check dynamic imports (require, import())
- Analyze indirect dependencies
- Check for lazy-loaded modules
```

**Output Format:**
```javascript
{
  "directImports": ["file1.js", "file2.tsx"],
  "indirectImports": ["via-file3.js"],
  "dynamicImports": ["runtime-load.js"],
  "exportedBy": ["index.js"],
  "importCount": 5
}
```

### Phase 3: System Impact Assessment

#### Step 3: Core System Analysis
**Agents:** 
- [code-reviewer](../agents/code-reviewer.md)
- [api-documenter](../agents/api-documenter.md)
- [architect-reviewer](../agents/architect-review.md)

```bash
# Tasks:
- Evaluate impact on card system architecture
- Check API endpoint dependencies
- Verify database schema references
- Analyze service layer impacts
- Review module boundaries
```

#### Step 4: Runtime Impact Assessment
**Agents:**
- [code-reviewer](../agents/code-reviewer.md)
- [security-auditor](../agents/security-auditor.md)
- [error-detective](../agents/error-detective.md)

```bash
# Tasks:
- Search error logs for file references
- Check runtime configuration usage
- Analyze performance implications
- Verify no active error handlers depend on files
- Check monitoring/logging references
```

#### Step 5: Security & Feature Impact
**Agents:**
- [code-reviewer](../agents/code-reviewer.md)
- [security-auditor](../agents/security-auditor.md)

```bash
# Tasks:
- Identify security feature dependencies
- Check authentication/authorization impacts
- Verify no loss of validation logic
- Ensure compliance requirements maintained
- Review data privacy implications
```

### Phase 4: Analysis Summary & Recommendations

#### Step 6: Verbal Report & Recommendations
**Agents:**
- [context-manager](../agents/context-manager.md)
- [code-reviewer](../agents/code-reviewer.md)

```bash
# Tasks:
- Aggregate all agent findings
- Provide verbal summary of impacts
- List specific recommendations
- Explain dependencies clearly
- Suggest safe deletion order
```

## 💬 Verbal Report Structure

The agents will provide an interactive verbal report covering:

1. **Quick Summary**
   - Total files analyzed
   - How many are safe to delete
   - Which ones need careful review
   - Critical files to keep

2. **Categorized Findings**
   - 🟢 **Safe to delete**: List files with reasons
   - 🟠 **Need review**: Explain dependencies and risks  
   - 🔴 **Must keep**: Clarify why they're critical

3. **Recommendations**
   - Suggested deletion order (safest first)
   - Required refactoring before deletion
   - Testing needed after cleanup

4. **Next Steps**
   - Await user confirmation for each category
   - Answer any questions about specific files
   - Provide deletion commands when approved

## 📢 Verbal Report Examples

### Example Opening
```
"I've analyzed 23 files in the /src/legacy folder. Here's what I found:
- 15 files are completely safe to delete (no dependencies)
- 5 files need review (used by 2-3 components)  
- 3 files are critical and must be kept

Let me walk you through each category..."
```

### Example File Discussion
```
"Looking at 'oldHelper.js':
- Status: 🟠 Medium Impact
- It's imported by 2 components: Dashboard and Settings
- These imports use only 1 function: formatDate()
- Recommendation: Move formatDate() to utils/date.js first, then delete
- Risk: Low if we refactor first

Do you want me to explain the refactoring process?"
```

### Example Confirmation Request
```
"Ready to proceed with deletion of 15 low-impact files:
- All backup files (*.bak, *.old)
- Empty folders
- Unused test fixtures
- Total size: 2.3MB

These have zero dependencies and zero imports.
Shall I create a backup first and then delete them?"
```

## 🎯 Execution Workflow

### Interactive Session Flow
```
1. User: /system-cleanup src/legacy/*
   
2. Agents: "Starting analysis of src/legacy/ folder..."
   [Analysis runs...]
   
3. Agents: "Analysis complete! Let me walk you through the findings..."
   [Verbal report begins]
   
4. User: "What about the helper.js file?"
   
5. Agents: "helper.js has 3 imports from Dashboard component..."
   [Detailed explanation]
   
6. User: "OK, delete the safe files first"
   
7. Agents: "Creating backup... Deleting 15 safe files... Done!"
   [Confirmation and next steps]
```

### Pre-Deletion Checklist
```bash
✓ All agents have completed analysis
✓ Impact assessment verbally communicated
✓ User questions answered
✓ Backup created
✓ Team notified (if high/medium impact)
✓ Tests passing
✓ Verbal confirmation received from user
```

### Deletion Execution
```bash
# 1. Create backup
tar -czf backup_$(date +%Y%m%d_%H%M%S).tar.gz [target_files]

# 2. Perform deletion (after confirmation)
rm -rf [confirmed_files]

# 3. Run validation
npm test
npm run lint
npm run build

# 4. Report results verbally
echo "✅ Deletion complete - all systems operational"
```

### Post-Deletion Verification
```bash
✓ Build successful
✓ Tests passing
✓ No runtime errors
✓ Verbal confirmation of completion
✓ Git commit created
```

### Completion Report (Verbal)
```
"Cleanup completed successfully:
- Deleted: [X files, Y folders]
- Space freed: [size in MB/GB]
- All tests passing
- Build time improved by [X%]
- No errors detected

Backup saved at: ./backups/[timestamp]
You can restore with: git checkout [commit] -- [files]"
```

## 🛡️ Safety Mechanisms

### Automatic Protections
1. **Protected Paths** - Never analyze/delete:
   ```
   - node_modules/
   - .git/
   - .env*
   - package*.json
   - tsconfig.json
   - critical config files
   ```

2. **Confirmation Requirements**
   - Interactive prompt for each severity level
   - Batch confirmation for low-impact files
   - Individual confirmation for medium/high impact

3. **Rollback Support**
   - Automatic backup before deletion
   - Git commit before changes
   - Restoration script generated

## 📊 Success Metrics (Verbal Report)

After cleanup, agents will report:
- **Code reduction**: "Removed X lines of unused code"
- **Size reduction**: "Freed up X MB/GB of disk space"
- **Complexity reduction**: "Reduced cyclomatic complexity by X%"
- **Build time improvement**: "Build time improved from Xs to Ys"
- **Test coverage**: "Coverage maintained at X% / improved to X%"

## 🔄 Continuous Improvement

### Regular Cleanup Schedule
- **Weekly**: Remove temporary files, logs
- **Monthly**: Analyze unused components
- **Quarterly**: Deep dependency audit
- **Annually**: Major refactoring review

### Integration Points
- Pre-commit hooks to prevent unused code
- CI/CD pipeline checks for dead code
- Automated dependency analysis reports
- Regular technical debt reviews

## ⚠️ Common Pitfalls to Avoid

1. **Dynamic Imports** - May not be detected by static analysis
2. **String References** - Files referenced via strings in code
3. **Configuration Files** - May be loaded at runtime
4. **Test Fixtures** - May appear unused but needed for tests
5. **Documentation Assets** - Images/files referenced in markdown
6. **Build Artifacts** - Generated files that shouldn't be deleted
7. **Third-party Dependencies** - Vendor files that look unused

## 📝 Command Examples

```bash
# Analyze single file
/system-cleanup src/old-component.tsx

# Analyze entire folder with dry run
/system-cleanup src/legacy/* --dry-run

# Exclude test files from analysis
/system-cleanup src/* --exclude "*.test.js"

# Limit dependency depth
/system-cleanup src/utils/* --depth 2

# Force deletion (dangerous!)
/system-cleanup tmp/* --force
```

## 🚀 Quick Start Guide

1. **Identify targets**: Choose files/folders to analyze
2. **Run analysis**: `/system-cleanup [target] --dry-run`
3. **Review verbal report**: Listen to impact assessment carefully
4. **Ask questions**: Clarify any concerns about dependencies
5. **Create backup**: `tar -czf backup.tar.gz [targets]`
6. **Confirm deletion**: Remove `--dry-run` and confirm prompts
7. **Verify system**: Run tests and check functionality

---

**Remember:** When in doubt, DON'T delete. It's always safer to keep questionable files than to break production. This tool is designed to assist decision-making through interactive discussion, not replace careful consideration.