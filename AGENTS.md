# AGENTS.md
> INSTRUCTION FOR AI AGENT: Read this entire file before writing any code, creating any
> file, or answering any coding question in this project. Treat every rule here as
> non-negotiable for this session. Do not proceed until you have fully read this file.
> Last updated: June 2026 — validated against actual repository by GPT-5 code review.

---

## 1. Project Overview

- **Project name:** CASRR (FHN-CASRR)
- **Type:** Existing enterprise monorepo — brownfield project
- **Domain:** Loan and risk review management
- **Monorepo root folders:**
  `frontend/`, `backend/`, `docs/`, `discovery/`, `pipelines/`, `azure-pipelines/`,
  `scripts/`, `tools/`, `legacy/`
- All new code must integrate seamlessly into the existing codebase.
- Do NOT introduce new patterns, abstractions, or dependencies unless explicitly stated.

---

## 2. Tech Stack (Non-Negotiable)

### Frontend
| Concern | Technology | Rule |
|---|---|---|
| Framework | **Next.js (App Router)** | Uses `app/` directory with nested `page.tsx` files. No `pages/` directory. No React Router. |
| Language | **TypeScript (.tsx / .ts)** | All files must be `.tsx` (components) or `.ts` (hooks, services, utils). No `.jsx` or `.js`. |
| Styling | **Tailwind CSS** | `tailwind.config.ts` exists. No inline styles, no CSS Modules, no MUI, no Bootstrap. |
| State Management | **Context API** | No Redux, Zustand, Jotai, or any other state library. |
| Data Fetching | **`useEffect` + native `fetch`** | `@tanstack/react-query` is present in `package.json` but must NOT be used for new code. All new data fetching uses `useEffect` + native `fetch` via the service + hook layer. Do not add new `useQuery` or `useMutation` calls. |
| Routing | **Next.js App Router** | New pages go in `frontend/src/app/<route>/page.tsx`. Use Next.js `<Link>` from `next/link`. No react-router-dom. |
| Config files | `next.config.mjs`, `tailwind.config.ts`, `tsconfig.json`, `postcss.config.js` | Do not modify unless explicitly asked. |

### Backend
| Concern | Technology | Rule |
|---|---|---|
| Solution | `casrr.sln` | 4 core projects + test projects (see Section 3) |
| Framework | **ASP.NET Core Web API** | Entry point is `Casrr.Api` project. |
| Architecture | **Clean Architecture** | 4 layers: `Casrr.Api`, `Casrr.Application`, `Casrr.Domain`, `Casrr.Infrastructure`. See rules below. |
| ORM / Data Access | **Raw ADO.NET (SqlClient) + Dapper** | See Section 3 for details. EF Core DbContext exists but repositories use SqlClient/Dapper. |
| Authentication | **Azure AD — JWT Bearer via Microsoft.Identity.Web** | See Section 2 Auth details below. |
| Language | **C#** | Follow existing naming conventions in the codebase. |

### Authentication (Critical — previously wrong in this document)
- Authentication uses **Azure AD JWT Bearer** via `Microsoft.Identity.Web` (`AddMicrosoftIdentityWebApi`
  or `AddJwtBearer`), wired in `Casrr.Api/Extensions/StartupExtensions.cs`.
- Swagger includes `Bearer` and Graph token security schemes.
- All controllers use **`[Authorize]` with named policies**, not bare `[Authorize]`.
  - Example from existing code: `[Authorize(Policy = "RequireActiveUser")]`
  - Other existing policies: `Commercial.Admin`, `Commercial.ReadOnly`
- Graph API dependencies exist under `Casrr.Api/Auth/Graph/`.
- ❌ This is NOT Windows/AD authentication. Do NOT use bare `[Authorize]` without a policy.
- ❌ Do NOT add new auth schemes or new policies — use existing ones only.
- When generating a new controller, always ask: **"Which existing policy applies to this resource?"**
  and use `[Authorize(Policy = "<ExistingPolicyName>")]`.

### Database
| Concern | Rule |
|---|---|
| Server | SQL Server (non-Local environments). Local environment may use Access repositories. |
| Environment policy | `DataExtensions` enforces: Local = Access or SQL allowed; non-Local = SQL Server only. Do NOT bypass this. |
| ORM | Raw ADO.NET (`SqlConnection` / `SqlCommand` / `SqlParameter`) is the current repository pattern. |
| Dapper | Dapper.dll is referenced in the solution and may be used for object mapping in repositories. |
| EF Core DbContext | `CasrrDbContext` exists (file: `Infrastructure/SqlServer/Backend_TemplateDbContext.cs`) but is NOT used for all repositories. Only add to it if explicitly instructed. |
| Migrations | Do NOT auto-generate EF migrations unless explicitly asked. Flag with `// DEVELOPER: Run Add-Migration` |
| Rowversion columns | Map as `byte[]` — always exclude from create/update payloads. |

---

## 3. Architecture Rules

### Backend Project Structure (Actual)
```
casrr.sln
backend/src/
  Casrr.Api/                        ← Presentation layer
    Auth/
      Graph/                        ← Graph API auth helpers
    Controllers/                    ← REST controllers
    Extensions/
      StartupExtensions.cs          ← Auth wiring (AddMicrosoftIdentityWebApi etc.)
    Middleware/
    Telemetry/
    Properties/
    wwwroot/
    Program.cs
  Casrr.Application/                ← Application layer
    I<Entity>Repository.cs          ← Interfaces live at PROJECT ROOT (not in Interfaces/ subfolder)
    Reviews/
      Contracts/                    ← DTOs/contracts live here (not in DTOs/ subfolder)
      Services/
  Casrr.Domain/                     ← Domain layer
    (pure C# domain models)
  Casrr.Infrastructure/             ← Infrastructure layer
    SqlServer/
      Backend_TemplateDbContext.cs  ← EF DbContext (CasrrDbContext)
      Sql<Entity>Repository.cs      ← Repository implementations using raw ADO.NET
backend/Unit Tests/
  (test projects — do not modify unless asked)
```

### Backend Layer Rules
| Layer | What goes here | What does NOT go here |
|---|---|---|
| `Casrr.Api` | Controllers, Auth, Middleware, Extensions, Telemetry, Program.cs | Business logic, DB access |
| `Casrr.Application` | Repository interfaces (`I<Entity>Repository.cs` at project root), Contracts/DTOs under `Reviews/Contracts/` | EF Core, SqlClient, HttpContext |
| `Casrr.Domain` | Pure C# domain/entity classes | EF attributes, SqlClient, HTTP concerns |
| `Casrr.Infrastructure` | `Sql<Entity>Repository.cs` under `SqlServer/`, DbContext | Controllers, HTTP concerns |

- Controllers call repository interfaces only — no direct DB access in controllers.
- Repository implementations use `SqlConnection` / `SqlCommand` / `SqlParameter` (raw ADO.NET).
- Dapper may be used for object mapping within repositories.
- Always use `async/await` — no synchronous DB calls.
- DTOs / contracts go in `Casrr.Application/Reviews/Contracts/` (not in a `DTOs/` folder).
- New repository interfaces go at `Casrr.Application/I<Entity>Repository.cs` (project root level).
- Register new repositories in `StartupExtensions.AddDataProviders()` in `Casrr.Api/Extensions/StartupExtensions.cs`
  (this method is invoked from `Program.cs` — do NOT register directly in `Program.cs`).
  Add `// DEVELOPER: Register in StartupExtensions.AddDataProviders()` comment on the interface declaration.

### Frontend File Structure (Actual)
```
frontend/src/
  app/                              ← Next.js App Router — route segments as folders
    maintenance/
      covenants/
        page.tsx                    ← existing pattern to follow
      cas-findings/
        page.tsx
      <new-feature>/
        page.tsx                    ← NEW pages go here
    review/
      [ecif]/
        review-info/
          components/               ← Co-located components allowed under route folders
            sections/
              hooks/                ← Co-located hooks allowed under route folders
    admin/
      users/
        types.ts                    ← Route-local types allowed (see types rule below)
  components/                       ← SHARED components used across multiple routes
  hooks/                            ← Shared hooks used across multiple routes
  models/                           ← Shared/global TypeScript interfaces and types
  services/
    api/                            ← API service files live HERE (e.g. covenants.ts)
  lib/                              ← Utility/helper functions
  auth/                             ← Auth-related code — do NOT modify
```

### Frontend File Convention Rules
- **New maintenance pages:** `frontend/src/app/maintenance/<feature-name>/page.tsx`
- **Service files:** `frontend/src/services/api/<resource>.ts`
  - Named by resource noun only — NO `Service` suffix. Use `covenants.ts` not `covenantsService.ts`.
  - Match existing examples: `covenants.ts`, `samples.ts`
- **Shared hooks:** `frontend/src/hooks/use<Feature>.ts` (for hooks used across routes)
- **Co-located hooks:** Allowed under `app/<route>/**/hooks/` for route-specific logic
- **Shared types:** `frontend/src/models/<Entity>.ts` (for types used across routes)
- **Route-local types:** Allowed as `types.ts` inside the route folder for feature-scoped models
- **Shared components:** `frontend/src/components/<feature>/` (used across multiple routes)
- **Page-specific components:** Co-location allowed under `app/<route>/**/components/`
  — do NOT force all components into `src/components/` if they are only used by one route
- Always add `'use client'` at the top of any component that uses hooks or browser APIs

---

## 4. API Design Standards

### Endpoint Naming (Versioned — matches existing controllers)
```
GET    /api/v1/{resource}                  → Get all records
GET    /api/v1/{resource}/{id}             → Get single record
GET    /api/v1/{resource}/categories       → Get distinct category dropdown values
GET    /api/v1/{resource}/types/{category} → Get types filtered by category
POST   /api/v1/{resource}                  → Create new record
PUT    /api/v1/{resource}/{id}             → Update existing record
DELETE /api/v1/{resource}/{id}             → Delete record
```
- Resource names are **kebab-case** plural nouns: `/api/v1/loan-codes`, `/api/v1/covenants`
- Always use `/api/v1/` prefix — matches existing controllers (e.g. `[Route("api/v1/covenants")]`)

### HTTP Response Standards
| Scenario | Status Code | Response Body |
|---|---|---|
| Success (GET/PUT/DELETE) | 200 OK | DTO / contract object |
| Success (POST/Create) | 201 Created | Created DTO |
| Validation failure | 400 Bad Request | `ProblemDetails` with structured extensions |
| Not found | 404 Not Found | `ProblemDetails` |
| Duplicate / conflict | 409 Conflict | `ProblemDetails` |
| Server error | 500 Internal Server Error | `ProblemDetails` (logged via telemetry) |

- Use **`ProblemDetails`** for all error responses — matches existing controller pattern.
- Log exceptions via the existing telemetry infrastructure (do not add new logging libraries).
- Do NOT return plain `{ "error": "..." }` JSON strings — use `ProblemDetails`.

### Auth on Controllers
```csharp
// Use an existing policy — do NOT invent new ones
[Authorize(Policy = "RequireActiveUser")]   // most maintenance endpoints
[Authorize(Policy = "Commercial.Admin")]    // admin-only write operations
[Authorize(Policy = "Commercial.ReadOnly")] // read-only endpoints
```
- Always ask which policy applies before generating a controller.
- Never use bare `[Authorize]` without a policy name.

---

## 5. UI / UX Standards

### General Page Layout
Every maintenance page follows this structure (top to bottom):
1. Page title (`<h1>`)
2. Filter bar — dropdowns to filter the table **client-side** (no API call on filter change)
3. "Add New [Entity]" form section (card/panel)
4. Data table with inline edit and delete

### Table Behavior
- All data tables support **inline editing** — no modals, no separate edit pages.
- Edit mode: clicking **Edit** replaces static text with inputs/selects; buttons change to **Save** / **Cancel**.
- The **primary key field** is always read-only even in edit mode — plain text, never an input.
- Delete: clicking **Delete** shows inline **"Are you sure? Confirm / Cancel"** — never `window.confirm()`.
- After any successful mutation, update local React state — no full page reload.

### Dropdowns
- Any field referencing a category, type, or classification renders as a `<select>`.
- Options always fetched from backend (`/categories` or `/types/{category}` endpoints) — never hardcoded.
- Same fetched options array shared between the Add form and the Edit row.

### Feedback / Validation
- Tailwind-styled **loading spinner** while data is fetched.
- **Dismissible error banner** at top of page on any API failure.
- **Success toast** (auto-dismiss after 3 seconds) after every successful mutation.
- Field-level validation messages below each input in the Add form.

### Tailwind Style Reference
```
Table wrapper:        overflow-x-auto
Table:                w-full border border-gray-200 divide-y divide-gray-100 text-sm
Table header row:     bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider
Table header cell:    px-4 py-3 text-left
Table body row:       bg-white hover:bg-gray-50
Table body cell:      px-4 py-3 text-gray-700
Edit button:          px-3 py-1 text-sm border border-gray-400 text-gray-700 rounded hover:bg-gray-50
Save button:          px-3 py-1 text-sm border border-blue-500 text-blue-600 rounded hover:bg-blue-50
Cancel button:        px-3 py-1 text-sm border border-gray-300 text-gray-500 rounded hover:bg-gray-50
Delete button:        px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600
Confirm delete:       px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700
Input (edit mode):    border border-gray-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400
Select (edit mode):   border border-gray-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400
Success toast:        fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded shadow
Error banner:         bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded mb-4
Loading spinner:      animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full mx-auto my-8
Section card:         bg-white border border-gray-200 rounded-lg p-6 mb-6
Page title:           text-2xl font-semibold text-gray-800 mb-6
```

---

## 6. Code Quality Rules

### General
- Write **every file in full** — no truncation, no `// ... rest of the code` shortcuts.
- Every generated file must start with a comment block: filename, purpose, `// DEVELOPER:` actions needed.
- Do not introduce any new npm or NuGet packages without `// NEW DEPENDENCY: <name> — reason`.
- Do not generate test files unless explicitly asked.

### TypeScript Rules
- All shared TypeScript types/interfaces go in `frontend/src/models/`.
- Route-local types may live in a `types.ts` file inside the route folder.
- No inline `type` or `interface` declarations inside component files — extract to models or types.ts.
- Always define explicit return types on functions and hooks.
- Use `interface` for object shapes (DTOs, API responses), `type` for unions/aliases.
- No use of `any` — use `unknown` and narrow, or define a proper interface.
- API response models must exactly mirror the backend DTO/contract shape.

### Naming Conventions
| Type | Convention | Example |
|---|---|---|
| Next.js page file | always `page.tsx` | `app/maintenance/loan-codes/page.tsx` |
| React component files | PascalCase `.tsx` | `LoanCodeTable.tsx` |
| TypeScript hook files | camelCase `use` prefix `.ts` | `useLoanCodes.ts` |
| TypeScript service files | camelCase resource noun `.ts` (NO Service suffix) | `loanCodes.ts` |
| Shared model files | PascalCase `.ts` | `LoanCode.ts` |
| Route-local types file | always `types.ts` | `app/maintenance/loan-codes/types.ts` |
| C# domain entity | PascalCase | `LoanCode.cs` |
| C# repository interface | `I` prefix + PascalCase (at Application root) | `ILoanCodeRepository.cs` |
| C# repository implementation | `Sql` prefix + PascalCase + `Repository` | `SqlLoanCodeRepository.cs` |
| C# DTO / contract | PascalCase | `LoanCodeContract.cs` |
| API endpoints | versioned kebab-case | `/api/v1/loan-codes` |
| Next.js route segments | kebab-case folder | `app/maintenance/loan-codes/page.tsx` |

---

## 7. CI/CD

- Pipeline definitions live in both `pipelines/` and `azure-pipelines/` at the monorepo root.
- `azure-pipelines/` contains environment-specific templates and variable files.
- Do NOT modify pipeline files unless explicitly asked.

---

## 8. Output Format for Every Session

### File Delivery Order
```
Backend (bottom-up):
1. Casrr.Domain/          → Domain entity class
2. Casrr.Application/     → Interface (I<Entity>Repository.cs at project root)
                          → Contract/DTO files under Reviews/Contracts/ or feature subfolder
3. Casrr.Infrastructure/SqlServer/  → Sql<Entity>Repository.cs (raw ADO.NET)
4. Casrr.Api/Controllers/ → <Entity>Controller.cs

Frontend (bottom-up):
5. frontend/src/models/ or route types.ts  → TypeScript interfaces
6. frontend/src/services/api/<resource>.ts → fetch service (no Service suffix)
7. frontend/src/hooks/ or route hooks/     → custom hook
8. Co-located or shared components         → .tsx component files
9. frontend/src/app/maintenance/<feature>/page.tsx → page
```

### Developer Integration Checklist (always append at end)
```
## Developer Integration Checklist

### Backend
- [ ] Register `I<Entity>Repository` → `Sql<Entity>Repository` in `StartupExtensions.AddDataProviders()` (Casrr.Api/Extensions/StartupExtensions.cs)
- [ ] Add `DbSet<<Entity>>` to CasrrDbContext in Infrastructure/SqlServer/ only if EF is used
- [ ] Confirm which [Authorize(Policy = "...")] applies and add it to the controller
- [ ] Verify SQL connection string name matches existing config in appsettings.json
- [ ] Run Add-Migration only if EF schema changed (flag was added in code)

### Frontend
- [ ] Create folder: frontend/src/app/maintenance/<feature-name>/
- [ ] Verify 'use client' directive is present on all interactive components
- [ ] Verify service file base URL matches NEXT_PUBLIC_API_URL in .env.local
- [ ] Verify API route uses /api/v1/ prefix
- [ ] Test: load, add, inline edit + save, inline edit + cancel, delete + confirm, delete + cancel
```

---

## 9. What the AI Must Never Do

- ❌ Never use `window.confirm()` for delete confirmations
- ❌ Never expose rowversion/timestamp columns in create/update payloads
- ❌ Never put business logic in a Controller
- ❌ Never access DbContext directly from a Controller
- ❌ Never call `fetch` directly inside a React component — always go through service + hook
- ❌ Never hardcode dropdown options that should come from the backend
- ❌ Never use AutoMapper
- ❌ Never generate synchronous DB calls — always async/await
- ❌ Never add npm or NuGet packages without `// NEW DEPENDENCY:` comment
- ❌ Never truncate generated code — all files must be complete and copy-paste ready
- ❌ Never use React Router — this is Next.js App Router
- ❌ Never create `.jsx` or `.js` files — all frontend files are `.tsx` or `.ts`
- ❌ Never use `@tanstack/react-query` (`useQuery`, `useMutation`) in new code — it exists in `package.json` as a legacy dependency but must not be used going forward. New data fetching uses `useEffect` + native `fetch` only.
- ❌ Never use `any` in TypeScript
- ❌ Never create a new DbContext — use existing `CasrrDbContext`
- ❌ Never use bare `[Authorize]` without a named policy
- ❌ Never use Windows/AD auth — auth is Azure AD JWT Bearer via Microsoft.Identity.Web
- ❌ Never return plain `{ "error": "..." }` — use ProblemDetails for all error responses
- ❌ Never use EF Core in new repositories — use raw ADO.NET (SqlClient) unless explicitly told otherwise
- ❌ Never create an `Interfaces/` subfolder in Application — interfaces go at the project root
- ❌ Never create a `DTOs/` folder — contracts go in `Application/Reviews/Contracts/`
- ❌ Never use `Service` suffix on frontend service files — use resource noun only (`covenants.ts`)
- ❌ Never use unversioned API routes — always `/api/v1/`

---

## 10. Prompt Template for Every New Feature

```
Read AGENTS.md first, then build the following:

**Feature name:** <e.g. Loan Codes Library Maintenance>
**Next.js route:** /maintenance/loan-codes
**Page file path:** frontend/src/app/maintenance/loan-codes/page.tsx
**Auth policy:** <e.g. RequireActiveUser>

**Database table:** [CAS_RISKREVIEW_DEV].[dbo].[<TableName>]
**Columns:**
  - <ColumnName> (<type>, PRIMARY KEY — read-only in edit mode)
  - <ColumnName> (<type>, dropdown — fetch from /api/v1/<resource>/categories)
  - <ColumnName> (<type>, free text)
  - <ColumnName> (<type>, rowversion — exclude from all payloads except GET)

**Specific requirements:**
<Only describe what is UNIQUE to this page.
Everything else — stack, patterns, naming, error handling,
inline edit/delete behavior, file locations — is already in AGENTS.md.>

**Build in stages:**
Stage 1: Backend only (Domain → Interface → Repository → Controller)
Stage 2: Frontend only after backend is reviewed (models → service → hook → components → page)
Stage 3: Developer Integration Checklist
```
