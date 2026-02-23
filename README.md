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

## Tech Stack

**Frontend:** Vue 3, TypeScript, Vite, Pinia, Playwright  
**Backend:** Go 1.24, Gin, GORM, SQLite  
**Benchmark:** Node.js, custom collectors
