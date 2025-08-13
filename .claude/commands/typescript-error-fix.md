# Fix Typescript Error from $ARGUMENTS of the list

## Target
- Fix all Typescript issue

## Rules
- Never use `any` type during fixing
- Which will only lead to more `Eslint` error

## Agent Assign
- [Code Reviewer](../agents/code-reviewer.md)
- [TypeScript-Pro](../agents/typescript-pro.md)
- [Error Dective](../agents/error-detective.md)

## Workflow
- Invoke agenst
- Run `npm run typecheck` for existing TypeScript error
- Fix error