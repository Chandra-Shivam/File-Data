# UI-PATTERNS.md
> This file defines the exact TSX markup and Tailwind classes for every reusable UI pattern
> in this project. When generating any frontend page or component, copy these patterns
> exactly — do not invent variations. Consistent fit and finish across all pages depends
> on using these patterns without modification.
>
> Read this file alongside AGENTS.md before generating any frontend code.
> Last updated: June 2026 — validated against actual repository.

---

## 1. Page Shell

Every maintenance page uses this exact outer shell.

```tsx
// PATTERN: Page Shell
// Use for every page under /maintenance/*

export default function ExamplePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Page Title */}
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">
          Page Title Here
        </h1>

        {/* Error Banner — shown when any API call fails */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded mb-4 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800 font-bold ml-4">✕</button>
          </div>
        )}

        {/* Filter Bar */}
        {/* Add New Form */}
        {/* Table */}

      </div>

      {/* Success Toast */}
      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded shadow z-50">
          {successMessage}
        </div>
      )}
    </div>
  )
}
```

---

## 2. Filter Bar

Sits between the page title and the Add New form. Always filters client-side.

```tsx
// PATTERN: Filter Bar
// One dropdown per filterable field. Options fetched from backend, never hardcoded.

<div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
  <div className="flex flex-wrap gap-4 items-end">

    {/* Single filter dropdown */}
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
        Filter by Category
      </label>
      <select
        value={filterCategory}
        onChange={(e) => setFilterCategory(e.target.value)}
        className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 min-w-[200px]"
      >
        <option value="">All Categories</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
    </div>

    {/* Add more filter dropdowns here using the same pattern */}

  </div>
</div>
```

---

## 3. Add New Form (Card Section)

Sits below the filter bar, above the table.

```tsx
// PATTERN: Add New [Entity] Form
// Fields vary per page — structure stays the same.

<div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
  <h2 className="text-base font-semibold text-gray-700 mb-4">
    Add New [Entity]
  </h2>

  <div className="flex flex-wrap gap-4 items-start">

    {/* Dropdown field */}
    <div className="flex flex-col gap-1 min-w-[200px]">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
        Category <span className="text-red-500">*</span>
      </label>
      <select
        value={newItem.category}
        onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
        className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
      >
        <option value="">Select category...</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
      {formErrors.category && (
        <span className="text-xs text-red-500">{formErrors.category}</span>
      )}
    </div>

    {/* Text input field */}
    <div className="flex flex-col gap-1 min-w-[200px]">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
        Code <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        value={newItem.code}
        onChange={(e) => setNewItem({ ...newItem, code: e.target.value })}
        placeholder="e.g., AIRC"
        className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
      />
      {formErrors.code && (
        <span className="text-xs text-red-500">{formErrors.code}</span>
      )}
    </div>

    {/* Create button + helper text */}
    <div className="flex flex-col gap-1 justify-end">
      <div className="h-5" /> {/* spacer to align with labeled inputs */}
      <button
        onClick={handleCreate}
        disabled={isCreating}
        className="px-4 py-2 text-sm bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isCreating ? 'Creating...' : 'Create'}
      </button>
    </div>

  </div>

  {/* Helper text */}
  <p className="text-xs text-gray-400 mt-3">
    Code must be unique. Category/Description can be edited after creation.
  </p>
</div>
```

---

## 4. Data Table

### 4a. Table Wrapper and Header

```tsx
// PATTERN: Table Wrapper + Header
// Column names vary per page — structure stays the same.

<div className="bg-white border border-gray-200 rounded-lg overflow-hidden">

  <div className="px-6 py-4 border-b border-gray-200">
    <h2 className="text-base font-semibold text-gray-700">
      [Entity] Library
    </h2>
  </div>

  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-200">
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">#</th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {filteredItems.map((item, index) => (
          <TableRow key={item.code} item={item} index={index} />
        ))}
      </tbody>
    </table>
  </div>

  {/* Empty state */}
  {filteredItems.length === 0 && !isLoading && (
    <div className="px-6 py-12 text-center text-sm text-gray-400">
      No records found.
    </div>
  )}

  {/* Loading state */}
  {isLoading && (
    <div className="px-6 py-12 flex justify-center">
      <div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full" />
    </div>
  )}

</div>
```

### 4b. Table Row — View Mode

```tsx
// PATTERN: Table Row — View Mode
// Shown by default. Edit and Delete buttons in Actions column.

<tr className="bg-white hover:bg-gray-50">
  <td className="px-4 py-3 text-gray-400 text-xs">{index + 1}</td>
  <td className="px-4 py-3 text-gray-700">{item.category}</td>
  <td className="px-4 py-3 text-gray-700 font-medium">{item.code}</td>
  <td className="px-4 py-3 text-gray-700">{item.description}</td>
  <td className="px-4 py-3">
    <div className="flex gap-2">
      <button
        onClick={() => handleEdit(item)}
        className="px-3 py-1 text-sm border border-gray-400 text-gray-700 rounded hover:bg-gray-50"
      >
        Edit
      </button>
      <button
        onClick={() => handleDeletePrompt(item.code)}
        className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
      >
        Delete
      </button>
    </div>
  </td>
</tr>
```

### 4c. Table Row — Edit Mode

```tsx
// PATTERN: Table Row — Edit Mode
// Triggered when Edit is clicked. PK field stays as plain text.
// Save and Cancel replace Edit and Delete buttons.

<tr className="bg-blue-50">
  <td className="px-4 py-3 text-gray-400 text-xs">{index + 1}</td>

  {/* Dropdown field in edit mode */}
  <td className="px-4 py-3">
    <select
      value={editValues.category}
      onChange={(e) => setEditValues({ ...editValues, category: e.target.value })}
      className="border border-gray-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
    >
      {categories.map((cat) => (
        <option key={cat} value={cat}>{cat}</option>
      ))}
    </select>
  </td>

  {/* PK field — always plain text, never an input */}
  <td className="px-4 py-3 text-gray-700 font-medium">{item.code}</td>

  {/* Text input field in edit mode */}
  <td className="px-4 py-3">
    <input
      type="text"
      value={editValues.description}
      onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
      className="border border-gray-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
    />
  </td>

  {/* Save + Cancel buttons */}
  <td className="px-4 py-3">
    <div className="flex gap-2">
      <button
        onClick={() => handleSave(item.code)}
        disabled={isSaving}
        className="px-3 py-1 text-sm border border-blue-500 text-blue-600 rounded hover:bg-blue-50 disabled:opacity-50"
      >
        {isSaving ? 'Saving...' : 'Save'}
      </button>
      <button
        onClick={handleCancelEdit}
        className="px-3 py-1 text-sm border border-gray-300 text-gray-500 rounded hover:bg-gray-50"
      >
        Cancel
      </button>
    </div>
  </td>
</tr>
```

### 4d. Table Row — Delete Confirmation Mode

```tsx
// PATTERN: Table Row — Delete Confirmation Mode
// Triggered when Delete is clicked.
// Replaces action buttons inline — never uses window.confirm().

<tr className="bg-red-50">
  <td className="px-4 py-3 text-gray-400 text-xs">{index + 1}</td>
  <td className="px-4 py-3 text-gray-700">{item.category}</td>
  <td className="px-4 py-3 text-gray-700 font-medium">{item.code}</td>
  <td className="px-4 py-3 text-gray-700">{item.description}</td>
  <td className="px-4 py-3">
    <div className="flex gap-2 items-center">
      <span className="text-sm text-red-600 font-medium">Are you sure?</span>
      <button
        onClick={() => handleDeleteConfirm(item.code)}
        disabled={isDeleting}
        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
      >
        {isDeleting ? 'Deleting...' : 'Confirm'}
      </button>
      <button
        onClick={handleCancelDelete}
        className="px-3 py-1 text-sm border border-gray-300 text-gray-500 rounded hover:bg-gray-50"
      >
        Cancel
      </button>
    </div>
  </td>
</tr>
```

---

## 5. Feedback Components

### 5a. Success Toast

```tsx
// PATTERN: Success Toast
// Fixed bottom-right. Auto-dismisses after 3 seconds via useEffect.
// Always rendered at the bottom of the page shell, outside the main content div.

{successMessage && (
  <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded shadow-lg z-50 flex items-center gap-2">
    <span className="text-green-600">✓</span>
    <span className="text-sm">{successMessage}</span>
  </div>
)}
```

Auto-dismiss logic:
```ts
// Always use this exact pattern for auto-dismissing the toast
useEffect(() => {
  if (successMessage) {
    const timer = setTimeout(() => setSuccessMessage(null), 3000)
    return () => clearTimeout(timer)
  }
}, [successMessage])
```

### 5b. Error Banner

```tsx
// PATTERN: Error Banner
// Shown at the top of the page content area when any API call fails.
// Dismissible via the ✕ button.

{error && (
  <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded mb-4 flex justify-between items-center">
    <span className="text-sm">{error}</span>
    <button
      onClick={() => setError(null)}
      className="text-red-600 hover:text-red-800 font-bold ml-4 text-lg leading-none"
    >
      ✕
    </button>
  </div>
)}
```

### 5c. Loading Spinner

```tsx
// PATTERN: Loading Spinner
// Centered in the table area while initial data is being fetched.

{isLoading && (
  <div className="flex justify-center items-center py-12">
    <div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full" />
  </div>
)}
```

### 5d. Field Validation Error

```tsx
// PATTERN: Field Validation Error
// Shown below each input in the Add New form only.

{formErrors.fieldName && (
  <span className="text-xs text-red-500 mt-1">{formErrors.fieldName}</span>
)}
```

---

## 6. Empty and Disabled States

### Empty Table
```tsx
// PATTERN: Empty State — shown when table has no records after filtering
<tr>
  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">
    No records found.
  </td>
</tr>
```

### Disabled Button (loading state)
```tsx
// PATTERN: Disabled button during async operation
// Always add disabled + opacity to any button that triggers an API call
<button
  disabled={isLoading}
  className="... disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isLoading ? 'Saving...' : 'Save'}
</button>
```

---

## 7. Color and State Reference

| State | Background | Border | Text |
|---|---|---|---|
| Normal row | `bg-white` | `divide-gray-100` | `text-gray-700` |
| Hovered row | `hover:bg-gray-50` | — | — |
| Edit mode row | `bg-blue-50` | — | — |
| Delete confirm row | `bg-red-50` | — | — |
| Table header | `bg-gray-50` | `border-gray-200` | `text-gray-500` |
| Page background | `bg-gray-50` | — | — |
| Card/section | `bg-white` | `border-gray-200` | — |

| Button | Background | Border | Text |
|---|---|---|---|
| Edit | `bg-white` | `border-gray-400` | `text-gray-700` |
| Save | `bg-white` | `border-blue-500` | `text-blue-600` |
| Cancel | `bg-white` | `border-gray-300` | `text-gray-500` |
| Delete | `bg-red-500` | — | `text-white` |
| Confirm Delete | `bg-red-600` | — | `text-white` |
| Create | `bg-gray-800` | — | `text-white` |

---

## 8. How to Reference This File in Prompts

Add this line to every GPT-5 prompt, alongside the AGENTS.md instruction:

```
Read AGENTS.md and UI-PATTERNS.md first.
Use the exact TSX patterns from UI-PATTERNS.md for all components —
do not invent new class combinations or layout variations.
```

That is all that is needed. No further UI description is required in the prompt
as long as the page follows the standard maintenance page layout defined in Section 1.
