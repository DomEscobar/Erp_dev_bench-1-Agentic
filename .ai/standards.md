# 📏 Coding & Quality Standards

## 🧪 Testing Policy
- **Required Coverage**: 80% line coverage for backend; 70% component coverage for frontend.
- **Test Types**:
  - Unit tests (fast, isolated)
  - Integration tests (API contract validation)
  - E2E tests (critical user journeys)
- **Location**: Tests live alongside code or in `/tests/` following the same directory structure.

## 🔒 Security Standards
- **Secrets Management**: Never commit secrets. Use environment variables (`process.env.*`).
- **SQL Injection**: All queries must be parameterized. Raw SQL is forbidden unless reviewed by the Skeptic.
- **XSS Prevention**: Frontend must escape all user-generated content. Use `dangerouslySetInnerHTML` only after sanitization.
- **Dependency Scanning**: Weekly `npm audit` / `go mod tidy` checks. Fail builds on high-severity vulnerabilities.

## 📝 Code Style
- **Go**: `gofmt` and `go vet` are mandatory. Use `golangci-lint` in CI.
- **TypeScript**: ESLint + Prettier with the following rules:
  - `@typescript-eslint/no-explicit-any`: error
  - `react-hooks/exhaustive-deps`: warning
  - `import/order`: organized by third-party → internal
- **Trailing Commas**: Always use for multi-line objects/arrays.

## 🏷️ Naming Conventions
- **Files**: `kebab-case.ts` for utilities; `PascalCase.tsx` for components.
- **Variables/Functions**: `camelCase`.
- **Types/Interfaces/Classes**: `PascalCase`.
- **Database Tables**: `snake_case` plural (e.g., `order_items`).

## 📦 Dependencies
- **Frontend**: No new dependencies without Skeptic approval (audit for bundle size, license).
- **Backend**: Prefer standard library. External packages must be vetted for maintenance status.

## 🚀 Commit Standards
- Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
- Every commit **must** reference a task ID from `/.agent_state/current_task.md`.
