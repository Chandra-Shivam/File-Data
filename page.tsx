"use client";

import TopChromeBar from "./components/TopChromeBar";
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { useState } from "react";
import { ReviewDataProvider, useReviewData } from "./ReviewDataContext";
import { Modal } from "@/components/ui/Dialog";
import { useToast } from "@/components/providers/ToastProvider";
import { saveReview, type ReviewFormSaveRequest } from "@/services/api/reviews";
import { FormChangesProvider, useFormChanges } from "./FormChangesContext";
import { EditModeProvider } from "./components/ui";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { sendEmail } from "@/services/api/admin";
import {
  ReviewInfoSection,
  CustomerInfoSection,
  TransactionsSection,
  CovenantsSection,
  PolicyExceptionsSection,
  RegulatoryTrackingSection,
  CollateralSection,
  RepaymentSection,
  ScorecardSection,
  CrmFindingsAndRatingsSection,
  CrmRatingsSection,
  RiskRatingJustificationSection,
  KeyRisksSection,
  ChecklistSection,
} from "./components/sections";

type SectionKey =
  | "review-info"
  | "customer-info"
  | "transactions"
  | "covenants"
  | "policy-exceptions"
  | "regulatory-tracking"
  | "collateral"
  | "repayment"
  | "scorecard"
  | "key-risks"
  | "crm-findings-and-ratings"
  | "crm-ratings"
  | "risk-rating-justification"
  | "checklist";

const sectionDefs: { key: SectionKey; label: string }[] = [
  { key: "review-info", label: "Review Info" },
  { key: "customer-info", label: "Customer Info" },
  { key: "transactions", label: "Transactions" },
  { key: "covenants", label: "Covenants" },
  { key: "policy-exceptions", label: "Policy Exceptions" },
  { key: "regulatory-tracking", label: "Regulatory Tracking" },
  { key: "collateral", label: "Collateral" },
  { key: "repayment", label: "Repayment" },
  { key: "key-risks", label: "Key Risks" },
  { key: "scorecard", label: "Scorecard" },
  { key: "crm-findings-and-ratings", label: "CRM Findings" },
  { key: "crm-ratings", label: "CRM Ratings" },
  { key: "risk-rating-justification", label: "Risk Rating Justification" },
  { key: "checklist", label: "Checklist" },
];

const componentMap: Record<SectionKey, ComponentType> = {
  "review-info": ReviewInfoSection,
  "customer-info": CustomerInfoSection,
  transactions: TransactionsSection,
  covenants: CovenantsSection,
  "policy-exceptions": PolicyExceptionsSection,
  "regulatory-tracking": RegulatoryTrackingSection,
  collateral: CollateralSection,
  repayment: RepaymentSection,
  scorecard: ScorecardSection,
  "key-risks": KeyRisksSection,
  "crm-findings-and-ratings": CrmFindingsAndRatingsSection,
  "crm-ratings": CrmRatingsSection,
  "risk-rating-justification": RiskRatingJustificationSection,
  checklist: ChecklistSection,
};

function LoadingOverlay() {
  const { isLoading } = useReviewData();
  return (
    <Modal open={isLoading} onClose={() => {}} showCloseButton={false} size="sm" title="Loading">
      <div className="text-sm text-slate-800">Loading Review Details...</div>
    </Modal>
  );
}

// Share Email Modal
function ShareEmailDialog({
  open,
  onClose,
  ecif
}: {
  open: boolean;
  onClose: () => void;
  ecif: string;
}) {
  const toast = useToast();
  const [to, setTo] = useState<string>("");
  const [subject, setSubject] = useState<string>(`Review eCIF ${ecif}`);
  const [bodyHtml, setBodyHtml] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState<boolean>(false);
  const [touched, setTouched] = useState<boolean>(false);
  const [canAutoAttach, setCanAutoAttach] = useState<boolean>(false);

  const emailIsValid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  const subjectValid = subject.trim().length > 0;
  const bodyValid = bodyHtml.replace(/<[^>]*>/g, "").trim().length > 0;

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) {
      setFile(null);
      setCanAutoAttach(false);
      return;
    }
    // Validate PDF under 5 MB
    const isPdf = f.type?.toLowerCase().includes("pdf") || f.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      toast.showError("Only PDF files are allowed.", { title: "Invalid file type" });
      e.currentTarget.value = "";
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.showError("File must be less than 5 MB.", { title: "File too large" });
      e.currentTarget.value = "";
      return;
    }
    setFile(f);
    // Detect if this device/browser can auto-attach via Web Share API
    try {
      const n = navigator as any;
      const supported = ("share" in navigator) && n?.canShare?.({ files: [f] }) === true;
      setCanAutoAttach(!!supported);
    } catch {
      setCanAutoAttach(false);
    }
  };

  const doSend = async () => {
    setTouched(true);
    if (!emailIsValid(to) || !subjectValid || !bodyValid) return;

    const toAddr = to.trim();
    const subj = subject.trim();
    const bodyTxt = htmlToPlain(bodyHtml) + (file ? `\n\n[Attached from CASRR]: ${file.name}` : "");

    // If device supports Web Share with files, attach file automatically
    if (file && canAutoAttach) {
      try {
        const n = navigator as any;
        await n.share({ title: subj || "Email", text: bodyTxt, files: [file] });
        toast.showSuccess("Compose opened with attachment.", { title: "Compose" });
        onClose();
        return;
      } catch {
        // fall through to mailto
      }
    }

    // Fallback: default email client via mailto (pre-fills To/Subject/Body; user must attach file)
    const mailto = buildMailtoUrl(toAddr, subj, bodyTxt + (file ? `\n\n[Please attach file: ${file.name}]` : ""));
    window.location.href = mailto;

    toast.showInfo(file ? "Compose opened. Attach the file manually if it is not already attached." : "Opened your email client.", { title: "Compose" });
    onClose();
  };

  // Server-side send via backend (ACS provider attaches file automatically)
  const doSendServer = async () => {
    setTouched(true);
    if (!emailIsValid(to) || !subjectValid || !bodyValid) return;

    setSending(true);
    try {
      const resp = await sendEmail({ to: to.trim(), subject: subject.trim(), bodyHtml, attachment: file });
      if (resp?.success) {
        toast.showSuccess(resp.message ?? "Email sent.", { title: "Success" });
        onClose();
        setTimeout(() => {
          setTo("");
          setSubject(`Review eCIF ${ecif}`);
          setBodyHtml("");
          setFile(null);
          setCanAutoAttach(false);
          setTouched(false);
          setSending(false);
        }, 0);
      } else {
        const msg = resp?.message ?? "Failed to send email.";
        toast.showError(msg, { title: "Send Failed" });
      }
    } catch (e: any) {
      const body = e?.body as any | undefined;
      const detail =
        body?.detail || body?.title || body?.message || body?.Message || e?.message || "Failed to send email.";
      const codeSuffix = e?.code ? ` (${e.code})` : (typeof e?.status === "number" ? ` (HTTP ${e.status})` : "");
      toast.showError(detail + codeSuffix, { title: "Send Failed" });
    } finally {
      setSending(false);
    }
  };

  // Helpers for client-side manual email options (mailto / Outlook Web / Web Share)
  function htmlToPlain(html: string): string {
    const div = document.createElement("div");
    div.innerHTML = html || "";
    const text = (div.textContent || div.innerText || "").replace(/\u00A0/g, " ");
    return text.trim();
  }

  function buildMailtoUrl(toAddr: string, subj: string, bodyText: string): string {
    const params = new URLSearchParams();
    if (subj) params.set("subject", subj);
    if (bodyText) params.set("body", bodyText);
    return `mailto:${encodeURIComponent(toAddr)}?${params.toString()}`;
  }

  function buildOwaComposeUrl(toAddr: string, subj: string, bodyText: string): string {
    // Use the OWA action path which reliably honors to/subject/body.
    // Multiple recipients can be comma- or semicolon-separated in 'to'.
    const base = "https://outlook.office.com/owa/";
    const params = new URLSearchParams();
    params.set("path", "/mail/action/compose");
    if (toAddr) params.set("to", toAddr);
    if (subj) params.set("subject", subj);
    if (bodyText) params.set("body", bodyText);
    return `${base}?${params.toString()}`;
  }

  async function openWithWebShareIfPossible(toAddr: string, subj: string, bodyText: string, f: File | null): Promise<boolean> {
    try {
      const n = navigator as any;
      if (!("share" in navigator)) return false;

      const data: any = { title: subj || "Email", text: `To: ${toAddr}\n\n${bodyText}` };
      if (f && n.canShare?.({ files: [f] }) === true) {
        data.files = [f];
      }
      await n.share(data);
      return true;
    } catch {
      return false;
    }
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Share via Email"
        size="lg"
        actions={
        <>
          <Button variant="neutral" size="xs" onClick={onClose} disabled={sending}>Cancel</Button>

          {/* Open default email client (mailto), try Web Share first (may attach file on supported devices) */}
          <Button
            variant="outline"
            size="xs"
            title="Open your email client with fields pre-filled"
            disabled={!emailIsValid(to) || !subjectValid || !bodyValid || sending}
            onClick={async () => {
              const toAddr = to.trim();
              const subj = subject.trim();
              const bodyTxt = htmlToPlain(bodyHtml) + (file ? `\n\n[Please attach file: ${file.name}]` : "");
              const shared = await openWithWebShareIfPossible(toAddr, subj, bodyTxt, file);
              if (!shared) {
                const url = buildMailtoUrl(toAddr, subj, bodyTxt);
                window.location.href = url;
              }
            }}
          >
            Open Email Client
          </Button>

          {/* Open Outlook Web compose */}
          <Button
            variant="outline"
            size="xs"
            title="Open Outlook on the web compose with fields pre-filled"
            disabled={!emailIsValid(to) || !subjectValid || !bodyValid || sending}
            onClick={() => {
              const toAddr = to.trim();
              const subj = subject.trim();
              const bodyTxt = htmlToPlain(bodyHtml) + (file ? `\n\n[Please attach file: ${file.name}]` : "");
              const owa = buildOwaComposeUrl(toAddr, subj, bodyTxt);
              window.open(owa, "_blank", "noopener,noreferrer");
            }}
          >
            Open in Outlook Web
          </Button>

          {/* Send via API (AdminController -> ACS) */}
          <Button
            size="xs"
            onClick={doSendServer}
            disabled={sending || !emailIsValid(to) || !subjectValid || !bodyValid}
            title="Call Admin API to send using Azure Communication Services"
          >
            {sending ? "Sending..." : "Send via API"}
          </Button>

          {/* Client-side compose */}
          <Button size="xs" onClick={doSend} disabled={sending || !emailIsValid(to) || !subjectValid || !bodyValid}>
            {sending ? "Opening..." : "Compose Email"}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-slate-600 mb-1">To Address</label>
          <Input
            size="sm"
            placeholder="name@company.com"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className={"w-full " + (touched && !emailIsValid(to) ? "border-red-500" : "")}
          />
          {touched && !emailIsValid(to) ? (
            <div className="text-[11px] text-red-600 mt-1">Enter a valid email address.</div>
          ) : null}
        </div>

        <div>
          <label className="block text-xs text-slate-600 mb-1">Subject</label>
          <Input
            size="sm"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={"w-full " + (touched && !subjectValid ? "border-red-500" : "")}
          />
        </div>

        <div>
          <label className="block text-xs text-slate-600 mb-1">Body</label>
          <RichTextEditor
            value={bodyHtml}
            onChange={setBodyHtml}
            placeholder="Type your message..."
            minHeight={160}
          />
          {touched && !bodyValid ? (
            <div className="text-[11px] text-red-600 mt-1">Body cannot be empty.</div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <input type="file" accept=".pdf,application/pdf" onChange={onFileChange} />
          {file ? <span className="text-xs text-slate-700">{file.name}</span> : <span className="text-xs text-slate-500">PDF, under 5 MB</span>}
        </div>
        {file ? (
          <div className="mt-1 text-[11px]">
            {canAutoAttach ? (
              <span className="text-emerald-700">This device supports automatic attachment. It will be included when composing.</span>
            ) : (
              <span className="text-amber-700">This device cannot auto-attach from the browser. After compose opens, attach the file manually if needed.</span>
            )}
          </div>
        ) : null}
      </div>
    </Modal>
      <Modal open={sending} onClose={() => {}} showCloseButton={false} size="sm" title="Sending Email">
        <div className="text-sm text-slate-800">Sending Email...</div>
      </Modal>
    </>);
}

function ReviewInfoContent({ ecif }: { ecif: string }) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const { changes, clear } = useFormChanges();
  const { response } = useReviewData();

  const [isEditing, setIsEditing] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    setIsEditing(false);
    setFormKey((k) => k + 1);
    clear();
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: ReviewFormSaveRequest = {
        ecif: String(ecif),
        reviewId: response?.reviewId ?? undefined,
        sampleId: response?.form?.reviewInfo?.sampleId ?? undefined
      };

      // Map single-object section changes to SectionChange wrappers.
      const s = changes as any;
      let count = 0;
      if (s.reviewInfo) { payload.reviewInfo = { change: "Upsert", data: s.reviewInfo }; count++; }
      if (s.customerInfo) { payload.customerInfo = { change: "Upsert", data: s.customerInfo }; count++; }
      if (s.regulatoryTracking) { payload.regulatoryTracking = { change: "Upsert", data: s.regulatoryTracking }; count++; }
      if (s.riskRatingJustification) { payload.riskRatingJustification = { change: "Upsert", data: s.riskRatingJustification }; count++; }
      if (s.repayment) { payload.repayment = { change: "Upsert", data: s.repayment }; count++; }
      if (s.keyRisks) { payload.keyRisks = { change: "Upsert", data: s.keyRisks }; count++; }
      if (s.crmFindingsAndRatings) { payload.crmFindingsAndRatings = { change: "Upsert", data: s.crmFindingsAndRatings }; count++; }
      if (s.scorecard) { payload.scorecard = { change: "Upsert", data: s.scorecard }; count++; }
      if (s.collateralTracking) { payload.collateralTracking = { change: "Upsert", data: s.collateralTracking }; count++; }

      // Collections (transactions/covenants/etc.)
      // Checklist: build TrackedItem[] with RowTracker(Change=Update, Key=id) for edited questions
      if (s.checklist) {
        const items: Array<{ tracker: { change: "Update"; key: string; clientKey?: string | null }, data: any }> = [];
        for (const [id, val] of Object.entries(s.checklist as Record<string, any>)) {
          const data = {
            id: String(id),
            answer: (val as any)?.answer ?? "",
            comments: (val as any)?.comments ?? ""
          };
          items.push({
            tracker: { change: "Update", key: String(id) },
            data
          });
        }
        if (items.length > 0) {
          payload.checklist = items;
          count += items.length;
        }
      }

      // Covenants: row-level updates keyed by covenant id. Also include info (narrative) as a special item.
      if (s.covenants) {
        const covItems: Array<{ tracker: { change: "Update"; key: string; clientKey?: string | null }, data: any }> = [];
        for (const [id, val] of Object.entries(s.covenants as Record<string, any>)) {
          if (id === "info") continue;
          const data = { id: String(id), ...(val as any) };
          covItems.push({ tracker: { change: "Update", key: String(id) }, data });
        }
        // Optional: include covenants info block as a special tracked item
        const covInfo = (s.covenants as any).info;
        if (covInfo) {
          covItems.push({ tracker: { change: "Update", key: "__info" }, data: covInfo });
        }
        if (covItems.length > 0) {
          payload.covenants = covItems;
          count += covItems.length;
        }
      }

      // Policy Exceptions: row-level updates keyed by exception id
      if (s.policyExceptions) {
        const peItems: Array<{ tracker: { change: "Update"; key: string; clientKey?: string | null }, data: any }> = [];
        for (const [id, val] of Object.entries(s.policyExceptions as Record<string, any>)) {
          const data = { id: String(id), ...(val as any) };
          peItems.push({ tracker: { change: "Update", key: String(id) }, data });
        }
        if (peItems.length > 0) {
          payload.policyExceptions = peItems;
          count += peItems.length;
        }
      }

      // Collateral Tracking (single-object info such as rating/narrative)
      if (s.collateral?.info) {
        payload.collateralTracking = { change: "Upsert", data: (s.collateral as any).info };
        count++;
      }

      // CRM Findings & Ratings (single-object section containing ratings and possibly findings)
      if (s.crmFindingsAndRatings) {
        payload.crmFindingsAndRatings = { change: "Upsert", data: s.crmFindingsAndRatings };
        count++;
      }

      // Transactions (approval block) – encode as a special tracked item
      if (s.transactions?.approval) {
        const approval = (s.transactions as any).approval;
        const txItems: Array<{ tracker: { change: "Update"; key: string; clientKey?: string | null }, data: any }> = [
          { tracker: { change: "Update", key: "__approval" }, data: approval }
        ];
        payload.transactions = txItems;
        count += txItems.length;
      }

      if (count === 0) {
        toast.showInfo("No changes to save.", { title: "Nothing to save" });
        setIsSaving(false);
        return;
      }

      const resp = await saveReview(payload);
      const msg = resp?.message ?? "Review saved.";
      toast.showSuccess(msg, { title: "Success" });
      setIsEditing(false);
      setFormKey((k) => k + 1); // remount to reset any local inputs
      clear();
    } catch (e: any) {
      const code = e?.code ? ` (${e.code})` : "";
      const msg = e?.message || "Save failed.";
      toast.showError(`${msg}${code}`, { title: "Save Failed" });
    } finally {
      setIsSaving(false);
    }
  };

  const borrowerName = sp?.get("borrower") ?? "TXO PARTNERS L P";
  const activeKey = (sp?.get("section") as SectionKey) ?? "review-info";
  const ActiveComponent = (componentMap[activeKey] ?? ReviewInfoSection) as ComponentType;
  const activeLabel = sectionDefs.find((s) => s.key === activeKey)?.label ?? "Review Info";

  const setSection = (key: SectionKey) => {
    const next = new URLSearchParams(sp?.toString() ?? "");
    next.set("section", key);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  return (
    <>
      <LoadingOverlay />
      <Modal open={isSaving} onClose={() => {}} showCloseButton={false} size="sm" title="Saving">
        <div className="text-sm text-slate-800">Saving Review...</div>
      </Modal>
      <EditModeProvider isEditing={isEditing}>
        <div key={formKey} className="mx-auto w-full max-w-7xl">
          {/* Top chrome bar */}
          <TopChromeBar
            activeLabel={activeLabel}
            borrowerName={borrowerName}
            ecif={ecif}
            isEditing={isEditing}
            onEdit={handleEdit}
            onSave={handleSave}
            onCancel={handleCancel}
            onShare={() => setIsShareOpen(true)}
          />

          {/* Body */}
          <div className="rounded-b-lg border-x border-b border-slate-200 shadow-sm bg-slate-50 p-2 md:p-4">
            <div className="grid grid-cols-12 gap-4">
              {/* Left Nav */}
              <aside className="col-span-12 md:col-span-3 lg:col-span-2">
                <nav className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                  <div className="flex flex-col">
                    {sectionDefs.map((item) => {
                      const active = activeKey === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setSection(item.key)}
                          aria-current={active ? "page" : undefined}
                          className={
                            "text-left px-3 py-2 text-sm border-b border-slate-100 last:border-b-0 " +
                            (active ? "bg-emerald-50 text-emerald-800 font-semibold" : "hover:bg-slate-50")
                          }
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </nav>
              </aside>

              {/* Main Content */}
              <main className="col-span-12 md:col-span-9 lg:col-span-10">
                {isEditing ? (
                  activeKey === "review-info" ? (
                    <ReviewInfoSection unlockOpen={unlockOpen} onUnlockOpenChange={setUnlockOpen} />
                  ) : (
                    <ActiveComponent />
                  )
                ) : (
                  <fieldset disabled className="contents">
                    {activeKey === "review-info" ? (
                      <ReviewInfoSection unlockOpen={unlockOpen} onUnlockOpenChange={setUnlockOpen} />
                    ) : (
                      <ActiveComponent />
                    )}
                  </fieldset>
                )}
              </main>
            </div>
          </div>
        </div>
      </EditModeProvider>

      {/* Share Email Modal */}
      <ShareEmailDialog open={isShareOpen} onClose={() => setIsShareOpen(false)} ecif={ecif} />
    </>
  );
}

export default function ReviewInfoPage() {
  const { ecif } = useParams<{ ecif: string }>();
  return (
    <ReviewDataProvider>
      <FormChangesProvider>
        <ReviewInfoContent ecif={String(ecif)} />
      </FormChangesProvider>
    </ReviewDataProvider>
  );
}
