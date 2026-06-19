"use client";

import { useMemo } from "react";
import { useReviewData } from "@/app/review/[ecif]/review-info/ReviewDataContext";
import type { ReviewQueueResponse, LookupItem } from "@/services/api/reviews";

export type ReviewInfoData = {
  details: {
    sampleId: string;
    sampleTarget: string;
    sampleDate: string; // display date if available
    reviewId: string;
    sampleType: string;
    reviewType: string;
  };
  assignments: {
    reviewerName: string;
    reviewerEmail: string;
    managerName: string;
    managerEmail: string;
    examinerInCharge: string;
  };
  status: {
    croStart: string;
    croComplete: string;
    distributed: string;
    finalized: string;
    approverName: string;
    mgrApproval: string;
    initialApproval: string;
  };
  effectiveChallenge: {
    reconsidered: boolean;
    reconsiderationDate: string; // yyyy-MM-dd for date input
    reconsiderationDescription: string;
    reconsiderationDecision: string;
    reconsiderationRationale: string;

    // Appeal (Effective Challenge - Appeal)
    appealed: boolean;
    appealDate: string; // yyyy-MM-dd for date input
    appealDescription: string;
    appealDecision: string;
    appealDecisionRationale: string;
  };
};

function fmtDate(input?: string | null): string {
  if (!input) return "";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US");
}

// Format to yyyy-MM-dd for HTML date inputs
function toDateInput(input?: string | null): string {
  if (!input) return "";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function nz(v: string | null | undefined): string {
  return (v ?? "").trim();
}

function cleanEmail(input?: string | null): string {
  if (!input) return "";
  let s = input.trim();

  // MS Access hyperlink pattern: display#address#subaddress (emails often contain 'mailto:address')
  if (s.includes("#")) {
    const parts = s.split("#").map(p => p.trim()).filter(Boolean);
    for (const part of parts) {
      let candidate = part;
      if (candidate.toLowerCase().startsWith("mailto:")) {
        candidate = candidate.slice("mailto:".length);
      }
      if (candidate.includes("@") && !candidate.includes(" ")) {
        return candidate;
      }
    }
    // Fallback to first segment
    s = parts[0];
  }

  if (s.toLowerCase().startsWith("mailto:")) {
    s = s.slice("mailto:".length);
  }

  return s;
}

function resolveLookupName(list: LookupItem[] | undefined, id?: string | null): string {
  if (!list || !id) return "";
  const hit = list.find(x => String(x.id).trim() === String(id).trim());
  return hit?.name ?? "";
}

function mapReviewToReviewInfo(res: ReviewQueueResponse | null | undefined): ReviewInfoData | null {
  if (!res) return null;

  const review = (res.form?.reviewInfo ?? {}) as any;
  const ci = (res.form?.customerInfo ?? {}) as any;
  const txApproval = (res.form?.transactions?.approval ?? {}) as any;

  // Resolve optional lookups for review type and target if ids are present
  const reviewTypeName =
    nz(review.reviewType as string | null | undefined) ||
    resolveLookupName(res.lookups?.reviewTypes, review.reviewTypeId as string | null | undefined);
  const targetName =
    nz(review.sampleTarget as string | null | undefined) ||
    resolveLookupName(res.lookups?.targets, review.targetId as string | null | undefined);

  // People (assignments): Prefer CRO fields from ReviewInfo (mapped from 02_CORE_02_Reviews),
  // then fall back to CustomerInfo and legacy aliases.
  const reviewerName =
    (review.reviewerName as string | null | undefined) ??
    (ci.reviewerName as string | null | undefined) ??
    (ci.relationshipManager as string | null | undefined) ??
    (ci.primaryRelationshipManager as string | null | undefined) ??
    "";

  const reviewerEmailRaw =
    (review.reviewerEmail as string | null | undefined) ??
    (ci.reviewerEmail as string | null | undefined) ??
    "";
  const reviewerEmail = cleanEmail(reviewerEmailRaw);
  const managerName =
    (review.managerName as string | null | undefined) ??
    (ci.managerName as string | null | undefined) ??
    (ci.portfolioManager as string | null | undefined) ??
    "";
  const managerEmailRaw =
    (review.managerEmail as string | null | undefined) ??
    (ci.managerEmail as string | null | undefined) ??
    "";
  const managerEmail = cleanEmail(managerEmailRaw);
  const examinerInCharge =
    // Prefer CRO/Reviewer; fall back to EIC if CRO not available
    (reviewerName as string | null | undefined) ??
    (ci.executiveCreditOfficer as string | null | undefined) ??
    "";

  // Dates
  const croStart = fmtDate(review.startDate as string | null | undefined);
  const croComplete = fmtDate(review.endDate as string | null | undefined);
  const distributed = fmtDate(review.distributedDate as string | null | undefined);
  const finalized = fmtDate(review.finalizedDate as string | null | undefined);
  const sampleIdStr = review.sampleId != null ? String(review.sampleId) : "";
  const sampleDateDisplay = fmtDate(review.sampleDate as string | null | undefined);

  return {
    details: {
      // Prefer server-provided names; fall back to lookups where necessary
      sampleId: sampleIdStr,
      sampleTarget: targetName,
      sampleDate: sampleDateDisplay,
      reviewId: res.reviewId != null ? String(res.reviewId) : "",
      sampleType: nz(review.sampleType as string | null | undefined),
      reviewType: reviewTypeName
    },
    assignments: {
      reviewerName: nz(reviewerName),
      reviewerEmail: nz(reviewerEmail),
      managerName: nz(managerName),
      managerEmail: nz(managerEmail),
      examinerInCharge: nz(examinerInCharge)
    },
    status: {
      croStart,
      croComplete,
      distributed,
      finalized,
      approverName: nz(txApproval.approver as string | null | undefined) || nz(reviewerName),
      mgrApproval: fmtDate(review.approvalDate as string | null | undefined),
      initialApproval: "" // not provided by current payload
    },
    effectiveChallenge: {
      reconsidered: (() => {
        const val = review.reconsideration as boolean | string | number | null | undefined;
        if (typeof val === "boolean") return val;
        if (typeof val === "number") return val === 1;
        const raw = val?.toString().trim().toLowerCase() ?? "";
        return raw === "yes" || raw === "y" || raw === "true" || raw === "1";
      })(),
      reconsiderationDate: toDateInput(review.reconsiderationDate as string | null | undefined),
      reconsiderationDescription: nz(review.reconsiderationDescription as string | null | undefined),
      reconsiderationDecision: nz(review.reconsiderationDecision as string | null | undefined),
      reconsiderationRationale: nz(review.reconsiderationRationale as string | null | undefined),

      // Appeal (Effective Challenge - Appeal)
      appealed: (() => {
        const val = review.appeal as boolean | string | number | null | undefined;
        if (typeof val === "boolean") return val;
        if (typeof val === "number") return val === 1;
        const raw = val?.toString().trim().toLowerCase() ?? "";
        return raw === "yes" || raw === "y" || raw === "true" || raw === "1";
      })(),
      appealDate: toDateInput(review.appealDate as string | null | undefined),
      appealDescription: nz(review.appealDescription as string | null | undefined),
      appealDecision: nz(review.appealDecision as string | null | undefined),
      appealDecisionRationale: nz(review.appealDecisionRationale as string | null | undefined)
    }
  };
}

/**
 * useReviewInfo
 * - Consumes ReviewDataContext (no network here)
 * - Maps ReviewQueueResponse to the Review Info UI shape
 */
export function useReviewInfo() {
  const { response, isLoading, error } = useReviewData();

  const data = useMemo(() => mapReviewToReviewInfo(response), [response]);

  return { data, isLoading, error };
}

export default useReviewInfo;
