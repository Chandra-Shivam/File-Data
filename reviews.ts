import { get, post } from "@/lib/api";

export type LookupItem = {
  id: string;
  name: string;
  group?: string | null;
  sortOrder?: number | null;
};

export type ReviewPermissions = {
  canEdit: boolean;
  canApprove: boolean;
  canAssign: boolean;
};

export type ReviewInfoSection = {
  // New fields provided by backend for Review Info
  sampleId?: number | null;
  sampleDate?: string | null;       // ISO date
  sampleType?: string | null;
  sampleTarget?: string | null;

  // Legacy/compat or additional timeline fields
  distributedDate?: string | null;
  finalizedDate?: string | null;
  approvalDate?: string | null;

  // Existing fields (kept for compatibility if backend later provides ids/lookups)
  reviewTypeId?: string | null;
  targetId?: string | null;
  year?: number | null;
  quarterId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  riskRatingId?: string | null;

  // Assignments (CRO fields) duplicated in Review Info for the Review Info page
  reviewerName?: string | null;
  reviewerEmail?: string | null;
  managerName?: string | null;
  managerEmail?: string | null;

  // Effective Challenge - Reconsideration (mapped from dbo.[02_CORE_02_Reviews])
  // Reconsideration is a bit/boolean in the database and should be serialized as boolean in JSON
  reconsideration?: boolean | null;
  reconsiderationDate?: string | null;            // ISO timestamp/date from server
  reconsiderationDescription?: string | null;
  reconsiderationDecision?: string | null;        // e.g., "APPROVED" | "DECLINED" | "NO_CHANGE"
  reconsiderationRationale?: string | null;       // e.g., "NEW_INFO" | "ERROR_CORRECTION" | "OTHER"

  // Effective Challenge - Appeal (mapped from dbo.[02_CORE_02_Reviews])
  // Appeal is a bit/boolean in the database and should be serialized as boolean in JSON
  appeal?: boolean | null;
  appealDate?: string | null;                     // ISO timestamp/date from server
  appealDescription?: string | null;
  appealDecision?: string | null;                 // e.g., "APPROVED" | "DECLINED" | "NO_CHANGE"
  appealDecisionRationale?: string | null;        // free text unless standardized
};

export type CustomerInfoSection = {
  customerName?: string | null;
  customerNumber?: string | null;

  // New or renamed fields to fully populate Customer Info
  portfolio?: string | null;              // FHN Portfolio (Internal_portfolio)
  portfolioSegment?: string | null;       // Portfolio_sub_segment
  naicsIndustry?: string | null;
  naicsDescription?: string | null;
  customerSize?: string | null;

  segment?: string | null;
  unit?: string | null;
  market?: string | null;

  // Allow either legacy or new naming for RM; mapper will normalize
  primaryRelationshipManager?: string | null; // legacy
  relationshipManager?: string | null;        // preferred

  portfolioManager?: string | null;
  executiveCreditOfficer?: string | null;
  seniorCreditOfficer?: string | null;

  // Assignments (CRO fields)
  reviewerName?: string | null;
  reviewerEmail?: string | null;
  managerName?: string | null;
  managerEmail?: string | null;

  backgroundNarrative?: string | null;
};

export type TransactionsRowDto = {
  facilityNumber?: string | null;
  accountNumber?: string | null;
  acctId?: string | null;
  outstandingBalance?: number | null;
  committedExposure?: number | null;
  systemPD?: number | null;
  systemLGD?: number | null;
  intRatePct?: number | null;
  pctFixed?: number | null;
  pastDueStatus?: string | null;
  callCode?: string | null;
  callCodeDesc?: string | null;
  collateralCodeSystem?: string | null;
  effectiveDate?: string | null;
  renewalDate?: string | null;
  maturityDate?: string | null;
  flags?: {
    HLT?: boolean | null;
    HRA?: boolean | null;
    HVCRE?: boolean | null;
    FDICIA?: boolean | null;
    SNC?: boolean | null;
  } | null;
};

export type TransactionsSectionDto = {
  details?: {
    rows?: TransactionsRowDto[] | null;
    totals?: {
      facilities?: number | null;
      outstandingBalance?: number | null;
      committedExposure?: number | null;
    } | null;
  } | null;
  approval?: {
    ttba?: number | null;
    approver?: string | null;
    authorityLevel?: string | null;
    reason?: string | null;
    history?: string | null;
  } | null;
};

export type CovenantSummary = {
  covenantTypeId?: string | null;
  description?: string | null;
  met?: boolean | null;
};

export type CovenantRowDto = {
  id?: string | null;
  category?: string | null;
  covenantType?: string | null;
  frequency?: string | null; // "", "Monthly", "Quarterly", "Semi-Annual", "Annual"
  graceDays?: number | null;
  threshold?: string | null;
  lastEvalDate?: string | null; // UI-ready date
  result?: "Compliant" | "Non-Compliant" | "Pending" | null;
  lastEvalStatus?: "" | "Compliant" | "Non-Compliant" | "Waived" | "N/A" | null;
};

export type CovenantsSection = {
  count: number;
  items: CovenantSummary[];
  // Non-breaking additions for Covenants tab details
  rows?: CovenantRowDto[] | null;
  info?: {
    lastAnnualReview?: string | null;
    nextAnnualReview?: string | null;
    accuratelyDefinedTracked?: "Yes" | "No" | null;
    accuratelyCalculated?: "Yes" | "No" | null;
    narrative?: string | null;
  } | null;
};

export type PolicyExceptionSummary = {
  // Prefer a direct code if server provides it; otherwise map from id via lookups
  exceptionTypeId?: string | null;
  exceptionTypeCode?: string | null;
  // Fields needed by the UI
  identified?: "Yes" | "No" | "N/A" | null;
  mitigation?: "Not Mitigated" | "Mitigated" | "Partially Mitigated" | null;
  notes?: string | null;

  // Backward compatibility fields that may exist on legacy payloads
  description?: string | null;
  severity?: string | null;
};

export type PolicyExceptionsSection = {
  count: number;
  items: PolicyExceptionSummary[];
};

export type RegulatoryFlagSummary = {
  flagTypeId?: string | null;
  value?: "Yes" | "No" | "N/A" | null;
  notes?: string | null;
};

export type RegulatoryFlagsSection = {
  // Option A: object form (preferred)
  flags?: {
    hlt?: "Yes" | "No" | "N/A" | null;
    hra?: "Yes" | "No" | "N/A" | null;
    hvcRe?: "Yes" | "No" | "N/A" | null;
    fdicia?: "Yes" | "No" | "N/A" | null;
    snc?: "Yes" | "No" | "N/A" | null;
    identifiedTracked?: "Yes" | "No" | null;
  } | null;
  info?: string | null;

  // Option B: row model (backward compat)
  count?: number | null;
  items?: RegulatoryFlagSummary[] | null;
};

export type CollateralSummary = {
  collateralTypeId?: string | null;
  value?: number | null;
  description?: string | null;
};

export type CollateralSection = {
  count: number;
  items: CollateralSummary[];
};

// Rich Collateral Tracking DTOs for the Collateral tab
export type CollateralTrackingRowDto = {
  facilityNumber?: string | null;
  accounts?: number | null;
  outstandingBalance?: number | null;
  committedExposure?: number | null;
  systemLGD?: number | null;
  collateralCodeDescription?: string | null;
  collateralState?: string | null;
  tradeArea?: "Yes" | "No" | "N/A" | null;
};

export type CollateralTrackingSectionDto = {
  summary?: {
    rows?: CollateralTrackingRowDto[] | null;
    totals?: {
      accounts?: number | null;
      outstandingBalance?: number | null;
      committedExposure?: number | null;
    } | null;
  } | null;
  info?: {
    rating?: "Strong" | "Adequate" | "Marginal" | "Weak" | null;
    narrative?: string | null;
  } | null;
};

export type RepaymentCovenantRowDto = {
  covenantType?: string | null;
  frequency?: string | null; // "", "Monthly", "Quarterly", "Semi-Annual", "Annual"
  threshold?: string | null;
  lastEvalDate?: string | null; // UI-ready date
  result?: string | null; // e.g., "1.74x" or currency text
  status?: "Compliant" | "Non-Compliant" | "Not Due" | null;
};

export type RepaymentAnalysisDto = {
  primaryRating?: "Strong" | "Adequate" | "Marginal" | "Weak" | null;
  secondaryRating?: "Strong" | "Adequate" | "Marginal" | "Weak" | null;
  psorDiscussion?: string | null; // includes “Cash flow from operations” narrative
  ssorDiscussion?: string | null;
};

export type RepaymentSectionDto = {
  covenantSummary?: RepaymentCovenantRowDto[] | null;
  analysis?: RepaymentAnalysisDto | null;
};

// Legacy/compat exports (not used by new UI but kept to avoid breaking imports)
export type RepaymentSummary = {
  repaymentTypeId?: string | null;
  terms?: string | null;
};

export type RepaymentSection = {
  count: number;
  items: RepaymentSummary[];
};

export type ScorecardSectionDto = {
  crgsScorecardId?: string | null;
  scorecardDate?: string | null; // ISO yyyy-MM-dd preferred
  scorecardType?: string | null; // display label or code
  scorecardTypeId?: string | null; // optional code if using lookup
  bankPD?: number | null;
  bankLGD?: number | null;
  reviewPD?: number | null;
  reviewLGD?: number | null;
  assessment?: string | null;
  comments?: string | null;
};

export type ScorecardSummary = {
  scorecardTypeId?: string | null;
  score?: number | null;
};

export type ScorecardsSection = {
  count: number;
  items: ScorecardSummary[];
};

export type FindingSummary = {
  categoryId?: string | null;
  title?: string | null;
  severity?: string | null;
};

export type FindingsSection = {
  count: number;
  items: FindingSummary[];
};

export type RiskRatingJustificationSection = {
  committedExposureUSD?: number | null;
  collateralRating?: string | null;
  psorRating?: string | null;
  ssorRating?: string | null;
  maxBankPDRating?: number | null;
  maxCasPDRating?: number | null;
  riskRecognitionKeyFindings?: number | null;
  riskRecognitionRating?: string | null;
  justification?: string | null;
  // Back-compat alias used by older payloads
  narrative?: string | null;
};

export type ChecklistAnswerDto = "Yes" | "No" | "N/A";

export type ChecklistQuestionDto = {
  id?: string | null;
  text?: string | null;
  answer?: ChecklistAnswerDto | null;
  comments?: string | null;
};

export type ChecklistSectionDto = {
  guidance?: string | null;
  questions?: ChecklistQuestionDto[] | null;
};

export type ChecklistItemSummary = {
  id?: string | null;
  title?: string | null;
  complete?: boolean | null;
};

export type ChecklistSection = {
  count: number;
  templateId?: string | null;
  items: ChecklistItemSummary[];
};

export type CrmFindingDto = {
  id?: string | null;
  component?: string | null;       // display label
  componentId?: string | null;     // optional code if using lookups
  findingCode?: string | null;
  severity?: "Observation" | "Finding" | null;
  comments?: string | null;
  followUp?: boolean | null;
};

export type CrmRatingsDto = {
  riskRecognition?: string | null;
  scorecardManagement?: string | null;
  underwriting?: string | null;
  creditServicing?: string | null;
  loanAdministration?: string | null;
};

export type CrmFindingsSectionDto = {
  findingDescription?: string | null;
  findings?: CrmFindingDto[] | null;
  ratings?: CrmRatingsDto | null;
};

export type KeyRisksSectionDto = {
  keyRisks?: string | null;
  recommendFutureReview?: boolean | null;
  futureFollowUp?: string | null;
};

export type ReviewForm = {
  reviewInfo: ReviewInfoSection;
  customerInfo: CustomerInfoSection;
  // Transactions now carries server-provided rows/totals/approval
  transactions: TransactionsSectionDto;
  // Non-breaking addition: richer object for Collateral tab
  collateralTracking?: CollateralTrackingSectionDto | null;
  covenants: CovenantsSection;
  policyExceptions: PolicyExceptionsSection;
  regulatoryFlags: RegulatoryFlagsSection;
  collateral: CollateralSection;
  repayment: RepaymentSectionDto;
  // Key Risks section
  keyRisks?: KeyRisksSectionDto | null;
  // New: Scorecard detail object for Scorecard tab
  scorecard?: ScorecardSectionDto | null;
  // CRM Findings & Ratings section
  crmFindings?: CrmFindingsSectionDto | null;
  // Legacy/compat: summarized list (kept to avoid breaking older UI)
  scorecards: ScorecardsSection;
  findings: FindingsSection;
  riskRatingJustification: RiskRatingJustificationSection;
  checklist?: ChecklistSectionDto | null;
};

export type ReviewLookups = {
  reviewTypes: LookupItem[];
  targets: LookupItem[];
  quarters: LookupItem[];
  riskRatings: LookupItem[];

  covenantTypes: LookupItem[];
  // policyExceptionTypes will carry Id as code, Name as description, Group as category
  policyExceptionTypes: LookupItem[];
  regulatoryFlagTypes: LookupItem[];
  collateralTypes: LookupItem[];
  repaymentTypes: LookupItem[];

  scorecardTypes: LookupItem[];
  // CRM lookups for CRM Findings tab
  crmComponents: { id: string; name: string }[];
  findingCodes: Record<string, string[]>;
  findingCategories: LookupItem[];
  checklistTemplates: LookupItem[];
};

export type ReviewQueueResponse = {
  ecif: string;
  reviewId?: number | null;
  requestedByEmpNumber?: string | null;
  requestedAtUtc: string; // ISO timestamp
  form: ReviewForm;
  lookups: ReviewLookups;
  permissions: ReviewPermissions;
};

export async function getReview(ecif: string): Promise<ReviewQueueResponse> {
  return await get<ReviewQueueResponse>(`/api/v1/reviews/${encodeURIComponent(ecif)}/review`);
}

export type ReviewKeys = {
  reviewId?: number;
  sampleId?: number;
  ecif?: string | null;
};

export async function getReviewByKeys(keys: ReviewKeys): Promise<ReviewQueueResponse> {
  const u = new URLSearchParams();
  if (keys.reviewId !== undefined && keys.reviewId !== null) u.set("reviewId", String(keys.reviewId));
  if (keys.sampleId !== undefined && keys.sampleId !== null) u.set("sampleId", String(keys.sampleId));
  if (keys.ecif !== undefined && keys.ecif !== null && String(keys.ecif).trim() !== "") u.set("ecif", String(keys.ecif).trim());
  const qs = u.toString();
  const path = `/api/v1/reviews/review${qs ? `?${qs}` : ""}`;
  return await get<ReviewQueueResponse>(path);
}

export type ReviewQueueRow = {
  id: string;
  ecif: string;
  borrower: string;
  reviewer: string;
  sampleId: string;
  exposure: string;
  bankPd: string;
  casPd: string;
  completed: string;
};

export type QueueProgressCount = {
  status: string;
  count: number;
  highlight?: boolean;
};

export type ReviewQueuePageResponse = {
  rows: ReviewQueueRow[];
  progressCounts: QueueProgressCount[];
  samples: LookupItem[];
};

export async function getReviewQueuePage(sampleId?: number): Promise<ReviewQueuePageResponse> {
  const qs = sampleId !== undefined && sampleId !== null && !Number.isNaN(sampleId)
    ? `?sampleId=${encodeURIComponent(String(sampleId))}`
    : "";
  return await get<ReviewQueuePageResponse>(`/api/v1/reviews/queue${qs}`);
}

 // ----- Save (ReviewForm) -----

export type RowChangeKind = "None" | "Insert" | "Update" | "Delete";

export type RowTracker = {
  change: RowChangeKind;
  key?: string | null;
  clientKey?: string | null;
};

export type TrackedItem<T = any> = {
  tracker?: RowTracker | null;
  data: T;
};

export type SectionChangeKind = "None" | "Upsert" | "Delete";

export type SectionChange<T = any> = {
  change: SectionChangeKind;
  data?: T | null;
};

export type ReviewFormSaveRequest = {
  ecif: string;
  reviewId?: number | null;
  sampleId?: number | null;
  concurrencyToken?: string | null;

  // single-object sections
  reviewInfo?: SectionChange<any> | null;
  customerInfo?: SectionChange<any> | null;
  regulatoryTracking?: SectionChange<any> | null;
  riskRatingJustification?: SectionChange<any> | null;
  repayment?: SectionChange<any> | null;
  keyRisks?: SectionChange<any> | null;
  crmFindingsAndRatings?: SectionChange<any> | null;
  scorecard?: SectionChange<any> | null;

  // optional collateral tracking section if applicable
  collateralTracking?: SectionChange<any> | null;

  // collection sections (each row carries a tracker to indicate insert/update/delete)
  transactions?: TrackedItem[] | null;
  covenants?: TrackedItem[] | null;
  policyExceptions?: TrackedItem[] | null;
  collateral?: TrackedItem[] | null;
  checklist?: TrackedItem[] | null;
};

export type SectionResult = {
  change: SectionChangeKind;
  success: boolean;
  errors: string[];
};

export type RowResult = {
  change: RowChangeKind;
  key?: string | null;
  clientKey?: string | null;
  success: boolean;
  errors: string[];
};

export type ReviewFormSaveResponse = {
  success: boolean;
  message?: string | null;
  errors: string[];
  reviewId?: number | null;
  concurrencyToken?: string | null;

  // per-section results (single-object)
  reviewInfo?: SectionResult | null;
  customerInfo?: SectionResult | null;
  regulatoryTracking?: SectionResult | null;
  riskRatingJustification?: SectionResult | null;
  repayment?: SectionResult | null;
  keyRisks?: SectionResult | null;
  crmFindingsAndRatings?: SectionResult | null;
  scorecard?: SectionResult | null;
  collateralTracking?: SectionResult | null;

  // per-row results (collections)
  transactions?: RowResult[] | null;
  covenants?: RowResult[] | null;
  policyExceptions?: RowResult[] | null;
  collateral?: RowResult[] | null;
  checklist?: RowResult[] | null;
};

export async function saveReview(req: ReviewFormSaveRequest): Promise<ReviewFormSaveResponse> {
  return await post<ReviewFormSaveRequest, ReviewFormSaveResponse>("/api/v1/reviews/save", req, { timeoutMs: 120000 });
}
