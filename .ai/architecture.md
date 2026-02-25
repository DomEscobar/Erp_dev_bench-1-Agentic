# 📐 Architecture Standards

## 🏛 System Architecture

### Layered / Hexagonal Pattern
We enforce a strict layered architecture:
- **Frontend** (`/frontend/src/`): Presentation layer only. No business logic.
- **Backend** (`/backend/src/`): Domain logic and API endpoints.
- **Infrastructure** (`/infrastructure/iac/`): Deployment and operations.

### Contract-First Development
All Frontend ↔ Backend communication **must** be defined in `shared/contract.yaml` (OpenAPI 3.0 / TypeSchema). No ad-hoc API shapes.

### Database Design
- Every table **must** have:
  - `id` (UUID or auto-increment)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)
- **No** `SELECT *` queries; explicit field projection is required.
- All foreign keys **must** be indexed.

### Error Handling
- Public APIs return structured error objects with `code`, `message`, and `details`.
- Internal errors are logged to the central `logstore` with request correlation IDs.

## 🎨 Frontend Standards

### Component Boundaries
- One component per file.
- Filename: `PascalCase.tsx` (e.g., `ProductCard.tsx`).
- Test file: `PascalCase.test.tsx` in the same folder.

### State Management
- Use generated hooks from `contract.yaml` for server state.
- Client state (UI toggles, form drafts) may use React Context or Zustand.

### Data Attributes
- Every interactive element **must** have a `data-testid` attribute for QA automation.
- Format: `data-testid="component-action"` (kebab-case, descriptive).

## ⚙️ Backend Standards

### Language & Structure
- Go: Follow standard `golang/go` formatting. Packages grouped by domain.
- TypeScript: Use `strict` mode. No `any` in public APIs.

### Middleware Chain
All API routes **must** pass through:
1. Request logging (correlation ID injection)
2. Authentication/Authorization
3. Rate limiting (if applicable)
4. Validation (against `contract.yaml`)
5. Business logic
6. Response formatting

### Logging
- Use the centralized `logstore` at `/backend/internal/logstore`.
- All logs **must** include `request_id` and `user_id` (if authenticated).
