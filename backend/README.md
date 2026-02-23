# ERP Dev Bench - Go Backend

Enterprise Resource Planning backend built with Go + Gin.

## Tech Stack

- **Framework**: Gin (v1.10+)
- **ORM**: GORM
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **Auth**: JWT
- **Validation**: go-playground/validator
- **Config**: Viper
- **Logging**: Zap
- **Testing**: testify + go-sqlmock

## Quick Start

```bash
# Run
make run

# Build
make build

# Test with coverage
make test
make coverage
```

## Project Structure

```
backend/
├── cmd/
│   └── main.go           # Entry point
├── internal/
│   ├── config/           # Configuration
│   ├── handlers/         # HTTP handlers
│   ├── middleware/       # Auth, logging
│   ├── models/           # GORM models
│   ├── repositories/     # Data access
│   ├── server/           # Server setup
│   └── services/         # Business logic
├── tests/
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── e2e/              # End-to-end tests
├── Dockerfile
├── Makefile
└── go.mod
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/health | Health check |
| POST | /api/v1/auth/register | Register user |
| POST | /api/v1/auth/login | Login |
| GET | /api/v1/users | List users (protected) |
| GET | /api/v1/products | List products (protected) |

## Testing

```bash
# Unit tests
go test ./tests/unit/... -v

# Integration tests
go test ./tests/integration/... -v

# All tests with coverage
make test
make coverage
```

## Docker

```bash
make docker
make docker-run
```
