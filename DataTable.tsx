import React from "react";

type SortDir = "asc" | "desc";

export type Column<T> = {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  className?: string;
  cellClassName?: string;
  render?: (row: T) => React.ReactNode;
};

export type DataTableProps<T> = {
  columns: Array<Column<T>>;
  rows: T[];
  sortBy?: string;
  sortDir?: SortDir;
  onSort?: (key: string) => void;
  selectedId?: string | null;
  editingId?: string | null;
  getRowId: (row: T) => string;
  onSelect?: (id: string) => void;
  onOpen?: (row: T) => void; // double-click or Enter/Space
  rowActions?: (row: T) => React.ReactNode;
  // Accessibility
  tableLabel?: string;
  className?: string;
  bodyClassName?: string;
  theadClassName?: string;
  showSelection?: boolean;
  selectedRowClassName?: string;
  editingRowClassName?: string;
};

function cx(...parts: Array<string | undefined | false | null>) {
  return parts.filter(Boolean).join(" ");
}

export default function DataTable<T>({
  columns,
  rows,
  sortBy,
  sortDir,
  onSort,
  selectedId,
  editingId,
  getRowId,
  onSelect,
  onOpen,
  rowActions,
  tableLabel,
  className,
  bodyClassName,
  theadClassName = "bg-gray-50 text-gray-800",
  showSelection = true,
  selectedRowClassName = "bg-gray-100",
  editingRowClassName = "bg-amber-100 outline outline-2 outline-amber-500 shadow-[inset_4px_0_0_#f59e0b]",
}: DataTableProps<T>) {
const tableClasses = "min-w-full text-sm border border-slate-200 rounded-lg overflow-hidden shadow-sm";
const theadClasses =
    "sticky top-0 z-10 text-xs font-medium border-b border-slate-200";
const rowBase =
    "group border-t border-slate-200 odd:bg-white hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[color:var(--brand-primary)]/50 transition-colors cursor-pointer";

  const handleHeaderClick = (col: Column<T>) => {
    if (!col.sortable || !onSort) return;
    onSort(String(col.key));
  };

  const ariaSortFor = (col: Column<T>): React.AriaAttributes["aria-sort"] => {
    if (!col.sortable || !sortBy) return "none";
    if (String(col.key) !== sortBy) return "none";
    return sortDir === "asc" ? "ascending" : "descending";
  };

  // Deterministic keys for duplicate row ids to avoid remount churn
  const idCounts = new Map<string, number>();

  return (
    <table className={cx(tableClasses, className)} aria-label={tableLabel}>
      <thead className={cx(theadClasses, theadClassName)}>
        <tr>
          {/* Selection column */}
{showSelection && <th className="px-3 py-2 text-left w-10 whitespace-nowrap"><span className="sr-only">Select</span></th>}
          {columns.map((col) => (
            <th
              key={String(col.key)}
className={cx("px-3 py-2 text-left select-none whitespace-nowrap", col.sortable ? "cursor-pointer" : undefined, col.className)}
              aria-sort={ariaSortFor(col)}
            >
              {col.sortable ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-left"
                  onClick={() => handleHeaderClick(col)}
                  title={`Sort by ${col.header}`}
                >
                  {col.header}
                  {sortBy === String(col.key) ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
                </button>
              ) : (
                <span className="inline-flex items-center gap-1">{col.header}</span>
              )}
            </th>
          ))}
          {/* Actions column */}
          {rowActions && (
            <th className="px-3 py-2 text-left w-40 whitespace-nowrap"><span className="sr-only">Actions</span></th>
          )}
        </tr>
      </thead>
      <tbody className={bodyClassName}>
        {rows.map((row) => {
          const id = getRowId(row);
          const count = (idCounts.get(id) ?? 0) + 1;
          idCounts.set(id, count);
          const rowKey = count === 1 ? id : `${id}#${count}`;
          return (
            <tr
              key={rowKey}
              className={cx(
                rowBase,
                editingId === id
                  ? editingRowClassName
                  : selectedId === id
                  ? selectedRowClassName
                  : undefined
              )}
              onClick={() => onSelect && onSelect(id)}
              onDoubleClick={() => onOpen && onOpen(row)}
              tabIndex={0}
              onKeyDown={(e) => {
                const el = e.target as HTMLElement;
                if (el.closest("input,select,textarea,[contenteditable=true]")) return;
                const isSpace = e.key === " " || e.key === "Spacebar" || e.code === "Space";
                if (e.key === "Enter" || isSpace) {
                  e.preventDefault();
                  onSelect && onSelect(id);
                  onOpen && onOpen(row);
                }
              }}
            >
              {showSelection && (
<td className="px-3 py-2 align-middle">
                  <input
                    type="radio"
                    name="selectedRow"
                    checked={selectedId === id}
                    onChange={() => onSelect && onSelect(id)}
                    aria-label={`Select row ${id}`}
                  />
                </td>
              )}
              {columns.map((col) => (
<td key={String(col.key)} className={cx("px-3 py-2 whitespace-nowrap align-middle", col.cellClassName)}>
                  {col.render ? col.render(row) : String((row as any)[col.key])}
                </td>
              ))}
              {rowActions && (
                <td className="px-3 py-2 whitespace-nowrap">
                  {rowActions(row)}
                </td>
              )}
            </tr>
          );
        })}
        {rows.length === 0 && (
          <tr>
            <td colSpan={columns.length + (showSelection ? 1 : 0) + (rowActions ? 1 : 0)} className="px-3 py-6 text-center text-sm text-gray-500">
              No records match the current criteria.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
