# Fix Error And Push To Github

## Target
- Fix all TypeScript,Eslint and Build issue, lastly push to github

## Workflow for agent
1. [Eslint Fixer](../agents/eslint-fixer.md)
    - Run `npm run lint` for existing `Eslint` error
    - Run fix if any

2. [TypeScript-Pro](../agents/typescript-pro.md)
    - Run `npm run typecheck` for existing `TypeScript` error
    - Run fix if any

3. [Build Error Resolver](../agents/build-error-resolver.md)
    - Run `npm run build` for existing build error
    - Run fix if any

4. Make second check and ensure every error been fixed

5. Ask user permission if push to Github, or do other else