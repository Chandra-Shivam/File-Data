"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DataTable, { Column } from "@/components/table/DataTable";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { Modal } from "@/components/ui/Dialog";
import ReviewPDFModal from "@/components/pdf/ReviewPDFModal";
import { searchSamples } from "@/services/api/samples";
import { getReviewByKeys, getReviewQueuePage, ReviewQueueRow } from "@/services/api/reviews";
import { useToast } from "@/components/providers/ToastProvider";

function IconHome(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5 10v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V10" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

type ReviewRow = ReviewQueueRow;



function currencyToNumber(v: string) {
  return Number(v.replace(/[$,]/g, "")) || 0;
}

export default function ReviewQueuePage() {
  const toast = useToast();
  const router = useRouter();

  const [sampleSelected, setSampleSelected] = useState<string | null>(null);
  const [sampleOptions, setSampleOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [loadingSamples, setLoadingSamples] = useState<boolean>(false);
  const [loadingQueue, setLoadingQueue] = useState<boolean>(false);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  const [myView, setMyView] = useState<string>("my");
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [progressCounts, setProgressCounts] = useState<Array<{ status: string; count: number; highlight?: boolean }>>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("borrower");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [pdfRow, setPdfRow] = useState<ReviewQueueRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadAllSamples() {
      try {
        setLoadingSamples(true);
        const pageSize = 500;
        let page = 1;
        const options: Array<{ label: string; value: string }> = [];
        while (true) {
          const res = await searchSamples({ page, pageSize });
          if (cancelled) return;
          const items = Array.isArray(res?.items) ? res.items : [];
          for (const s of items) {
            const label = (s.sample_name ?? `Sample ${s.sample_id}`).toString();
            options.push({ label, value: String(s.sample_id) });
          }
          const total = Number(res?.total ?? options.length);
          const maxPage = Math.max(1, Math.ceil(total / pageSize));
          if (items.length === 0 || page >= maxPage) break;
          page += 1;
        }
        setSampleOptions(options);
      } catch (err) {
        console.error("Failed to load samples", err);
        try { toast?.showError?.("Failed to load samples"); } catch {}
      } finally {
        if (!cancelled) setLoadingSamples(false);
      }
    }
    loadAllSamples();
    return () => { cancelled = true; };
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    async function loadQueue() {
      try {
        if (!cancelled) setLoadingQueue(true);
        const sampleIdNum = sampleSelected !== null ? Number(sampleSelected) : undefined;
        const res = await getReviewQueuePage(sampleIdNum);
        if (cancelled) return;
        const r = Array.isArray(res?.rows) ? res.rows : [];
        const pc = Array.isArray(res?.progressCounts) ? res.progressCounts : [];
        setRows(r);
        setProgressCounts(pc);
        if (Array.isArray(res?.samples) && res.samples.length > 0) {
          const options = res.samples.map(s => ({ label: s.name, value: s.id }));
          setSampleOptions(options);
        }
      } catch (err) {
        console.error("Failed to load review queue page", err);
        try { toast?.showError?.("Failed to load review queue"); } catch {}
      } finally {
        if (!cancelled) setLoadingQueue(false);
      }
    }
    loadQueue();
    setSelectedId(null);
    return () => { cancelled = true; };
  }, [toast, sampleSelected]);

  const totals = useMemo(
    () => progressCounts.reduce((s, x) => s + x.count, 0),
    [progressCounts]
  );

  const columns: Array<Column<ReviewRow>> = useMemo(
    () => [
{ key: "ecif", header: "eCIF #", sortable: true, width: 80, cellClassName: "tabular-nums text-slate-600 text-sm" },
      {
        key: "borrower",
        header: "Borrower Name / Linesheet",
        sortable: true,
        render: (r) => {
          const ecifPath = encodeURIComponent(String(r.ecif ?? "").trim());
          const href = ecifPath
            ? `/review/${ecifPath}/review-info?section=review-info&borrower=${encodeURIComponent(r.borrower)}`
            : "/review-queue";
          return (
            <span className="inline-flex items-center">
              <Link
                href={href}
                prefetch={false}
                className="text-slate-800 font-medium hover:underline"
                onClick={(e) => { e.preventDefault(); void handleOpen(r); }}
              >
                {r.borrower}
              </Link>
              <Button
                type="button"
                size="xxs"
                variant="neutral"
                className="ml-2 text-slate-400 hover:text-[#1F3864] cursor-pointer inline-flex px-1 py-0"
                onClick={(e) => { e.stopPropagation(); setPdfRow(r); }}
                title="Open Review Summary PDF"
                aria-label="Open Review Summary PDF"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12 a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </Button>
            </span>
          );
        },
      },
{ key: "reviewer", header: "Reviewer", sortable: true, width: 160, cellClassName: "text-slate-600 text-sm" },
{ key: "exposure", header: "Exposure", sortable: true, width: 120, className: "text-right", cellClassName: "text-right tabular-nums text-slate-600 text-sm" },
{ key: "bankPd", header: "Bank PD", sortable: true, width: 80, className: "hidden xl:table-cell text-right", cellClassName: "hidden xl:table-cell text-right tabular-nums text-slate-600 text-sm" },
{ key: "casPd", header: "CAS PD", sortable: true, width: 80, className: "hidden xl:table-cell text-right", cellClassName: "hidden xl:table-cell text-right tabular-nums text-slate-600 text-sm" },
{ key: "completed", header: "Completed", sortable: true, width: 100, cellClassName: "tabular-nums text-slate-600 text-sm" },
      {
        key: "open",
        header: "",
        sortable: false,
        width: 70,
        className: "text-right",
        cellClassName: "text-right",
        render: (r) => (
          <div
            role="button"
            className="inline-flex items-center justify-center rounded bg-[#1F3864] text-white text-xs font-semibold px-2 py-1 cursor-pointer select-none whitespace-nowrap hover:opacity-90"
            onClick={(e) => { e.stopPropagation(); void handleOpen(r); }}
            aria-label="Open Review Form"
            title="Open Review Form"
          >
            Open
          </div>
        ),
      },
    ],
    []
  );

  const handleOpen = async (r: ReviewRow) => {
    setLoadingDetails(true);
    try {
      // Resolve keys to search on:
      // - Prefer explicit Review_Id from the row
      // - If a Sample is selected, pass sampleId+ecif to scope lookup
      // - Fall back to ecif-only (backend will take most recent)
      const reviewId = Number.isFinite(Number(r.id)) ? Number(r.id) : undefined;

      // Resolve ECIF from row or by refreshing queue if needed
      let ecif = String(r.ecif ?? "").trim();
      if (!ecif) {
        try {
          const refreshed = await getReviewQueuePage();
          const updated = Array.isArray(refreshed?.rows) ? refreshed.rows.find(x => String(x.id) === String((r as any).id)) : undefined;
          if (updated?.ecif) ecif = String(updated.ecif).trim();
        } catch { /* ignore */ }
      }

      // Prefer the row's hidden SampleId; fall back to the dropdown selection
      const sampleId = (r as any)?.sampleId && !isNaN(Number((r as any).sampleId))
        ? Number((r as any).sampleId)
        : (sampleSelected ? Number(sampleSelected) : undefined);

      const res = await getReviewByKeys({
        reviewId,
        sampleId,
        ecif: ecif || undefined,
      });

      // Determine ECIF for routing (prefer server-resolved); fall back to ID-based slug if missing
      const ecifForRoute =
        String((res as any)?.ecif ?? ecif ?? "").trim() ||
        `id-${reviewId ?? (sampleId ?? "na")}`;

      // Cache the payload for the detail page (use both ecif and reviewId to avoid collisions)
      try {
        const cacheKey = `reviewQueue:${ecifForRoute}:${reviewId ?? "na"}`;
        sessionStorage.setItem(cacheKey, JSON.stringify(res));
      } catch {}

      // Include keys in the URL so detail page hooks can derive cache key and avoid refetching
      const qs = new URLSearchParams({
        section: "review-info",
        borrower: r.borrower,
        ...(reviewId != null ? { reviewId: String(reviewId) } : {}),
        ...(sampleId != null ? { sampleId: String(sampleId) } : {})
      });
      router.push(`/review/${encodeURIComponent(ecifForRoute)}/review-info?${qs.toString()}`);
    } catch (err: any) {
      console.error("Failed to open review", err);
      try { toast?.showError?.(err?.message || "Failed to load review"); } catch {}
    } finally {
      setLoadingDetails(false);
    }
  };

  const sortedRows = useMemo(() => {
    const arr = [...rows];
    const key = sortBy as keyof ReviewRow;
    arr.sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      const norm = (val: any) => {
        switch (key) {
          case "exposure":
            return currencyToNumber(val as string);
          case "bankPd":
          case "casPd":
            return Number(val);
          case "completed":
            return new Date(String(val)).getTime();
          default:
            return String(val).toLowerCase();
        }
      };
      const na = norm(av);
      const nb = norm(bv);
      if (na < nb) return sortDir === "asc" ? -1 : 1;
      if (na > nb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [rows, sortBy, sortDir]);

  const handleSort = (key: string) => {
    if (key === sortBy) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Top chrome bar */}
      <div className="rounded-lg overflow-hidden border border-slate-200 shadow-sm">
        <div className="bg-slate-800 text-white px-3 py-2 flex items-center justify-between">
          <div className="font-semibold tracking-wide">REVIEW QUEUE</div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded"
              title="Home"
              aria-label="Home"
            >
              <IconHome />
              <span>Home</span>
            </Link>
          </div>
        </div>

        {/* Body */}
        <div className="p-3 md:p-4 bg-white">
          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-8 flex items-center gap-3">
              <div className="w-64">
                <label className="block text-xs text-slate-600 mb-1">Select Sample</label>
                <Select
                  size="sm"
                  className="bg-white w-full"
                  value={sampleSelected ?? ""}
                  onChange={(e) => setSampleSelected(e.target.value || null)}
                >
                  <option value="">{loadingSamples ? "Loading samples…" : "Select sample…"}</option>
                  {sampleOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="md:col-span-4 md:justify-self-end flex items-end gap-2">
              <div className="w-48">
                <label className="block text-xs text-slate-600 mb-1">My View</label>
                <Select
                  size="sm"
                  className="bg-white w-full"
                  value={myView}
                  onChange={(e) => setMyView(e.target.value)}
                >
                  <option value="my">My View</option>
                  <option value="team">My Team</option>
                  <option value="dept">My Department</option>
                </Select>
              </div>
            </div>
          </div>

          {/* Content area */}
          <div className="mt-4 grid gap-4 items-start" style={{ gridTemplateColumns: '300px minmax(0, 1fr)' }}>
            {/* Left: Progress Status */}
            <aside>
              <div className="rounded border border-slate-200 overflow-hidden">
                <div className="bg-[#1F3864] text-white px-3 py-2 text-xs font-semibold border-b border-slate-200">Progress Status</div>
                <div className="divide-y divide-slate-200">
                  {progressCounts.map((p) => (
                    <div
                      key={p.status}
                      className={`flex items-center justify-between px-3 py-2 text-sm bg-white ${p.highlight ? "bg-slate-50 font-semibold" : "hover:bg-slate-50"}`}
                    >
                      <span>{p.status}</span>
                      <span className="tabular-nums font-semibold text-right">{p.count}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-3 py-2 text-sm bg-slate-800 text-white">
                    <span className="font-semibold">Totals</span>
                    <span className="tabular-nums font-semibold">{totals}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                Switch between My View, My Team, or My Department to see other sampled reviews and unassigned items.
              </p>
            </aside>

            {/* Right: Queue table */}
            <section className="min-w-0">
              <div className="bg-white border border-slate-200 rounded h-full overflow-hidden">
                <div className="px-3 py-2 bg-[#1F3864] text-white text-xs font-semibold border-b border-slate-200">
                  Draft Completed
                </div>
                <div className="overflow-x-auto">
                  <DataTable<ReviewRow>
                    columns={columns}
                    rows={sortedRows}
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSort={handleSort}
                    selectedId={selectedId}
                    getRowId={(r) => r.id}
                    onSelect={setSelectedId}
                    onOpen={(r) => { void handleOpen(r); }}
                    tableLabel="Review Queue"
                    className="w-full"
                    theadClassName="bg-[#1F3864] text-white"
                    selectedRowClassName="bg-slate-100"
                  />
                </div>
                <div className="text-xs text-slate-500 px-3 py-2 border-t border-slate-200">
                  Tip: Double-click a row or press Enter/Space to open.
                </div>
              </div>
              {pdfRow && (
                <ReviewPDFModal
                  reviewId={pdfRow.id}
                  ecif={pdfRow.ecif}
                  borrower={pdfRow.borrower}
                  onClose={() => setPdfRow(null)}
                />
              )}
            </section>
          </div>
        </div>
      </div>
      <Modal open={loadingQueue} onClose={() => {}} showCloseButton={false} size="sm" title="Loading">
        <div className="text-sm text-slate-800">Loading Review Queue...</div>
      </Modal>
      <Modal open={loadingDetails} onClose={() => {}} showCloseButton={false} size="sm" title="Loading">
        <div className="text-sm text-slate-800">Loading Review Details...</div>
      </Modal>
    </div>
  );
}
