# Analysis And Cleanup Not In Use Files/Docs

## Target
	- Investigate $ARGUMENTS and clean up based on user decision

## Reminder *MUST follow*
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

## Workflow By Different Agent

0. [Deployment Engineer](../agents/deployment-engineer.md)
	- Investigate whether $ARGUMENTS are still in use, have been recently updated or modified

1. [Code Reviewer](../agents/code-reviewer.md)
	- Analysis if still refered or related to old widget system

2. [Code Reviewer](../agents/code-reviewer.md)
	- Determine whether $ARGUMENTS are being imported/exported by any components
		- Either directly or indirectly

3. [Code Reviewer](../agents/code-reviewer.md) + [API Documentor](../agents/api-documenter.md) + [Architech Review](../agents/architect-review.md)
	- Analyse any potential impact on the new main core cards systm

4. [Code Reviewer](../agents/code-reviewer.md) + [Security Auditor](../agents/security-auditor.md) + [Error-Detect](../agents/error-detective.md)
	- Assess any impact on the current running system if $ARGUMENTS is deleted

5. [Code Reviewer](../agents/code-reviewer.md) + [Security Auditor](../agents/security-auditor.md)
	- Assess if any function or security festure maybe lost if if $ARGUMENTS is deleted

6. [Context Manager](../agents/context-manager.md) + [Docs Architech](../agents/docs-architect.md)
	- Summarize all agents research and build a detail result for user

## Concluation
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