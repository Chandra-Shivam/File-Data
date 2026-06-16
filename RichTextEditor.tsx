"use client";

import React, { useEffect, useRef } from "react";

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  minHeight?: number | string;
  className?: string;
  readOnly?: boolean;
  showToolbar?: boolean;
};

/**
 * RichTextEditor
 * - Renders and edits HTML (bold/italic/underline, headings, lists, links).
 * - Emits HTML string via onChange so the backend can persist tags verbatim.
 * - Designed to be a drop-in replacement for multiline textareas.
 */
export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  ariaLabel,
  minHeight = 120,
  className = "",
  readOnly = false,
  showToolbar,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const lastRangeRef = useRef<Range | null>(null);
  const caretIndexRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // Derived (not state) so the placeholder reflects the CURRENT value every render —
  // including async-loaded and read-only content. A stale flag left the placeholder
  // overlapping content that arrived after mount.
  const isEmpty = !value || stripHtml(value).trim().length === 0;

  // Keep editor content in sync when `value` changes externally (mount, tab switch,
  // async load) — but NEVER while the user is typing (editor focused), or rewriting
  // innerHTML would reset the caret to offset 0 (the cursor-jump / reversal bug).
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (document.activeElement !== el && el.innerHTML !== (value ?? '')) {
      el.innerHTML = value ?? '';
    }
  }, [value]);

  // Track selection inside editor to restore it when using toolbar buttons
  useEffect(() => {
    const onSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      const el = editorRef.current;
      if (el && el.contains(range.startContainer) && el.contains(range.endContainer)) {
        lastRangeRef.current = range.cloneRange();
      }
    };
    document.addEventListener("selectionchange", onSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", onSelectionChange);
    };
  }, []);

  const handleInput = () => {
    const el = editorRef.current;
    if (el) onChange(el.innerHTML);
  };

  const handleBlur = () => {
    const el = editorRef.current;
    if (!el) return;
    const html = normalizeHtml(el.innerHTML);
    onChange(html);
  };

  const saveCurrentSelection = () => {
    const sel = window.getSelection();
    const el = editorRef.current;
    if (!sel || sel.rangeCount === 0 || !el) return;
    const range = sel.getRangeAt(0);
    if (el.contains(range.startContainer) && el.contains(range.endContainer)) {
      lastRangeRef.current = range.cloneRange();
      // Also record character offset for robust restoration
      const caretIdx = getCaretCharacterOffsetWithin(el);
      if (caretIdx >= 0) {
        caretIndexRef.current = caretIdx;
      }
    }
  };

  const restoreSelection = () => {
    const el = editorRef.current;
    if (!el) return false;
    const sel = window.getSelection();
    if (!sel) return false;
    if (lastRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(lastRangeRef.current);
      return true;
    }
    return false;
  };

  // Compute caret character offset within editor for robust caret restoration across re-renders
  function getCaretCharacterOffsetWithin(root: Node): number {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return -1;
    const range = sel.getRangeAt(0);
    if (!root.contains(range.startContainer)) return -1;
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(root);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    return preCaretRange.toString().length;
  }

  // Set caret position by character offset within the editor content
  function setCaretByCharacterOffset(root: Node, offset: number): boolean {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let currentOffset = 0;
    let node: Text | null = walker.nextNode() as Text | null;
    while (node) {
      const text = node.textContent || "";
      const nextOffset = currentOffset + text.length;
      if (offset <= nextOffset) {
        const withinNodeOffset = Math.max(0, Math.min(text.length, offset - currentOffset));
        const range = document.createRange();
        range.setStart(node, withinNodeOffset);
        range.collapse(true);
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(range);
        }
        // Also update saved selection refs
        lastRangeRef.current = range.cloneRange();
        return true;
      }
      currentOffset = nextOffset;
      node = walker.nextNode() as Text | null;
    }
    // If offset beyond end, place at end
    const range = document.createRange();
    range.selectNodeContents(root);
    range.collapse(false);
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
    lastRangeRef.current = range.cloneRange();
    return true;
  }

  const focusEditor = () => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (!sel) return;
    // Try to restore saved range, otherwise place caret at end
    if (!restoreSelection()) {
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      lastRangeRef.current = range.cloneRange();
    }
  };

  const execCmd = (command: string, valueArg?: string) => {
    // Ensure editor is focused and selection restored to inside it
    focusEditor();
    try {
      document.execCommand(command, false, valueArg ?? "");
      // Update saved selection after command
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const el = editorRef.current;
        if (el && el.contains(range.startContainer) && el.contains(range.endContainer)) {
          lastRangeRef.current = range.cloneRange();
        }
      }
      handleInput();
      // Ensure caret remains where the user left it after React re-render
      setTimeout(() => {
        restoreSelection();
      }, 0);
    } catch {
      // no-op
    }
  };

  const createLink = () => {
    const url = window.prompt("Enter URL");
    if (!url) return;
    // Basic normalization
    const normalized =
      url.startsWith("http://") || url.startsWith("https://") || url.startsWith("mailto:") ? url : `https://${url}`;
    execCmd("createLink", normalized);
  };

  const removeFormatting = () => {
    focusEditor();
    try {
      document.execCommand("removeFormat");
      document.execCommand("unlink");
      handleInput();
    } catch {
      // no-op
    }
  };

  // Insertion helpers (images/tables)
  const insertHtmlAtSelection = (html: string) => {
    focusEditor();
    const el = editorRef.current;
    if (!el) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (!el.contains(range.startContainer) || !el.contains(range.endContainer)) return;
    const frag = range.createContextualFragment(html);
    range.deleteContents();
    const lastNode = frag.lastChild;
    range.insertNode(frag);
    if (lastNode) {
      const newRange = document.createRange();
      newRange.setStartAfter(lastNode);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
      lastRangeRef.current = newRange.cloneRange();
      const caretIdx = getCaretCharacterOffsetWithin(el);
      if (caretIdx >= 0) caretIndexRef.current = caretIdx;
    }
    handleInput();
  };

  const insertImageFromUrl = () => {
    const url = window.prompt("Enter image URL");
    if (!url) return;
    const normalized = url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")
      ? url
      : `https://${url}`;
    insertHtmlAtSelection(`<img src="${normalized.replace(/"/g, '"')}" style="max-width:100%;height:auto;display:block;" alt="" />`);
  };

  const triggerImageFilePicker = () => {
    fileInputRef.current?.click();
  };

  const onImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      insertHtmlAtSelection(`<img src="${dataUrl.replace(/"/g, '"')}" style="max-width:100%;height:auto;display:block;" alt="" />`);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  const insertTable = () => {
    let rows = Number(window.prompt("Rows (1-10)", "2"));
    let cols = Number(window.prompt("Columns (1-10)", "2"));
    if (!Number.isFinite(rows) || rows <= 0) rows = 2;
    if (!Number.isFinite(cols) || cols <= 0) cols = 2;
    rows = Math.min(Math.max(rows, 1), 10);
    cols = Math.min(Math.max(cols, 1), 10);
    const cells = Array.from({ length: cols }).map(() => `<td style="border:1px solid #cbd5e1;padding:4px;">&nbsp;</td>`).join("");
    const trs = Array.from({ length: rows }).map(() => `<tr>${cells}</tr>`).join("");
    const tableHtml = `<table style="width:100%;border-collapse:collapse;border:1px solid #cbd5e1;margin:6px 0;">${trs}</table>`;
    insertHtmlAtSelection(tableHtml);
  };

  const renderToolbar = (showToolbar ?? !readOnly);

  return (
    <div className={"border border-slate-300 rounded shadow-sm bg-white focus-within:ring-2 focus-within:ring-[color:var(--brand-primary)]/30 " + className}>
      {/* Toolbar */}
      {renderToolbar ? (<div className="flex flex-wrap items-center gap-1 px-2 py-1 border-b border-slate-200 bg-slate-50">
        <ToolbarButton onClick={() => execCmd("bold")} label="B" ariaLabel="Bold" className="font-bold" />
        <ToolbarButton onClick={() => execCmd("italic")} label="I" ariaLabel="Italic" className="italic" />
        <ToolbarButton onClick={() => execCmd("underline")} label="U" ariaLabel="Underline" className="underline" />

        <div className="w-px h-4 bg-slate-300 mx-1" />

        <ToolbarButton onClick={() => execCmd("formatBlock", "<p>")} label="P" ariaLabel="Paragraph" />
        <ToolbarButton onClick={() => execCmd("formatBlock", "<h1>")} label="H1" ariaLabel="Heading 1" />
        <ToolbarButton onClick={() => execCmd("formatBlock", "<h2>")} label="H2" ariaLabel="Heading 2" />
        <ToolbarButton onClick={() => execCmd("formatBlock", "<div>")} label="DIV" ariaLabel="Div block" />

        <div className="w-px h-4 bg-slate-300 mx-1" />

        <ToolbarButton onClick={() => execCmd("insertUnorderedList")} label="• List" ariaLabel="Bulleted list" />
        <ToolbarButton onClick={() => execCmd("insertOrderedList")} label="1. List" ariaLabel="Numbered list" />

        <div className="w-px h-4 bg-slate-300 mx-1" />

        <ToolbarButton onClick={insertImageFromUrl} label="Img URL" ariaLabel="Insert image from URL" />
        <ToolbarButton onClick={triggerImageFilePicker} label="Upload" ariaLabel="Upload image file" />
        <ToolbarButton onClick={insertTable} label="Table" ariaLabel="Insert table" />

        <div className="w-px h-4 bg-slate-300 mx-1" />

        <ToolbarButton onClick={createLink} label="Link" ariaLabel="Insert link" />
        <ToolbarButton onClick={removeFormatting} label="Clear" ariaLabel="Clear formatting" />
        <input ref={fileInputRef} type="file" accept="image/*" onChange={onImageFileChange} className="hidden" />
      </div>) : null}

      {/* Editable area */}
      <div className="relative">
        {isEmpty && placeholder ? (
          <span className="pointer-events-none absolute left-3 top-3 text-sm text-slate-400">{placeholder}</span>
        ) : null}
        <div
          ref={editorRef}
          role="textbox"
          aria-label={ariaLabel}
          contentEditable={!readOnly}
          aria-readonly={readOnly}
          suppressContentEditableWarning
          className="p-3 text-sm min-h-[120px] focus:outline-none"
          style={{ minHeight }}
          onInput={handleInput}
          onBlur={handleBlur}
          onFocus={saveCurrentSelection}
          onKeyUp={saveCurrentSelection}
          onMouseUp={saveCurrentSelection}
        />
      </div>
    </div>
  );
}

function ToolbarButton({
  onClick,
  label,
  ariaLabel,
  className = "",
}: {
  onClick: () => void;
  label: string;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      className={
        "px-2 py-1 text-xs rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 " +
        className
      }
      title={ariaLabel ?? label}
    >
      {label}
    </button>
  );
}

/** Utility: remove tags to detect emptiness for placeholder */
function stripHtml(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html || "";
  return (div.textContent || div.innerText || "").replace(/\u00A0/g, " ");
}

/** Utility: simple normalization for common innerHTML quirks */
function normalizeHtml(html: string): string {
  // Trim extraneous whitespace but preserve formatting tags
  return html.replace(/\s+$/g, "");
}
