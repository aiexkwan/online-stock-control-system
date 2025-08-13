# Analysis And Cleanup Not In Use Files/Docs

## Target
- Investigate $ARGUMENTS and clean up based on user decision

## Reminder *MUST follow*
- $ARGUMENTS can be of any type, including but not limited to:
	- Folders
	- Files
	- SQL files
	- JSON
	- TS/TSX
	- Others
- Do not perform any deletions until explicit confirmation is received from the user

## Impact Severity Guidelines
High 🔴
- Core dependency; deletion will break key features or cause major system errors
- Retain unless fully replaced; requires full regression testing before removal

Medium 🟠
- Used in non-critical features; may cause minor issues or require small fixes
- Remove only after alternative or patch is ready

Low 🟢
- Unused, outdated, or replaced with no active references
- Safe to delete after quick verification

## Preparation before starting workflow
0. Invoking and assign agents
	- [Search_Specialist](../agents/search-specialist.md)
	- [Code_Reviewer](../agents/code-reviewer.md)
	- [Backend_Arc](../agents/backend-architect.md)
	- [Api-documenter](../agents/api-documenter.md)
	- [Error-Detect](../agents/error-detective.md)
	- [Security-Aud](../agents/security-auditor.md)
	- [Architech-Review](../agents/architect-review.md)

## Workflow
0. **Initial Investigation**
   - *Ultrathink*
   - Investigate whether $ARGUMENTS are still in use, have been recently updated or modified

1. **Analysis Phase**
   - Analyse if still mentioning old widget system
   - Determine whether $ARGUMENTS are being imported/exported by any components — either directly or indirectly
   - Analyse any potential impact on the new main core [Card System](/Users/chun/Documents/PennineWMS/online-stock-control-system/app/(app)/admin/cards)
   - Assess any impact on the current running system if $ARGUMENTS is deleted

2. **Recommendation**
   - Provide professional suggestions to keep, remove or relocate $ARGUMENTS
   - Assign Impact Severity (High / Medium / Low)
   - Compile findings into a summary for user review

## Step-by-Step Execution Checklist
- [ ] Identify $ARGUMENTS to review
- [ ] Confirm file type (Folder / File / SQL / JSON / TSX / etc.)
- [ ] Check if $ARGUMENTS are imported by any component (directly/indirectly)
- [ ] Assess potential impact on Card System / current running system
- [ ] Assign Impact Severity (High / Medium / Low)
- [ ] Compile findings into a summary for user review
- [ ] Await explicit deletion confirmation from user
- [ ] Execute deletion (*only after confirmation*)
- [ ] Update [History Doc](../../docs/Others/History.md)