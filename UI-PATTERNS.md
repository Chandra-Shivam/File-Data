# UI-PATTERNS.md
> This file defines the exact TSX markup, Tailwind classes, and component patterns
> used in this project. When generating any frontend page or component, copy these
> patterns exactly — do not invent variations.
>
> Read this file alongside AGENTS.md before generating any frontend code.
> Last updated: June 2026 — validated against covenants/page.tsx and cas-findings/page.tsx.

---

## 1. Design System Conventions

### Color Palette
This project uses **slate** for surfaces/text and **emerald** for success — not gray/blue/green.

| Purpose | Tailwind token |
|---|---|
| Page text | `text-slate-800`, `text-slate-700`, `text-slate-600`, `text-slate-500` |
| Borders | `border-slate-200`, `border-slate-300` |
| Backgrounds | `bg-slate-50`, `bg-white` |
| Success toast | `bg-emerald-600 text-white` |
| Error | `border-red-300 bg-red-50 text-red-800` |
| Danger button | `variant="danger"` on `<Button>` |

### Shared UI Components
These components exist in the codebase and must be used — do NOT use native HTML equivalents.

```tsx
import { Button } from '@/components/ui/Button'
import Select from '@/components/ui/Select'
```

| Component | Props | Use for |
|---|---|---|
| `<Button>` | `size="xs"\|"sm"`, `variant="outline"\|"danger"`, `disabled`, `type` | All buttons on the page |
| `<Select>` | `size="sm"`, `className`, `disabled`, `value`, `onChange` | All dropdowns (filter + form + edit mode) |

Never use native `<button>` or `<select>` — always use these shared components.

---

## 2. Page Shell

```tsx
// PATTERN: Page Shell
// Used for every page under /maintenance/*
// No min-h-screen wrapper, no max-w-7xl container — pages use p-4 space-y-4 only.

'use client'

export default function ExamplePage() {
  return (
    <div className="p-4 space-y-4">

      {/* Page Title */}
      <h1 className="text-xl font-semibold text-slate-800">
        Entity — Library Maintenance
      </h1>

      {/* Error Banner */}
      {/* Filter Bar */}
      {/* Add New Form */}
      {/* Table */}

      {/* Toast Stack — always at bottom of JSX, outside content flow */}
      <div aria-live="polite" className="fixed right-4 top-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className="rounded bg-emerald-600 text-white shadow px-3 py-2 text-sm">
            {t.text}
          </div>
        ))}
      </div>

    </div>
  )
}
```

---

## 3. Toast System

Use a **toast array with IDs**, not a single `successMessage` state.
Toasts are stacked **top-right**, not bottom-right.

```tsx
// PATTERN: Toast state and showToast helper
// Define once per page, pass showToast down to child components or use via context/hook.

type ToastMsg = { id: number; text: string }

const [toasts, setToasts] = useState<ToastMsg[]>([])

const showToast = (text: string): void => {
  const id = Date.now() + Math.random()
  setToasts((prev) => [...prev, { id, text }])
  window.setTimeout(() => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, 3000)
}
```

```tsx
{/* PATTERN: Toast render — always at bottom of page JSX */}
<div aria-live="polite" className="fixed right-4 top-4 z-50 space-y-2">
  {toasts.map((t) => (
    <div key={t.id} className="rounded bg-emerald-600 text-white shadow px-3 py-2 text-sm">
      {t.text}
    </div>
  ))}
</div>
```

---

## 4. Error Banner

Non-dismissible. Uses `pageError` as the state variable name.

```tsx
// PATTERN: Error Banner
// Shown at top of content area when any API call fails.
// Not dismissible — clears when the next successful action occurs.

const [pageError, setPageError] = useState<string | null>(null)

{pageError && (
  <div className="rounded border border-red-300 bg-red-50 text-red-800 p-3 text-sm">
    {pageError}
  </div>
)}
```

---

## 5. Filter Bar

Uses the custom `<Select>` component, not a native `<select>`.
Label is NOT uppercase — use `text-xs text-slate-600 mb-1`.

```tsx
// PATTERN: Filter Bar
// Sits between page title and Add New form.
// Client-side filtering only — no API call on filter change.

<div className="flex flex-wrap items-end gap-3 bg-white border border-slate-200 rounded p-3">

  <div>
    <label className="text-xs text-slate-600 mb-1 block">Filter by Category</label>
    <Select
      size="sm"
      className="bg-white min-w-[260px]"
      value={selectedCategory}
      onChange={(e) => setSelectedCategory(e.target.value)}
    >
      <option value="">All Categories</option>
      {categories.map((cat) => (
        <option key={cat} value={cat}>{cat}</option>
      ))}
    </Select>
  </div>

  {/* Add more filter selects here using the same pattern */}

</div>
```

---

## 6. Add New Form

Uses `<Button variant="outline">` not a filled dark button.
Uses a single `createError` string, not per-field error spans.
Uses grid layout with `md:grid-cols-6` and `col-span-*`.

```tsx
// PATTERN: Add New [Entity] Form

const [createError, setCreateError] = useState<string | null>(null)
const [isCreating, setIsCreating] = useState(false)

<div className="bg-white border border-slate-200 rounded p-4">

  <div className="text-slate-700 font-semibold mb-2">Add New [Entity]</div>

  <form
    className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end"
    onSubmit={handleCreate}
  >

    {/* Dropdown field — md:col-span-2 */}
    <div className="md:col-span-2">
      <label className="text-xs text-slate-600 mb-1 block">
        Category <span className="text-red-500">*</span>
      </label>
      <Select
        size="sm"
        className="bg-white w-full"
        value={newItem.category}
        onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
      >
        <option value="">Select category...</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </Select>
    </div>

    {/* Text input field — md:col-span-1 */}
    <div className="md:col-span-1">
      <label className="text-xs text-slate-600 mb-1 block">
        Code <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        value={newItem.code}
        onChange={(e) => setNewItem({ ...newItem, code: e.target.value })}
        placeholder="e.g., AIRC"
        className="w-full border border-slate-300 rounded px-2 py-1 text-sm text-slate-700 focus:outline-none"
      />
    </div>

    {/* Create button — md:col-span-1, self-end aligns with inputs */}
    <div className="md:col-span-1 self-end">
      <Button type="submit" size="sm" variant="outline" disabled={isCreating}>
        {isCreating ? 'Creating…' : 'Create'}
      </Button>
    </div>

  </form>

  {/* Single form-level error — not per-field */}
  {createError && (
    <div className="text-sm text-red-600 mt-2">{createError}</div>
  )}

  {/* Helper text */}
  <p className="text-xs text-slate-400 mt-3">
    Code must be unique. Category/Description can be edited after creation.
  </p>

</div>
```

---

## 7. Data Table

### 7a. Th and Td Helper Components

Define these once at the **bottom** of the page file (after the default export).
Do NOT use raw `<th>` or `<td>` tags in the table — always use these helpers.

```tsx
// PATTERN: Th and Td helper components
// Define at the top of the page file, not in a separate file.

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={'px-3 py-2 text-left font-semibold border-b border-slate-200 ' + className}>
      {children}
    </th>
  )
}

function Td({
  children,
  className = '',
  colSpan,
}: {
  children: React.ReactNode
  className?: string
  colSpan?: number
}) {
  return (
    <td className={'px-3 py-2 align-middle ' + className} colSpan={colSpan}>
      {children}
    </td>
  )
}
```

### 7b. Table Wrapper and Header

```tsx
// PATTERN: Table Wrapper + Header

<div className="bg-white border border-slate-200 rounded overflow-hidden">

  {/* Section header */}
  <div className="px-3 py-2 bg-slate-50 text-slate-700 text-sm font-semibold border-b border-slate-200">
    [Entity] Library
    {isLoadingRows && (
      <span className="ml-2 text-xs text-slate-500">(loading…)</span>
    )}
  </div>

  <div className="overflow-auto">
    <table className="min-w-full text-sm">
      <thead className="bg-slate-50 text-slate-600">
        <tr>
          {/* No leading # index column — columns are entity-specific */}
          <Th className="min-w-[160px]">Category</Th>
          <Th className="min-w-[120px]">Code</Th>
          <Th className="min-w-[200px]">Description</Th>
          <Th className="min-w-[180px]">Actions</Th>
        </tr>
      </thead>
      <tbody>

        {/* Loading state — single tr wrapping SkeletonRows div */}
        {isLoadingRows && (
          <tr>
            <Td colSpan={4}><SkeletonRows /></Td>
          </tr>
        )}

        {/* Empty state — inside tbody as a row */}
        {!isLoadingRows && filteredItems.length === 0 && (
          <tr>
            <Td colSpan={4} className="text-center text-slate-500 py-6">
              No [entities] found.
            </Td>
          </tr>
        )}

        {/* Data rows — each row has border-t border-slate-200 align-top */}
        {!isLoadingRows && filteredItems.map((item) => (
          <TableRow key={item.code} item={item} />
        ))}

      </tbody>
    </table>
  </div>

</div>
```

### 7c. SkeletonRows Component

Define at the **bottom** of the page file alongside `Th` and `Td` (after the default export).
SkeletonRows returns a `div` of bars — it is wrapped in a single `<tr><Td>` at the call site.

```tsx
// PATTERN: SkeletonRows — returns a div of animated bars (NOT table rows)
// Usage in tbody: <tr><Td colSpan={N}><SkeletonRows /></Td></tr>

function SkeletonRows() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-10 w-full bg-slate-100 border border-slate-200 rounded animate-pulse"
        />
      ))}
    </div>
  )
}
```

---

## 8. Table Row — View and Edit Modes

The actual codebase does NOT swap between a view row and an edit row.
Instead, **inputs are always rendered but toggled between disabled and enabled**.
The Edit button toggles to Cancel. Save and Delete are always visible.

### 8a. Row State Shape

```tsx
// PATTERN: Row state — each row carries its own editing/dirty/saving/deleting/error flags

type RowState = {
  original: EntityType       // original values from API — used for cancel/revert
  edited: EntityType         // current edited values — bound to inputs
  editing: boolean           // true when row is in edit mode
  dirty: boolean             // true when edited !== original
  saving: boolean            // true during PUT API call
  deleting: boolean          // true during DELETE API call
  error: string | null       // per-row error message
}
```

### 8b. Full Row Pattern

```tsx
// PATTERN: Table Row
// Inputs always rendered; disabled={!r.editing} controls edit mode.
// PK field is always plain text — never an input.
// Edit button toggles to Cancel; Save and Delete always visible.

<tr key={r.original.code} className="border-t border-slate-200 align-top">

  {/* Row number */}
  <Td className="text-slate-400 text-xs">{index + 1}</Td>

  {/* Dropdown field — always rendered, disabled when not editing */}
  <Td>
    <Select
      size="sm"
      className="bg-white w-full"
      value={r.edited.category}
      disabled={!r.editing}
      onChange={(e) =>
        updateRow(r.original.code, { category: e.target.value })
      }
    >
      {categories.map((cat) => (
        <option key={cat} value={cat}>{cat}</option>
      ))}
    </Select>
  </Td>

  {/* PK field — always plain text, never an input */}
  <Td className="align-middle font-mono text-[12px] text-slate-700">{r.original.code}</Td>

  {/* Text input field — always rendered, disabled when not editing */}
  <Td>
    <input
      type="text"
      value={r.edited.description}
      disabled={!r.editing}
      onChange={(e) =>
        updateRow(r.original.code, { description: e.target.value })
      }
      className="w-full border border-slate-300 rounded px-2 py-1 text-sm text-slate-700 disabled:bg-transparent disabled:border-transparent focus:outline-none"
    />
    {/* Per-row error shown under a field */}
    {r.error && (
      <div className="text-xs text-red-600 mt-1">{r.error}</div>
    )}
  </Td>

  {/* Actions — Edit/Cancel + Save + Delete always rendered */}
  <Td>
    <div className="flex gap-2">

      {/* Edit toggles to Cancel */}
      <Button
        size="xs"
        variant="outline"
        onClick={() => toggleEdit(r.original.code)}
        disabled={r.saving || r.deleting}
      >
        {r.editing ? 'Cancel' : 'Edit'}
      </Button>

      {/* Save — disabled until editing and dirty */}
      <Button
        size="xs"
        variant="outline"
        onClick={() => handleSave(r.original.code)}
        disabled={!r.editing || !r.dirty || r.saving}
      >
        {r.saving ? 'Saving…' : 'Save'}
      </Button>

      {/* Delete — triggers modal confirmation */}
      <Button
        size="xs"
        variant="danger"
        onClick={() => openDeleteModal(r.original.code)}
        disabled={r.saving || r.deleting}
      >
        {r.deleting ? 'Deleting…' : 'Delete'}
      </Button>

    </div>
  </Td>

</tr>
```

---

## 9. Delete Confirmation Modal

The codebase uses a **modal overlay with accessibility attributes and focus trap**,
NOT an inline row transform. Never use `window.confirm()`.

```tsx
// PATTERN: Delete Confirmation Modal
// Full a11y: role, aria-modal, aria-labelledby, aria-describedby, ESC key, focus trap.

const modalRef = useRef<HTMLDivElement>(null)
const [confirmOpen, setConfirmOpen] = useState(false)
const [pendingDeleteCode, setPendingDeleteCode] = useState<string | null>(null)

const openDeleteModal = (code: string): void => {
  setPendingDeleteCode(code)
  setConfirmOpen(true)
}

// Focus trap + ESC key handler
useEffect(() => {
  if (!confirmOpen) return
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setConfirmOpen(false)
    if (e.key === 'Tab' && modalRef.current) {
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
        e.preventDefault()
        ;(e.shiftKey ? last : first).focus()
      }
    }
  }
  document.addEventListener('keydown', handleKeyDown)
  modalRef.current?.querySelector<HTMLElement>('button')?.focus()
  return () => document.removeEventListener('keydown', handleKeyDown)
}, [confirmOpen])
```

```tsx
{/* PATTERN: Delete Modal JSX — render at bottom of page, outside table */}
{confirmOpen && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center">

    {/* Backdrop */}
    <div
      className="absolute inset-0 bg-black/40"
      onClick={() => setConfirmOpen(false)}
    />

    {/* Dialog */}
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-desc"
      className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4"
    >
      <h2 id="confirm-title" className="text-base font-semibold text-slate-800 mb-2">
        Confirm Delete
      </h2>
      <p id="confirm-desc" className="text-sm text-slate-600 mb-4">
        Are you sure you want to delete <strong>{pendingDeleteCode}</strong>?
        This action cannot be undone.
      </p>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={() => setConfirmOpen(false)}>
          Cancel
        </Button>
        <Button size="sm" variant="danger" onClick={handleDeleteConfirm}>
          Delete
        </Button>
      </div>
    </div>

  </div>
)}
```

---

## 10. Color and State Reference (Actual)

| Element | Classes |
|---|---|
| Page wrapper | `p-4 space-y-4` |
| Page title | `text-xl font-semibold text-slate-800` |
| Card/section | `bg-white border border-slate-200 rounded p-4` |
| Table header bar | `px-3 py-2 bg-slate-50 text-slate-700 text-sm font-semibold border-b border-slate-200` |
| Table `<thead>` | `bg-slate-50 text-slate-600` |
| Table scroll wrapper | `overflow-auto` (not `overflow-x-auto`) |
| Table element | `min-w-full text-sm` (not `w-full`) |
| `Th` | `px-3 py-2 text-left font-semibold border-b border-slate-200` |
| `Td` | `px-3 py-2 align-middle` |
| Table row | `border-t border-slate-200 align-top` (on each `<tr>`) |
| Input (edit mode) | `border border-slate-300 rounded px-2 py-1 text-sm text-slate-700 focus:outline-none` |
| Input (view mode) | add `disabled:bg-transparent disabled:border-transparent` |
| Textarea (edit mode) | `w-full min-h-[64px] border border-slate-300 rounded shadow-sm p-2 bg-white focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-primary)]/30` |
| PK cell | `align-middle font-mono text-[12px] text-slate-700` |
| Error banner | `rounded border border-red-300 bg-red-50 text-red-800 p-3 text-sm` |
| Per-row error | `text-xs text-red-600 mt-1` |
| Form error | `text-sm text-red-600 mt-2` |
| Toast (success) | `rounded bg-emerald-600 text-white shadow px-3 py-2 text-sm` |
| Toast container | `fixed right-4 top-4 z-50 space-y-2` |
| Skeleton row | `h-10 w-full bg-slate-100 border border-slate-200 rounded animate-pulse` |
| Empty state | `text-center text-slate-500 py-6` |

---

## 11. How to Reference This File in Prompts

Add this to every GPT-5 prompt alongside AGENTS.md:

```
Read AGENTS.md and UI-PATTERNS.md first.
Use the exact TSX patterns, class names, and shared components
(Button, Select) from UI-PATTERNS.md for all generated components.
Do not use native <button> or <select> elements.
Do not invent new class combinations.
```

No further UI description is needed in the prompt for standard maintenance pages.
