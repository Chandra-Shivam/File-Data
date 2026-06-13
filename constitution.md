# Project Constitution
> This file is the single source of truth for all AI-assisted development in this project.
> Prepend this entire file to every GPT-5 prompt before describing any new feature or task.
> Never override these rules unless explicitly updated here first.
> Last updated: based on actual monorepo structure inspection (June 2026).

---

## 1. Project Overview

- **Project name:** CASRR (FHN-CASRR)
- **Type:** Existing enterprise monorepo — brownfield project
- **Domain:** Loan and risk review management
- **Monorepo root folders:** `frontend/`, `backend/`, `docs/`, `discovery/`, `pipelines/`, `scripts/`, `tools/`, `legacy/`
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
| Data Fetching | **`useEffect` + native `fetch`** | No axios, React Query, SWR, or RTK Query. |
| Routing | **Next.js App Router** | New pages go in `frontend/src/app/<route>/page.tsx`. No `<Link>` from react-router-dom. Use Next.js `<Link>` from `next/link`. |
| Config files | `next.config.mjs`, `tailwind.config.ts`, `tsconfig.json`, `postcss.config.js` | Do not modify these unless explicitly asked. |

### Backend
| Concern | Technology | Rule |
|---|---|---|
| Solution | `casrr.sln` — 7 projects | See project breakdown below. |
| Framework | **ASP.NET Core Web API** | Entry point is `Casrr.Api` project. |
| Architecture | **Clean Architecture** | 4 layers: `Casrr.Api`, `Casrr.Application`, `Casrr.Domain`, `Casrr.Infrastructure`. See rules below. |
| ORM | **Entity Framework Core** | Lives in `Casrr.Infrastructure`. No Dapper, no raw ADO.NET, no stored procedures. |
| Authentication | **Windows / AD Authentication** | Apply `[Authorize]` on all controllers in `Casrr.Api`. No JWT, no cookies. |
| Language | **C#** | Follow existing naming conventions in the codebase. |

### Backend Project Breakdown
| Project | Role | What goes here |
|---|---|---|
| `Casrr.Api` | Presentation layer | Controllers, Auth, Middleware, Extensions, Telemetry, `Program.cs` |
| `Casrr.Application` | Application layer | Interfaces (IRepository), DTOs, Service interfaces, business logic |
| `Casrr.Domain` | Domain layer | Entity/domain model classes (pure C#, no EF attributes here) |
| `Casrr.Infrastructure` | Infrastructure layer | EF Core DbContext, Repository implementations, DB mappings |

### Database
| Concern | Rule |
|---|---|
| Server | SQL Server |
| DbContext | Lives in `Casrr.Infrastructure`. Reference the existing DbContext — do not create a new one. Add `// DEVELOPER: Add DbSet<T> to existing DbContext` comment. |
| Migrations | Do NOT auto-generate migrations. Flag with `// DEVELOPER: Run Add-Migration <Name> in Casrr.Infrastructure` |
| Rowversion columns | Map as `byte[]` with `[Timestamp]` annotation in Infrastructure. Always exclude from DTOs used in create/update. |

---

## 3. Architecture Rules

### Frontend File Structure
The existing `frontend/src/` directory layout to follow:
```
frontend/src/
  app/                        ← Next.js App Router — route segments as folders
    maintenance/
      covenants/
        page.tsx              ← existing example to follow
      cas-findings/
        page.tsx              ← existing example to follow
      <new-feature>/
        page.tsx              ← NEW pages go here
  components/                 ← Shared/reusable UI components
  hooks/                      ← Custom hooks (e.g. useLoanCodes.ts)
  models/                     ← TypeScript interfaces/types for API shapes
  services/                   ← fetch wrapper functions that call the API
  lib/                        ← Utility/helper functions
  auth/                       ← Auth-related code (do not modify)
```

**Rules:**
- New maintenance pages go in `frontend/src/app/maintenance/<feature-name>/page.tsx`
- Each feature gets: one `page.tsx` + one service file in `services/` + one hook in `hooks/` + types in `models/`
- Components used only by one page go in `components/<feature-name>/` subfolder
- Context Provider (if needed) wraps the page inside `page.tsx` using a `'use client'` boundary
- Always add `'use client'` directive at the top of any component that uses hooks or browser APIs

### Backend File Structure (Clean Architecture)
```
backend/src/
  Casrr.Domain/
    Entities/
      <EntityName>.cs         ← Pure domain model, no EF attributes
  Casrr.Application/
    DTOs/
      <Feature>/
        <Entity>Dto.cs
        Create<Entity>Dto.cs
        Update<Entity>Dto.cs
    Interfaces/
      I<Entity>Repository.cs
  Casrr.Infrastructure/
    Persistence/
      Configurations/
        <Entity>Configuration.cs   ← EF Core IEntityTypeConfiguration<T>
      CasrrDbContext.cs             ← existing DbContext — add DbSet here
    Repositories/
      <Entity>Repository.cs
  Casrr.Api/
    Controllers/
      <Entity>Controller.cs
```

**Rules:**
- Domain entities are plain C# classes — no EF Core annotations in `Casrr.Domain`
- EF Core configuration (table name, column mapping, keys) goes in `Casrr.Infrastructure/Persistence/Configurations/` using `IEntityTypeConfiguration<T>`
- Repository interfaces go in `Casrr.Application/Interfaces/` — implementations go in `Casrr.Infrastructure/Repositories/`
- DTOs go in `Casrr.Application/DTOs/<FeatureName>/`
- Controllers in `Casrr.Api/Controllers/` call repository interfaces only — no direct DbContext access in controllers
- Register new repositories in `Program.cs` in `Casrr.Api` — add `// DEVELOPER: Register in Program.cs` comment
- Always use `async/await` — no synchronous DB calls

---

## 4. API Design Standards

### Endpoint Naming
```
GET    /api/{resource}              → Get all records
GET    /api/{resource}/{id}         → Get single record
GET    /api/{resource}/categories   → Get distinct dropdown values
POST   /api/{resource}              → Create new record
PUT    /api/{resource}/{id}         → Update existing record
DELETE /api/{resource}/{id}         → Delete record
```
- Resource names are **kebab-case** plural nouns: `/api/loan-codes`, `/api/covenants`

### HTTP Response Standards
| Scenario | Status Code | Response Body |
|---|---|---|
| Success (GET/PUT/DELETE) | 200 OK | DTO or `{ "message": "..." }` |
| Success (POST/Create) | 201 Created | Created DTO |
| Validation failure | 400 Bad Request | `{ "error": "<message>" }` |
| Not found | 404 Not Found | `{ "error": "<resource> not found." }` |
| Duplicate / conflict | 409 Conflict | `{ "error": "<resource> already exists." }` |
| Server error | 500 Internal Server Error | `{ "error": "An unexpected error occurred." }` |

### Auth
- All controllers use `[Authorize]` (Windows/AD Auth — no additional config needed in controller).
- No anonymous endpoints unless explicitly requested.

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
- Edit mode: clicking **Edit** replaces static text in the row with inputs/selects and swaps buttons to **Save** / **Cancel**.
- The **primary key field** is always read-only even in edit mode — render as plain text, never an input.
- Delete: clicking **Delete** replaces the action buttons inline with **"Are you sure? Confirm / Cancel"** — never use `window.confirm()`.
- After any successful mutation, update local React state — no full page reload.

### Dropdowns
- Any field referencing a category, type, or classification renders as a `<select>` in edit mode and in the Add form.
- Options are always fetched from the backend (a dedicated `/categories` or `/types` endpoint) — never hardcoded.
- The same fetched options array is shared between the Add form and the Edit row via the hook/context.

### Feedback / Validation
- Tailwind-styled **loading spinner** while data is fetched.
- **Dismissible error banner** at top of page on any API failure — show backend error message if available.
- **Success toast** (auto-dismiss after 3 seconds) after every successful create, update, or delete.
- Field-level validation messages below each input in the Add form (e.g. "This field is required", "Must be unique").

### Tailwind Style Reference
```
Table wrapper:        overflow-x-auto (horizontally scrollable on small screens)
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
- Every generated file must start with a comment block: filename, purpose, and any `// DEVELOPER:` actions needed.
- Do not introduce any new npm or NuGet packages without a `// NEW DEPENDENCY: <name> — reason` comment.
- Do not generate test files unless explicitly asked.
- All TypeScript types/interfaces must be defined in `frontend/src/models/` — no inline `type` or `interface` declarations inside component files.

### TypeScript Rules
- Always define explicit return types on functions and hooks.
- Use `interface` for object shapes (DTOs, API responses), `type` for unions/aliases.
- No use of `any` — use `unknown` and narrow, or define a proper interface.
- API response models in `models/` must exactly mirror the backend DTO shape.

### Naming Conventions
| Type | Convention | Example |
|---|---|---|
| Next.js page file | always `page.tsx` | `app/maintenance/loan-codes/page.tsx` |
| React component files | PascalCase `.tsx` | `LoanCodeTable.tsx` |
| TypeScript hook files | camelCase with `use` prefix `.ts` | `useLoanCodes.ts` |
| TypeScript service files | camelCase with `Service` suffix `.ts` | `loanCodesService.ts` |
| TypeScript model files | PascalCase `.ts` | `LoanCode.ts` |
| C# domain entity | PascalCase | `LoanCode.cs` |
| C# EF configuration | PascalCase + `Configuration` suffix | `LoanCodeConfiguration.cs` |
| C# repository interface | `I` prefix + PascalCase | `ILoanCodeRepository.cs` |
| C# repository implementation | PascalCase + `Repository` suffix | `LoanCodeRepository.cs` |
| C# DTOs | PascalCase + `Dto` suffix | `LoanCodeDto.cs` |
| API endpoints | kebab-case plural | `/api/loan-codes` |
| Next.js route segments | kebab-case | `app/maintenance/loan-codes/page.tsx` |

---

## 7. Output Format for Every GPT-5 Session

Deliver files in this order, and end every session with the checklist below.

### File Delivery Order
```
Backend (bottom-up through layers):
1.  Casrr.Domain/Entities/<Entity>.cs
2.  Casrr.Application/DTOs/<Feature>/<Entity>Dto.cs
3.  Casrr.Application/DTOs/<Feature>/Create<Entity>Dto.cs
4.  Casrr.Application/DTOs/<Feature>/Update<Entity>Dto.cs
5.  Casrr.Application/Interfaces/I<Entity>Repository.cs
6.  Casrr.Infrastructure/Persistence/Configurations/<Entity>Configuration.cs
7.  Casrr.Infrastructure/Repositories/<Entity>Repository.cs
8.  Casrr.Api/Controllers/<Entity>Controller.cs

Frontend (bottom-up through layers):
9.  frontend/src/models/<Entity>.ts
10. frontend/src/services/<feature>Service.ts
11. frontend/src/hooks/use<Feature>.ts
12. frontend/src/components/<feature>/<Component>.tsx  (one per component)
13. frontend/src/app/maintenance/<feature>/page.tsx
```

### Developer Integration Checklist (always append at end)
```
## Developer Integration Checklist

### Backend
- [ ] Add `DbSet<<Entity>>` to existing DbContext in Casrr.Infrastructure
- [ ] Register `I<Entity>Repository` → `<Entity>Repository` in Program.cs (Casrr.Api)
- [ ] Run `Add-Migration <MigrationName>` in Casrr.Infrastructure if schema changed
- [ ] Verify `[Authorize]` resolves correctly under Windows/AD Auth in your environment

### Frontend
- [ ] Create folder: frontend/src/app/maintenance/<feature-name>/
- [ ] Place page.tsx inside that folder (Next.js App Router picks it up automatically — no router config needed)
- [ ] Verify the fetch base URL in the service file matches your existing NEXT_PUBLIC_API_URL env variable
- [ ] Add 'use client' directive is present on all interactive components
- [ ] Test: load page, add record, inline edit + save, inline edit + cancel, delete + confirm, delete + cancel
```

---

## 8. What GPT-5 Must Never Do

- ❌ Never use `window.confirm()` for delete confirmations
- ❌ Never expose `SSMA_TimeStamp` or any `rowversion`/`timestamp` column in create/update DTOs
- ❌ Never put business logic inside a Controller — controllers call repository interfaces only
- ❌ Never access DbContext directly from a Controller — only from Infrastructure repositories
- ❌ Never call `fetch` directly inside a React component — always go through the service + hook layer
- ❌ Never hardcode dropdown options that should come from the database
- ❌ Never use AutoMapper — map DTOs manually in the repository
- ❌ Never generate synchronous database calls — always async/await
- ❌ Never add a new npm or NuGet package without `// NEW DEPENDENCY:` comment and justification
- ❌ Never truncate generated code — all files must be complete and copy-paste ready
- ❌ Never use React Router — this is a Next.js App Router project
- ❌ Never create `.jsx` or `.js` files — all frontend files are `.tsx` or `.ts`
- ❌ Never use `any` in TypeScript
- ❌ Never add EF Core attributes to domain entities in `Casrr.Domain` — use `IEntityTypeConfiguration<T>` in Infrastructure instead
- ❌ Never create a new DbContext — always add to the existing one in `Casrr.Infrastructure`

---

## 9. How to Use This File

### Prompt template for every new feature:

```
[PASTE FULL constitution.md CONTENT HERE]

---

## Current Task

**Feature name:** <e.g. Loan Codes Library Maintenance>
**Next.js route:** <e.g. /maintenance/loan-codes>
**Page file path:** frontend/src/app/maintenance/loan-codes/page.tsx

**Database table:** [CAS_RISKREVIEW_DEV].[dbo].[<TableName>]
**Columns:**
  - <ColumnName> (<type>, PRIMARY KEY — read-only in edit mode)
  - <ColumnName> (<type>, dropdown — fetch options from /api/<resource>/categories)
  - <ColumnName> (<type>, free text)
  - <ColumnName> (<type>, ROWVERSION — exclude from all DTOs except GET)

**Specific requirements:**
<Only describe what is UNIQUE to this page.
Do NOT re-explain the stack, patterns, Tailwind classes, inline edit behavior,
API format, or naming conventions — those are all covered by the constitution above.>

**Reference UI:** <attach screenshot or describe any layout that differs from the standard maintenance page>
```

### What you do NOT need to repeat per prompt (already in this constitution):
- Tech stack and framework choices
- Clean Architecture layer rules
- Next.js App Router file conventions
- TypeScript requirements
- API response format
- Tailwind class reference
- Inline edit / delete UX behavior
- Dropdown fetch pattern
- Output file order and Developer Integration Checklist format
- Naming conventions
