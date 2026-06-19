"use client";

import { SectionCard, Field, useEditMode, EditModeProvider } from "../ui";
import { useState, useEffect } from "react";
import { useReviewInfo } from "./hooks/useReviewInfo";
import { saveReview } from "@/services/api/reviews";
import { useReviewData } from "@/app/review/[ecif]/review-info/ReviewDataContext";
import { useParams, useRouter, usePathname, useSearchParams } from "next/navigation";
import Select from "@/components/ui/Select";
import { listUsers, type CasUser } from "@/services/api/casUsers";
import { useFormChangesOptional } from "@/app/review/[ecif]/review-info/FormChangesContext";
import ReactDOM from "react-dom";

function toDisplayFromInputDate(s: string): string {
  if (!s) return "";
  const parts = s.split("-");
  if (parts.length !== 3) return s;
  const [y, m, d] = parts;
  if (!y || !m || !d) return s;
  return `${m}/${d}/${y}`;
}

export default function ReviewInfoSection({ unlockOpen: unlockOpenProp, onUnlockOpenChange }: { unlockOpen?: boolean; onUnlockOpenChange?: (open: boolean) => void }) {
  const [localUnlockOpen, setLocalUnlockOpen] = useState(false);
  const unlockOpen = unlockOpenProp ?? localUnlockOpen;
  const setUnlockOpen = onUnlockOpenChange ?? setLocalUnlockOpen;
  const [unlockReason, setUnlockReason] = useState("GENERAL");
  const [reconsiderationOpen, setReconsiderationOpen] = useState(false);
  const [appealOpen, setAppealOpen] = useState(false);
  const [reviewLocked, setReviewLocked] = useState(false);
  const { data, isLoading, error } = useReviewInfo();
  const { response } = useReviewData();
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const reloadPageData = (): void => {
    const next = new URLSearchParams(sp?.toString() ?? "");
    next.set("t", String(Date.now()));
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    router.refresh();
  };
  const ecifFromRoute = (() => {
    const p: any = params as any;
    if (!p) return "";
    const v = (p as any).ecif;
    if (typeof v === "string") return v;
    if (Array.isArray(v) && v.length > 0) return v[0] ?? "";
    return "";
  })();
  const d = data?.details;
  const a = data?.assignments;
  const s = data?.status;
  const { isEditing } = useEditMode();
  const changes = useFormChangesOptional();
  const [croUsers, setCroUsers] = useState<CasUser[]>([]);
  const [managerUsers, setManagerUsers] = useState<CasUser[]>([]);
  const [selectedReviewer, setSelectedReviewer] = useState<string>(a?.reviewerName ?? "");
  const [selectedManager, setSelectedManager] = useState<string>(a?.managerName ?? "");
  const [selectedReviewerEmail, setSelectedReviewerEmail] = useState<string>(a?.reviewerEmail ?? "");
  const [selectedManagerEmail, setSelectedManagerEmail] = useState<string>(a?.managerEmail ?? "");

  const ec = data?.effectiveChallenge;

  useEffect(() => {
    listUsers()
      .then((users) => {
        setCroUsers(users.filter((u) => u.role === "CRO" && u.active));
        setManagerUsers(users.filter((u) => u.role === "Manager" && u.active));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (a?.reviewerName) setSelectedReviewer(a.reviewerName);
    if (a?.managerName) setSelectedManager(a.managerName);
    if (a?.reviewerEmail) setSelectedReviewerEmail(a.reviewerEmail);
    if (a?.managerEmail) setSelectedManagerEmail(a.managerEmail);
  }, [a?.reviewerName, a?.managerName, a?.reviewerEmail, a?.managerEmail]);

  function decisionValue(v?: string) {
    if (!v) return "";
    const s = v.trim().toUpperCase().replace(/\s+/g, "_");
    if (s === "NEW_INFORMATION") return "NEW_INFO";
    if (s.includes("NO_CHANGE")) return "NO_CHANGE";
    if (s.includes("APPROVED")) return "APPROVED";
    if (s.includes("DECLINED") || s.includes("DENIED")) return "DECLINED";
    if (s.includes("ERROR")) return "ERROR_CORRECTION";
    if (s.includes("NEW_INFO")) return "NEW_INFO";
    if (s.includes("OTHER")) return "OTHER";
    return s;
  }

  function rationaleValue(v?: string) {
    if (!v) return "";
    const s = v.trim().toUpperCase().replace(/\s+/g, "_");
    if (s.includes("NEW")) return "NEW_INFO";
    if (s.includes("ERROR")) return "ERROR_CORRECTION";
    if (s.includes("OTHER")) return "OTHER";
    return s;
  }

  const [rcReconsidered, setRcReconsidered] = useState(!!ec?.reconsidered);
  const [rcDate, setRcDate] = useState<string>("");
  const [rcDesc, setRcDesc] = useState(ec?.reconsiderationDescription ?? "");
  const [rcDecision, setRcDecision] = useState(decisionValue(ec?.reconsiderationDecision));
  const [rcRationale, setRcRationale] = useState(ec?.reconsiderationRationale ?? "");
  const [submitting, setSubmitting] = useState(false);
  const rcDateDisplay = rcDate;

  // Appeal state
  const [apAppealed, setApAppealed] = useState(!!ec?.appealed);
  const [apDate, setApDate] = useState<string>("");
  const [apDesc, setApDesc] = useState(ec?.appealDescription ?? "");
  const [apDecision, setApDecision] = useState(decisionValue(ec?.appealDecision));
  const [apRationale, setApRationale] = useState(ec?.appealDecisionRationale ?? "");
  const apDateDisplay = apDate;

  // Track main "APPEALED" checkbox to show/hide edit icon beside it
  const [apMainChecked, setApMainChecked] = useState(!!ec?.appealed);
  useEffect(() => {
    setApMainChecked(!!ec?.appealed);
  }, [ec?.appealed]);

  useEffect(() => {
    if (reconsiderationOpen) {
      setRcReconsidered(!!ec?.reconsidered);
      setRcDate((ec?.reconsiderationDate && ec.reconsiderationDate.trim() !== "") ? ec.reconsiderationDate : "");
      setRcDesc(ec?.reconsiderationDescription ?? "");
      setRcDecision(decisionValue(ec?.reconsiderationDecision));
      setRcRationale(ec?.reconsiderationRationale ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reconsiderationOpen]);

  useEffect(() => {
    if (appealOpen) {
      setApAppealed(!!ec?.appealed);
      setApDate((ec?.appealDate && ec.appealDate.trim() !== "") ? ec.appealDate : "");
      setApDesc(ec?.appealDescription ?? "");
      setApDecision(decisionValue(ec?.appealDecision));
      setApRationale(ec?.appealDecisionRationale ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appealOpen]);

  // Hide any top-of-page "Unlock Review" button that may be rendered outside this section (e.g., header actions)
  useEffect(() => {
    if (typeof document === "undefined") return;
    const nodes = Array.from(document.querySelectorAll('button, [role="button"]')) as HTMLElement[];
    nodes.forEach((el) => {
      if (el.getAttribute("data-unlock-trigger") === "grid") return;
      const text = (el.textContent || "").trim();
      if (text === "Unlock Review") {
        el.setAttribute("aria-hidden", "true");
        el.style.display = "none";
      }
    });
  }, []);

  const decisionLabel = (v?: string) => {
    const s2 = decisionValue(v);
    switch (s2) {
      case "APPROVED": return "Approved";
      case "DECLINED": return "Declined";
      case "NO_CHANGE": return "No Change";
      default: return v ?? "";
    }
  };


  const rationaleLabel = (v?: string) => {
    const s2 = rationaleValue(v);
    switch (s2) {
      case "NEW_INFO": return "New Information";
      case "ERROR_CORRECTION": return "Error Correction";
      case "OTHER": return "Other";
      default: return v ?? "";
    }
  };
  return (
    <>
      {/* Lay out all three sections in one row on desktop to avoid scrolling and visually emphasize each card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Review Details" icon={<img src="/assets/ReviewDetails_Icon.png" alt="Review Details" className="h-5 w-5" />} className="col-span-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Sample ID" value={d?.sampleId ?? ""} section="reviewInfo" name="sampleId" />
            <Field label="Review ID" value={d?.reviewId ?? ""} section="reviewInfo" name="reviewId" />
            <Field label="Sample Target" value={d?.sampleTarget ?? ""} section="reviewInfo" name="sampleTarget" />
            <Field label="Review Type" value={d?.reviewType ?? ""} section="reviewInfo" name="reviewType" />
            <Field label="Sample Date" value={d?.sampleDate ?? ""} section="reviewInfo" name="sampleDate" />
            <Field label="Sample Type" value={d?.sampleType ?? ""} section="reviewInfo" name="sampleType" />
          </div>
        </SectionCard>

        <SectionCard title="Assignments" icon={<img src="/assets/ReviewAssignment_Icon.png" alt="Assignments" className="h-5 w-5" />} className="col-span-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isEditing ? (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500 
         font-medium uppercase tracking-wider">
                  REVIEWER NAME
                </label>
                <Select
                  size="sm"
                  className="bg-white w-full"
                  value={selectedReviewer}
                  onChange={(e) => {
                    setSelectedReviewer(e.target.value);
                    const user = croUsers.find(
                      (u) => u.name === e.target.value
                    );
                    changes?.setField("reviewInfo", "reviewerName", e.target.value);
                    if (user) {
                      setSelectedReviewerEmail(user.email);
                      changes?.setField("reviewInfo", "reviewerEmail", user.email);
                    }
                  }}
                >
                  <option value="">Select reviewer...</option>
                  {croUsers.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name}
                    </option>
                  ))}
                </Select>
              </div>
            ) : (
              <Field label="REVIEWER NAME" value={a?.reviewerName ?? ""} />
            )}
            {isEditing ? (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500 font-medium uppercase tracking-wider">REVIEWER EMAIL</label>
                <input
                  className="w-full h-9 border border-slate-300 rounded px-2 text-sm bg-white"
                  value={selectedReviewerEmail}
                  onChange={(e) => {
                    setSelectedReviewerEmail(e.target.value);
                    changes?.setField("reviewInfo", "reviewerEmail", e.target.value);
                  }}
                />
              </div>
            ) : a?.reviewerEmail ? (
              <div>
                <label className="block text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Reviewer Email</label>
                <a href={`mailto:${a.reviewerEmail}`} className="text-sm text-sky-700 underline">
                  {a.reviewerEmail}
                </a>
              </div>
            ) : (
              <Field label="Reviewer Email" value="" />
            )}
            {isEditing ? (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500 
         font-medium uppercase tracking-wider">
                  MANAGER
                </label>
                <Select
                  size="sm"
                  className="bg-white w-full"
                  value={selectedManager}
                  onChange={(e) => {
                    setSelectedManager(e.target.value);
                    const user = managerUsers.find(
                      (u) => u.name === e.target.value
                    );
                    changes?.setField("reviewInfo", "managerName", e.target.value);
                    if (user) {
                      setSelectedManagerEmail(user.email);
                      changes?.setField("reviewInfo", "managerEmail", user.email);
                    }
                  }}
                >
                  <option value="">Select manager...</option>
                  {managerUsers.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name}
                    </option>
                  ))}
                </Select>
              </div>
            ) : (
              <Field label="MANAGER" value={a?.managerName ?? ""} />
            )}
            {isEditing ? (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500 font-medium uppercase tracking-wider">MANAGER EMAIL</label>
                <input
                  className="w-full h-9 border border-slate-300 rounded px-2 text-sm bg-white"
                  value={selectedManagerEmail}
                  onChange={(e) => {
                    setSelectedManagerEmail(e.target.value);
                    changes?.setField("reviewInfo", "managerEmail", e.target.value);
                  }}
                />
              </div>
            ) : a?.managerEmail ? (
              <div>
                <label className="block text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Manager Email</label>
                <a href={`mailto:${a.managerEmail}`} className="text-sm text-sky-700 underline">
                  {a.managerEmail}
                </a>
              </div>
            ) : (
              <Field label="Manager Email" value="" />
            )}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500 font-medium uppercase tracking-wider">EXAMINER IN CHARGE</label>
              <input
                className="w-full h-9 border border-slate-200 rounded px-2 text-sm bg-slate-100 text-slate-500 cursor-not-allowed"
                value={a?.examinerInCharge ?? ""}
                readOnly
              />
            </div>
            <div></div>
          </div>
        </SectionCard>

        <SectionCard title="Review Status" icon={<img src="/assets/ReviewStatus_Icon.png" alt="Review Status" className="h-5 w-5" />} className="col-span-1 md:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="CRO START" value={s?.croStart ?? ""} />
            <Field label="CRO COMPLETE" value={s?.croComplete ?? ""} />
            <Field label="DISTRIBUTED" value={s?.distributed ?? ""} />
            <Field label="FINALIZED" value={s?.finalized ?? ""} />

            <Field label="APPROVER NAME" value={s?.approverName ?? ""} />
            <Field label="MGR APPROVAL" value={s?.mgrApproval ?? ""} />
            <Field label="INITIAL APPROVAL" value={s?.initialApproval ?? ""} />
            <div className="flex items-end">
              {s?.mgrApproval && (
                <div
                  role="button"
                  tabIndex={0}
                  data-unlock-trigger="grid"
                  onClick={() => setUnlockOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') 
                      setUnlockOpen(true)
                  }}
                  className="inline-flex items-center justify-center rounded-md bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold px-4 py-2 shadow cursor-pointer select-none w-auto mx-auto"
                >
                  Unlock Review
                </div>
              )}
            </div>

            <Field label="SECOND REVIEWER" value="" />
            <Field label="SECOND REVIEW DATE" value="" />
            <Field label="PRIOR REVIEW ID" value="" />
            <Field label="PRIOR REVIEW DATE" value="" />

            <div className="flex items-center justify-between text-sm">
              <label className="text-xs text-slate-500 font-medium uppercase tracking-wider">REVIEW LOCKED</label>
              <input
                type="checkbox"
                className="h-4 w-4"
                disabled={!isEditing}
                checked={reviewLocked}
                onChange={(e) => setReviewLocked(e.target.checked)}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="text-xs text-slate-500 font-medium uppercase tracking-wider">SAMPLE CLOSED</label>
              <input type="checkbox" className="h-4 w-4" disabled={!isEditing} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="text-xs text-slate-500 font-medium uppercase tracking-wider">RECONSIDERED</label>
              <div className="flex items-center gap-2">
                {!!ec?.reconsidered && (
                  <button
                    type="button"
                    title="Edit reconsideration"
                    onClick={() => setReconsiderationOpen(true)}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true">
                      <path d="M17.414 2.586a2 2 0 0 0-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 0 0 0-2.828zM6 11v3H3v-3h3zm-3 5h14v2H3v-2z"/>
                    </svg>
                  </button>
                )}
                <input type="checkbox" className="h-4 w-4" disabled checked={!!ec?.reconsidered} />
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="text-xs text-slate-500 font-medium uppercase tracking-wider">APPEALED</label>
              <div className="flex items-center gap-2">
                {apMainChecked && (
                  <button
                    type="button"
                    title="Edit appeal"
                    aria-label="Edit appealed"
                    onClick={() => setAppealOpen(true)}
                    className="text-sky-600 hover:text-sky-700 cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true">
                      <path d="M17.414 2.586a2 2 0 0 0-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 0 0 0-2.828zM6 11v3H3v-3h3zm-3 5h14v2H3v-2z"/>
                    </svg>
                  </button>
                )}
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  disabled={!isEditing}
                  checked={apMainChecked}
                  onChange={(e) => setApMainChecked(e.target.checked)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="text-xs text-slate-500 font-medium uppercase tracking-wider">CANCEL REVIEW</label>
              <input type="checkbox" className="h-4 w-4" disabled={!isEditing} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">CANCELLATION RATIONALE</label>
              {isEditing ? (
                <select className="w-full h-9 border border-slate-300 rounded px-2 text-sm bg-white" defaultValue="">
                  <option value="" disabled>
                    Select a rationale
                  </option>
                  <option>Duplicate</option>
                  <option>Out of Scope</option>
                  <option>Other</option>
                </select>
              ) : (
                <select className="w-full h-9 border border-slate-200 rounded px-2 text-sm bg-slate-100 text-slate-500 cursor-not-allowed" defaultValue="" disabled>
                  <option value="" disabled>
                    Select a rationale
                  </option>
                  <option>Duplicate</option>
                  <option>Out of Scope</option>
                  <option>Other</option>
                </select>
              )}
            </div>
            <EditModeProvider isEditing={false}>
              <Field label="RECONSIDERATION DECISION" value={decisionLabel(ec?.reconsiderationDecision)} />
            </EditModeProvider>
            <EditModeProvider isEditing={false}>
              <Field label="APPEALED DECISION" value={decisionLabel(ec?.appealDecision)} />
            </EditModeProvider>
          </div>
        </SectionCard>
      </div>

      {unlockOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setUnlockOpen(false)}
          />
          <div className="relative z-10 w-[560px] max-w-[95vw] rounded-lg border border-slate-300 bg-white shadow-2xl">
            {/* App bar */}
            <div className="flex items-center justify-between bg-slate-700 text-white px-4 py-2 rounded-t-lg">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[color:var(--brand-primary)]" />
                <span className="text-sm font-semibold">CAS RiskReview</span>
              </div>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setUnlockOpen(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ')
                    setUnlockOpen(false)
                }}
                className="text-white/80 hover:text-white text-xl leading-none cursor-pointer select-none"
                aria-label="Close"
              >
                ×
              </div>
            </div>

            {/* Modal title bar */}
            <div className="px-4 py-2 border-b border-slate-200 bg-[color:var(--brand-primary)] text-white">
              <span className="text-sm font-semibold">Unlock Review</span>
            </div>

            {/* Modal body */}
            <div className="p-4 space-y-3">
              <div
                role="radio"
                aria-checked={unlockReason === "GENERAL"}
                tabIndex={0}
                onClick={() => setUnlockReason("GENERAL")}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ')
                    setUnlockReason("GENERAL")
                }}
                className="flex items-center gap-2 cursor-pointer select-none p-2 rounded hover:bg-slate-50"
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${unlockReason === "GENERAL" ? "border-sky-500 bg-sky-500" : "border-slate-400"}`}>
                  {unlockReason === "GENERAL" && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <span className="text-sm">
                  Unlock review for general revisions
                </span>
              </div>

              <div
                role="radio"
                aria-checked={unlockReason === "RECONSIDERATION"}
                tabIndex={0}
                onClick={() => {
                  setUnlockReason("RECONSIDERATION");
                  setUnlockOpen(false);
                  setReconsiderationOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setUnlockReason("RECONSIDERATION");
                    setUnlockOpen(false);
                    setReconsiderationOpen(true);
                  }
                }}
                className="flex items-center gap-2 cursor-pointer select-none p-2 rounded hover:bg-slate-50"
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${unlockReason === "RECONSIDERATION" ? "border-sky-500 bg-sky-500" : "border-slate-400"}`}>
                  {unlockReason === "RECONSIDERATION" && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <span className="text-sm">
                  Unlock review for reconsideration of PD/LGD grade or CRM rating
                </span>
              </div>

              <div
                role="radio"
                aria-checked={unlockReason === "APPEAL"}
                tabIndex={0}
                onClick={() => {
                  setUnlockReason("APPEAL");
                  setUnlockOpen(false);
                  setAppealOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setUnlockReason("APPEAL");
                    setUnlockOpen(false);
                    setAppealOpen(true);
                  }
                }}
                className="flex items-center gap-2 cursor-pointer select-none p-2 rounded hover:bg-slate-50"
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${unlockReason === "APPEAL" ? "border-sky-500 bg-sky-500" : "border-slate-400"}`}>
                  {unlockReason === "APPEAL" && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <span className="text-sm">
                  Unlock review for formal appeal of PD/LGD grade or CRM ratings
                </span>
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-4 py-3 border-t border-slate-200 flex justify-end gap-2">
              <div
                role="button"
                tabIndex={0}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer select-none"
                onClick={() => setUnlockOpen(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ')
                    setUnlockOpen(false)
                }}
              >
                Close
              </div>
              <div
                role="button"
                tabIndex={0}
                className="rounded-md bg-sky-600 hover:bg-sky-700 text-white px-4 py-1.5 text-sm font-semibold cursor-pointer select-none"
                onClick={() => {
                  setUnlockOpen(false);
                  if (unlockReason === "RECONSIDERATION") {
                    setReconsiderationOpen(true);
                  } else if (unlockReason === "APPEAL") {
                    setAppealOpen(true);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setUnlockOpen(false);
                    if (unlockReason === "RECONSIDERATION") {
                      setReconsiderationOpen(true);
                    } else if (unlockReason === "APPEAL") {
                      setAppealOpen(true);
                    }
                  }
                }}
              >
                Confirm
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {reconsiderationOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setReconsiderationOpen(false)}
          />
          <div className="relative z-10 w-[720px] max-w-[95vw] max-h-[85vh] rounded-lg border border-slate-300 bg-white shadow-2xl flex flex-col">
            {/* App bar */}
            <div className="flex items-center justify-between bg-slate-700 text-white px-4 py-2 rounded-t-lg">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[color:var(--brand-primary)]" />
                <span className="text-sm font-semibold">CAS RiskReview</span>
              </div>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setReconsiderationOpen(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ')
                    setReconsiderationOpen(false)
                }}
                className="text-white/80 hover:text-white text-xl leading-none cursor-pointer select-none"
                aria-label="Close"
              >
                ×
              </div>
            </div>

            {/* Title bar */}
            <div className="px-4 py-2 border-b border-slate-200 bg-[color:var(--brand-primary)] text-white">
              <span className="text-sm font-semibold">Effective Challenge</span>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <h2 className="text-lg font-semibold text-[color:var(--brand-primary)]">Reconsideration</h2>
              <div className="text-xs text-slate-600 leading-relaxed">
                <div className="font-semibold mb-1">INSTRUCTIONS</div>
                <p>
                  Log required information where CAS has reconsidered its initial PD/LGD grade or Unsatisfactory CRM
                  ratings following issuance of the initial draft review. CAS logs this information to track material
                  changes to either the assigned PD/LGD grade or Unsatisfactory CRM ratings.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <label className="text-xs text-slate-600">RECONSIDERATION</label>
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={rcReconsidered}
                    onChange={(e) => setRcReconsidered(e.target.checked)}
                    disabled={!isEditing || submitting}
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-600 mb-1">REQUEST DATE</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={rcDate}
                      onChange={(e) => setRcDate(e.target.value)}
                      className="w-full h-9 border border-slate-300 rounded px-2 text-sm bg-white"
                    />
                  ) : (
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded px-2 py-1 text-sm bg-white"
                      value={toDisplayFromInputDate(rcDateDisplay)}
                      readOnly
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs text-slate-600 mb-1">DESCRIPTION</label>
                  <textarea
                    className="w-full border border-slate-300 rounded px-2 py-2 text-sm bg-white min-h-28"
                    placeholder=""
                    value={rcDesc}
                    onChange={(e) => setRcDesc(e.target.value)}
                    disabled={!isEditing || submitting}
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-600 mb-1">DECISION</label>
                  <select
                    className="w-full border border-slate-300 rounded px-2 py-1 text-sm bg-white"
                    value={rcDecision}
                    onChange={(e) => setRcDecision(e.target.value)}
                    disabled={!isEditing || submitting}
                  >
                    <option value="" disabled>Select a decision</option>
                    <option value="APPROVED">Approved</option>
                    <option value="DECLINED">Declined</option>
                    <option value="NO_CHANGE">No Change</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-600 mb-1">DECISION RATIONALE</label>
                  <textarea
                    className="w-full border border-slate-300 rounded px-2 py-2 text-sm bg-white min-h-28"
                    placeholder=""
                    value={rcRationale}
                    onChange={(e) => setRcRationale(e.target.value)}
                    disabled={!isEditing || submitting}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-slate-200 flex justify-end">
              <div
                role="button"
                tabIndex={0}
                className="rounded-md bg-sky-600 hover:bg-sky-700 text-white px-4 py-1.5 text-sm font-semibold cursor-pointer select-none"
                onClick={async () => {
                  if (!isEditing) return;
                  try {
                    setSubmitting(true);
                    await saveReview({
                      ecif: (response?.ecif && String(response.ecif).trim() !== "" ? String(response.ecif).trim() : ecifFromRoute),
                      reviewId: response?.reviewId ?? null,
                      reviewInfo: {
                        change: "Upsert",
                        data: {
                          reconsideration: rcReconsidered,
                          reconsiderationDate: rcDateDisplay,
                          reconsiderationDescription: rcDesc,
                          reconsiderationDecision: rcDecision,
                          reconsiderationRationale: rcRationale
                        }
                      }
                    });
                    setReconsiderationOpen(false);
                    reloadPageData();
                  } finally {
                    setSubmitting(false);
                  }
                }}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    if (!isEditing) return;
                    try {
                      setSubmitting(true);
                      await saveReview({
                        ecif: (response?.ecif && String(response.ecif).trim() !== "" ? String(response.ecif).trim() : ecifFromRoute),
                        reviewId: response?.reviewId ?? null,
                        reviewInfo: {
                          change: "Upsert",
                          data: {
                          reconsideration: rcReconsidered,
                            reconsiderationDate: rcDateDisplay,
                            reconsiderationDescription: rcDesc,
                            reconsiderationDecision: rcDecision,
                            reconsiderationRationale: rcRationale
                          }
                        }
                      });
                      setReconsiderationOpen(false);
                      reloadPageData();
                    } finally {
                      setSubmitting(false);
                    }
                  }
                }}
              >
                Submit
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {appealOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setAppealOpen(false)}
          />
          <div className="relative z-10 w-[720px] max-w-[95vw] max-h-[85vh] rounded-lg border border-slate-300 bg-white shadow-2xl flex flex-col">
            {/* App bar */}
            <div className="flex items-center justify-between bg-slate-700 text-white px-4 py-2 rounded-t-lg">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[color:var(--brand-primary)]" />
                <span className="text-sm font-semibold">CAS RiskReview</span>
              </div>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setAppealOpen(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ')
                    setAppealOpen(false)
                }}
                className="text-white/80 hover:text-white text-xl leading-none cursor-pointer select-none"
                aria-label="Close"
              >
                ×
              </div>
            </div>

            {/* Title bar */}
            <div className="px-4 py-2 border-b border-slate-200 bg-[color:var(--brand-primary)] text-white">
              <span className="text-sm font-semibold">Effective Challenge</span>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <h2 className="text-lg font-semibold text-[color:var(--brand-primary)]">Appeal</h2>
              <div className="text-xs text-slate-600 leading-relaxed">
                <div className="font-semibold mb-1">INSTRUCTIONS</div>
                <p>
                  Log required information where CAS has received a formal appeal of the assigned PD/LGD grade or
                  Unsatisfactory CRM ratings following issuance of the final review. CAS logs this information to
                  track material changes to either the assigned PD/LGD grade or Unsatisfactory CRM ratings.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <label className="text-xs text-slate-600">APPEAL</label>
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={apAppealed}
                    onChange={(e) => setApAppealed(e.target.checked)}
                    disabled={!isEditing || submitting}
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-600 mb-1">REQUEST DATE</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={apDate}
                      onChange={(e) => setApDate(e.target.value)}
                      className="w-full h-9 border border-slate-300 rounded px-2 text-sm bg-white"
                    />
                  ) : (
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded px-2 py-1 text-sm bg-white"
                      value={toDisplayFromInputDate(apDateDisplay)}
                      readOnly
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs text-slate-600 mb-1">DESCRIPTION</label>
                  <textarea
                    className="w-full border border-slate-300 rounded px-2 py-2 text-sm bg-white min-h-28"
                    placeholder=""
                    value={apDesc}
                    onChange={(e) => setApDesc(e.target.value)}
                    disabled={!isEditing || submitting}
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-600 mb-1">DECISION</label>
                  <select
                    className="w-full border border-slate-300 rounded px-2 py-1 text-sm bg-white"
                    value={apDecision}
                    onChange={(e) => setApDecision(e.target.value)}
                    disabled={!isEditing || submitting}
                  >
                    <option value="" disabled>Select a decision</option>
                    <option value="APPROVED">Approved</option>
                    <option value="DECLINED">Declined</option>
                    <option value="NO_CHANGE">No Change</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-600 mb-1">DECISION RATIONALE</label>
                  <textarea
                    className="w-full border border-slate-300 rounded px-2 py-2 text-sm bg-white min-h-28"
                    placeholder=""
                    value={apRationale}
                    onChange={(e) => setApRationale(e.target.value)}
                    disabled={!isEditing || submitting}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-slate-200 flex justify-end">
              <div
                role="button"
                tabIndex={0}
                className="rounded-md bg-sky-600 hover:bg-sky-700 text-white px-4 py-1.5 text-sm font-semibold cursor-pointer select-none"
                onClick={async () => {
                  if (!isEditing) return;
                  try {
                    setSubmitting(true);
                    await saveReview({
                      ecif: (response?.ecif && String(response.ecif).trim() !== "" ? String(response.ecif).trim() : ecifFromRoute),
                      reviewId: response?.reviewId ?? null,
                      reviewInfo: {
                        change: "Upsert",
                        data: {
                          appeal: apAppealed,
                          appealDate: apDateDisplay,
                          appealDescription: apDesc,
                          appealDecision: apDecision,
                          appealDecisionRationale: apRationale
                        }
                      }
                    });
                    setAppealOpen(false);
                    reloadPageData();
                  } finally {
                    setSubmitting(false);
                  }
                }}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    if (!isEditing) return;
                    try {
                      setSubmitting(true);
                      await saveReview({
                        ecif: (response?.ecif && String(response.ecif).trim() !== "" ? String(response.ecif).trim() : ecifFromRoute),
                        reviewId: response?.reviewId ?? null,
                        reviewInfo: {
                          change: "Upsert",
                          data: {
                          appeal: apAppealed,
                            appealDate: apDateDisplay,
                            appealDescription: apDesc,
                            appealDecision: apDecision,
                            appealDecisionRationale: apRationale
                          }
                        }
                      });
                      setAppealOpen(false);
                      reloadPageData();
                    } finally {
                      setSubmitting(false);
                    }
                  }
                }}
              >
                Submit
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </>
  );
}
