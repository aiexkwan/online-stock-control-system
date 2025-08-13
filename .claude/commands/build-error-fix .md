# Fix Build Error from $ARGUMENTS of the list

## Target
- Fix all Build issue

## Agent Assign
- [Code Reviewer](../agents/code-reviewer.md)
- [TypeScript-Pro](../agents/typescript-pro.md)
- [Error Dective](../agents/error-detective.md)

## Workflow
- Invoke agenst
- Run `npm run build` for existing build error
- Fix error

## Rules
- Never use `any` type during fixing
- Which will only lead to more `build` error