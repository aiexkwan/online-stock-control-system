# Fix Error And Push To Github

## Target
- Fix all TypeScript,Eslint and Build issue, lastly push to github

## Agent Assign
- [Code Reviewer](../agents/code-reviewer.md)
- [TypeScript-Pro](../agents/typescript-pro.md)
- [Error Dective](../agents/error-detective.md)

## Workflow
1. Run `npm run lint` for existing `Eslint` error

2. [*If Any Error*]Invoke agents and fix `Eslint` error

3. Run `npm run typecheck` for existing `TypeScript` error

4. [*If Any Error*]Invoke agents and fix `TypeScript` error

5. Run `npm run build` for existing build error

6. [*If Any Error*]Invoke agents and fix `Build `error

7. Make second check and ensure every error been fixed

8. Ask user permission if push to Github, or do other else