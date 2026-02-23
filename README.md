# ERP Dev Bench

Benchmark project for testing the FutureOfDev agency automation system.

## Structure

```
├── frontend/          Vue 3 + TypeScript (Vite)
├── backend/           Go + Gin API
└── benchmark/         Agency benchmark infrastructure
```

## Quick Start

```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend && go run ./cmd/main.go

# Benchmarks
cd benchmark && node runner.cjs batch
```

## Benchmark Tasks

| ID | Task | Difficulty | Files | Focus |
|----|------|------------|-------|-------|
| bench-001 | Items CRUD | Medium | 8 | Basic CRUD, table, form |
| bench-002 | Categories + Relation | Medium | 10 | Relations, dropdown |
| bench-003 | Request Logger | Hard | 10 | Middleware, filtering |

### Task 1: Items CRUD
- Backend: 5 endpoints (CRUD)
- Frontend: Table + Form components
- Store: Pinia items store

### Task 2: Categories + Item Relation
- Backend: 5 endpoints + Item relation
- Frontend: Category management + dropdown in ItemForm
- Integration: Items show category names

### Task 3: Request Logger
- Backend: Middleware + 2 endpoints
- Frontend: Logs viewer with filters + auto-refresh
- Features: Status filtering, method filtering, clear logs

## Benchmark CLI

```bash
cd benchmark

# Setup baseline (first time)
node runner.cjs setup

# Run benchmarks
node runner.cjs batch tasks/        # All tasks
node runner.cjs run tasks/bench-001.json  # Single task

# Generate report
node runner.cjs report

# Reset workspace
node runner.cjs reset               # Quick reset
node runner.cjs full-reset          # + reinstall
```

## Metrics

| Category | Metrics |
|----------|---------|
| Performance | Completion time, throughput, iterations |
| Quality | Lint score, test coverage, TypeScript |
| Agency | Success rate, KPI pass rate, PM accuracy |
| Cost | Token usage, $/task |
| Reliability | Crash recovery, retries |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /api/v1/health | Health check |
| * | /api/v1/items | Items CRUD (bench-001) |
| * | /api/v1/categories | Categories CRUD (bench-002) |
| GET | /api/v1/logs | Request logs (bench-003) |

## Tech Stack

**Frontend:** Vue 3, TypeScript, Vite, Pinia, Vue Router, Playwright  
**Backend:** Go 1.24, Gin, GORM, SQLite  
**Benchmark:** Node.js, custom collectors

## KPI Requirements

All tasks must pass 4 KPIs:

| KPI | Frontend | Backend |
|-----|----------|---------|
| Type Safety | `npm run type-check` | `go build` |
| Lint | `npm run lint` | `golangci-lint run` |
| Build | `npm run build` | `go build` |
| Tests | `npm run test:unit` | `go test ./...` |
