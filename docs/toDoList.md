## NPM Audit Vulnerabilities (To Be Addressed Later)

- **cookie <0.7.0 (Low Risk)**:
  - Issue: Accepts out-of-bounds characters in cookie name, path, and domain.
  - Source: Dependency of `@supabase/ssr` (<=0.5.2-rc.7).
  - Potential Fix: `npm audit fix --force` (upgrades `@supabase/ssr` to 0.6.1 - Breaking Change).
  - Action: Investigate `@supabase/ssr` v0.6.1 breaking changes before applying.

- **xlsx (High Risk)**:
  - Issue 1: Prototype Pollution in SheetJS.
  - Issue 2: SheetJS Regular Expression Denial of Service (ReDoS).
  - Potential Fix: No direct fix available currently.
  - Action: Evaluate impact on Excel export. Consider input validation, temporary feature restriction, or finding alternative libraries. Monitor SheetJS for patches.
