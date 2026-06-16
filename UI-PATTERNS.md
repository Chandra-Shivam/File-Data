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

      {/* Toast Stack — render near the TOP of the JSX return, as first child of the shell div */}
      <div aria-live="polite" className="fixed right-4 bottom-4 z-50 space-y-2">
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

type ToastMsg = { id: number; text: string; tone: 'success' | 'error' }

const [toasts, setToasts] = useState<ToastMsg[]>([])

const showToast = (text: string, tone: 'success' | 'error' = 'success'): void => {
  const id = Date.now() + Math.random()
  setToasts((prev) => [...prev, { id, text, tone }])
  window.setTimeout(() => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, 3000)
}
```

```tsx
{/* PATTERN: Toast render — place near the TOP of the page JSX return tree */}
<div aria-live="polite" className="fixed right-4 bottom-4 z-50 space-y-2">
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
// Filter change triggers an API call via useEffect — NOT client-side only.
// When selectedCategory/selectedComponent changes, useEffect re-fetches from the backend.

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

</div>

// Filter re-fetch pattern — useEffect watches the filter state:
useEffect(() => {
  let alive = true
  ;(async () => {
    setIsLoadingRows(true)
    setPageError(null)
    try {
      const lib = await listLibrary(selectedCategory || undefined)
      if (alive) setRows(lib.map(toRowEdit))
    } catch {
      if (alive) setPageError('Failed to load data.')
    } finally {
      if (alive) setIsLoadingRows(false)
    }
  })()
  return () => { alive = false }
}, [selectedCategory])
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

  {/* NEVER use <form> tags — use onClick on the button instead (AGENTS.md) */}
  {/* Using <form> causes Enter key in RichTextEditor to trigger blur/submit, breaking cursor */}
  <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">

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
        className="w-full h-8 border border-slate-300 rounded px-2 text-sm bg-white"
      />
    </div>

    {/* Create button — md:col-span-1, grid items-end on the form handles alignment */}
    <div className="md:col-span-1">
      {/* type="button" not "submit" — never use type="submit" inside maintenance forms */}
      <Button type="button" size="sm" variant="outline" disabled={isCreating} onClick={handleCreate}>
        {isCreating ? 'Creating…' : 'Create'}
      </Button>
    </div>

  </div>

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
// Define at the BOTTOM of the page file (after the default export), not in a separate file.

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={'px-3 py-2 text-left font-semibold border-b border-[#172a4b] text-white ' + className}>
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

  <div className="relative overflow-x-auto">
    <table className="min-w-full text-sm">
      <thead className="bg-[#1F3864] text-white">
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
        {/* key uses field+index — safe even if data has duplicates or no PK column */}
        {!isLoadingRows && filteredItems.map((item, index) => (
          <TableRow key={`${item.code}-${index}`} item={item} index={index} />
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

### 8a. Input Rendering Pattern

The existing pages (covenants, cas-findings) **conditionally render** inputs — view mode shows plain text/spans, edit mode shows inputs/selects. This is the preferred pattern for new pages to match the established codebase.

The loan-codes and help-tips pages use always-rendered disabled inputs — both approaches are acceptable but conditional rendering is preferred for consistency with existing pages.

### 8b. Row State Shape

```tsx
// PATTERN: Row state — edited fields are FLAT at the top level, not nested under an "edited" object.
// Each editable field gets its own top-level property alongside the flags.
// "original" holds the snapshot from the API for cancel/revert.
// Bindings use r.fieldName directly — NOT r.edited.fieldName.

// Example for an entity with category + description fields:
type RowEdit = {
  original: EntityType   // snapshot from API — used to revert on Cancel
  category: string       // current edited value — bound directly to input/select
  description: string    // current edited value — bound directly to input
  editing: boolean       // true when row is in edit mode
  dirty: boolean         // true when any field differs from original
  saving: boolean        // true during PUT API call
  deleting: boolean      // true during DELETE API call
  error?: string | null  // per-row error message
}

// toRowEdit helper — converts API item to RowEdit initial state:
const toRowEdit = (item: EntityType): RowEdit => ({
  original: item,
  category: item.category,
  description: item.description,
  editing: false,
  dirty: false,
  saving: false,
  deleting: false,
  error: null,
})
```

### 8c. Full Row Pattern

```tsx
// PATTERN: Table Row
// Inputs always rendered; disabled={!r.editing} controls edit mode.
// PK field is always plain text — never an input.
// Edit button toggles to Cancel; Save and Delete always visible.
// key = field + index — universally safe regardless of data uniqueness or PK presence.
// ALL disabled inputs/selects MUST include: disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200
// RichTextEditor in view mode MUST include: readOnly={true} showToolbar={false} className="cursor-not-allowed"

<tr key={`${r.original.code}-${index}`} className="border-t border-slate-200 align-top">

  {/* NO row number column — columns are entity-specific, no leading index cell */}

  {/* Dropdown field — always rendered, disabled when not editing */}
  {/* Binding uses r.category directly — NOT r.edited.category */}
  {/* disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200 — makes read-only state visually clear */}
  <Td>
    <Select
      size="sm"
      className="bg-white w-full disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200"
      value={r.category}
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
  {/* Binding uses r.description directly — NOT r.edited.description */}
  {/* disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200 — makes read-only state visually clear */}
  <Td>
    <input
      type="text"
      value={r.description}
      disabled={!r.editing}
      onChange={(e) =>
        updateRow(r.original.code, { description: e.target.value })
      }
      className="w-full h-8 border border-slate-300 rounded px-2 text-sm bg-white focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200"
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

// Focus trap + ESC key handler + body scroll lock
useEffect(() => {
  if (!confirmOpen) return
  // Lock body scroll while modal is open
  document.body.style.overflow = 'hidden'
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
  return () => {
    document.removeEventListener('keydown', handleKeyDown)
    // Restore body scroll on close
    document.body.style.overflow = ''
  }
}, [confirmOpen])
```

```tsx
{/* PATTERN: Delete Modal JSX — render at bottom of page, outside table */}
{confirmOpen && (
  {/* Outer: z-[60]; dialog inside is z-[61] */}
  <div className="fixed inset-0 z-[60] flex items-center justify-center">

    {/* Backdrop */}
    <div
      className="absolute inset-0 bg-black/40"
      onClick={() => setConfirmOpen(false)}
    />

    {/* Dialog — z-[61] sits above backdrop z-[60]; split into header/body/footer sections */}
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-desc"
      tabIndex={-1}
      className="relative z-[61] w-[90%] max-w-md rounded bg-white shadow-lg border border-slate-200"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200">
        <h2 id="confirm-title" className="text-base font-semibold text-slate-800">
          Confirm Delete
        </h2>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        <p id="confirm-desc" className="text-sm text-slate-700">
          Are you sure you want to delete <strong>{pendingDeleteCode}</strong>?
          This action cannot be undone.
        </p>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-200 flex justify-end gap-2">
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
| Table header `<thead>` | `bg-[#1F3864] text-white` — brand blue, sticky |
| Table `<thead>` | `bg-[#1F3864] text-white` (brand blue) |
| Table scroll wrapper | `relative overflow-x-auto` |
| Table element | `min-w-full text-sm` |
| `Th` | `px-3 py-2 text-left font-semibold border-b border-slate-200` |
| `Td` | `px-3 py-2 align-middle` |
| Table row | `border-t border-slate-200 align-top` (on each `<tr>`) |
| Input (edit/create) | `w-full h-8 border border-slate-300 rounded px-2 text-sm bg-white focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200` |
| Select (edit/create) | add `disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200` |
| RichTextEditor (view mode) | `readOnly={true} showToolbar={false} className="cursor-not-allowed"` |
| RichTextEditor (edit mode) | `readOnly={false} showToolbar={true}` |
| Input (view mode) | No extra disabled: classes — browser default disabled style is used |
| Textarea (edit mode) | `w-full min-h-[64px] border border-slate-300 rounded shadow-sm p-2 bg-white focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-primary)]/30` |
| PK cell | `align-middle font-mono text-[12px] text-slate-700` |
| Error banner | `rounded border border-red-300 bg-red-50 text-red-800 p-3 text-sm` |
| Per-row error | `text-xs text-red-600 mt-1` |
| Form error | `text-sm text-red-600 mt-2` |
| Toast (success) | `rounded bg-emerald-600 text-white shadow px-3 py-2 text-sm` |
| Toast (error) | `rounded bg-red-600 text-white shadow px-3 py-2 text-sm` |
| Toast container | `fixed right-4 bottom-4 z-50 space-y-2` (bottom-right) |
| Skeleton row | `h-10 w-full bg-slate-100 border border-slate-200 rounded animate-pulse` |
| Modal outer | `fixed inset-0 z-[60] flex items-center justify-center` |
| Modal dialog | `relative z-[61] w-[90%] max-w-md rounded bg-white shadow-lg border border-slate-200` |
| Modal header/footer | `px-4 py-3 border-b border-slate-200` / `px-4 py-3 border-t border-slate-200 flex justify-end gap-2` |
| Modal body | `px-4 py-3` |
| Empty state | `text-center text-slate-500 py-6` |

---

## 11. RichTextEditor Usage Pattern

The project has an existing `RichTextEditor` at `@/components/ui/RichTextEditor.tsx`.
Use it for any HTML content field. Follow these rules exactly.

### Props reference
```tsx
import RichTextEditor from '@/components/ui/RichTextEditor'

<RichTextEditor
  value={string}               // controlled value (HTML string)
  onChange={(html) => void}    // fires on every keystroke
  readOnly={boolean}           // true = view mode
  showToolbar={boolean}        // true = edit mode
  ariaLabel={string}           // always provide
  placeholder={string}         // always provide
  minHeight={number}           // pixels, e.g. 140
  className={string}           // optional extra classes
/>
```

### View mode (table row — non-editing)
```tsx
<RichTextEditor
  value={r.helpTipContent}
  onChange={(html) => updateRow(r.original.id, { helpTipContent: html })}
  readOnly={!r.editing || r.saving || r.deleting}
  showToolbar={!!r.editing}
  ariaLabel="Help tip content"
  placeholder="Enter help tip content…"
  className={!r.editing ? 'cursor-not-allowed' : ''}
  minHeight={120}
/>
```

### Add New form — CRITICAL PATTERN
NEVER bind RichTextEditor onChange directly to a function that spreads
a large form object (e.g. setNewItem({ ...newItem, content: html })).
This recreates the entire object on every keystroke, causes a broad
re-render, and breaks cursor position and Enter key behavior.

ALWAYS use a dedicated local state variable for the editor value:

```tsx
// ✅ CORRECT — dedicated local state for editor
const [newContent, setNewContent] = useState<string>('')

// Sync when form resets after successful create
useEffect(() => {
  setNewContent(newItem.helpTipContent ?? '')
}, [newItem.helpTipContent])

// RichTextEditor binding — onChange only updates local state
<RichTextEditor
  value={newContent}
  onChange={(html) => setNewContent(html)}
  readOnly={false}
  showToolbar
  ariaLabel="Help tip content"
  placeholder="Enter help tip content…"
  minHeight={140}
  className="bg-white"
/>

// On submit — read from local state, not from form object
const handleCreate = async () => {
  const payload = {
    form: newItem.form,
    topic: newItem.topic,
    helpTipContent: newContent,   // ← from local state
  }
  // ... submit logic ...
  // On success — reset both
  setNewItem({ form: '', topic: '', helpTipContent: '' })
  setNewContent('')
}
```

```tsx
// ❌ WRONG — spreads entire object on every keystroke
<RichTextEditor
  value={newItem.helpTipContent}
  onChange={(html) => setNewItem({ ...newItem, helpTipContent: html })}
/>
```

## 12. How to Reference This File in Prompts

Add this to every GPT-5 prompt alongside AGENTS.md:

```
Read AGENTS.md and UI-PATTERNS.md first.
Use the exact TSX patterns, class names, and shared components
(Button, Select) from UI-PATTERNS.md for all generated components.
Do not use native <button> or <select> elements.
Do not invent new class combinations.
```

No further UI description is needed in the prompt for standard maintenance pages.
