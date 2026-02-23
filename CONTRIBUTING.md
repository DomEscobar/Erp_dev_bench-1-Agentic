# Contributing

## Development

```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend && go run ./cmd/main.go
```

## KPI Requirements

All changes must pass 4 KPIs:

1. **TypeScript** - No type errors
2. **Lint** - No ESLint errors
3. **Build** - Production build succeeds
4. **Tests** - All tests pass

## Commit Format

```
type: description

Types: feat, fix, refactor, docs, test, chore
```

## Branch Naming

- `feature/description`
- `fix/description`
- `refactor/description`
