# Architecture

Project structure and conventions for ERP Dev Bench.

## Structure

```
├── frontend/           Vue 3 + TypeScript SPA
├── backend/            Go + Gin API
├── benchmark/          Agency benchmark infrastructure
└── docs/               Documentation
```

## Frontend

**Tech Stack:** Vue 3, TypeScript, Vite, Pinia, Vue Router, Playwright

```
frontend/
├── src/
│   ├── components/     Reusable UI components
│   ├── composables/    Vue composition functions
│   ├── design/         SCSS design tokens
│   ├── layouts/        Page layouts
│   ├── pages/          Route components
│   ├── router/         Route definitions
│   └── stores/         Pinia stores
├── e2e/                Playwright tests
└── public/             Static assets
```

**Naming:**
- Components: `PascalCase.vue` (e.g., `BaseButton.vue`)
- Composables: `useCamelCase.ts` (e.g., `useTheme.ts`)
- Stores: `camelCase.ts` (e.g., `counter.ts`)

## Backend

**Tech Stack:** Go 1.24, Gin, GORM, SQLite, Zap

```
backend/
├── cmd/                Entry points
│   └── main.go
├── internal/           Private app code
│   ├── config/         Configuration
│   ├── handlers/       HTTP handlers
│   ├── middleware/     HTTP middleware
│   ├── models/         GORM models
│   ├── repositories/   Data access
│   ├── services/       Business logic
│   └── server/         Server setup
├── pkg/                Public packages
├── tests/              Test suites
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── docs/               Swagger docs
```

**Naming:**
- Files: `snake_case.go`
- Handlers: `GetUser`, `CreateItem`
- Models: `PascalCase`
- Routes: `/api/v1/resource`

## API Endpoints

| Method | Path | Handler |
|--------|------|---------|
| GET | `/health` | HealthCheck |
| GET | `/api/v1/health` | HealthCheck |

## Layers

| Layer | Purpose | Directory |
|-------|---------|-----------|
| Handler | HTTP request/response | `internal/handlers/` |
| Service | Business logic | `internal/services/` |
| Repository | Data access | `internal/repositories/` |
| Model | Data structures | `internal/models/` |

## Testing

**Frontend:**
- Unit: `npm run test:unit` (Vitest)
- E2E: `npm run test:e2e` (Playwright)

**Backend:**
- All: `go test ./...`
- With coverage: `go test ./... -cover`

## KPI Requirements

Tasks must pass all 4 KPIs:

1. **TypeScript** - `npm run type-check` passes
2. **Lint** - `npm run lint` no errors
3. **Build** - `npm run build` succeeds
4. **Tests** - All tests pass
