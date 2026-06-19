"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

export type SectionKey =
  | "reviewInfo"
  | "customerInfo"
  | "regulatoryTracking"
  | "riskRatingJustification"
  | "repayment"
  | "keyRisks"
  | "crmFindingsAndRatings"
  | "scorecard"
  | "collateralTracking"
  | "transactions"
  | "covenants"
  | "policyExceptions"
  | "collateral"
  | "checklist";

export type FormChanges = Partial<Record<SectionKey, any>>;

type FormChangesContextValue = {
  changes: FormChanges;
  setField: (section: SectionKey, key: string, value: any) => void;
  setSection: (section: SectionKey, data: any) => void;
  clear: () => void;
};

const FormChangesContext = createContext<FormChangesContextValue | null>(null);

export function FormChangesProvider({ children }: { children: React.ReactNode }) {
  const [changes, setChanges] = useState<FormChanges>({});

  // Prevent excessive re-renders by batching writes on a microtask
  const pendingRef = useRef<Record<string, any>>({});

  const flush = useCallback(() => {
    const pending = pendingRef.current;
    pendingRef.current = {};
    setChanges(prev => {
      let next = { ...prev };
      for (const k of Object.keys(pending)) {
        const [section, key] = k.split("::");
        const sec = (next as any)[section] ?? {};
        (next as any)[section] = { ...sec, [key]: pending[k] };
      }
      return next;
    });
  }, []);

  const setField = useCallback((section: SectionKey, key: string, value: any) => {
    pendingRef.current[`${section}::${key}`] = value;
    Promise.resolve().then(flush);
  }, [flush]);

  const setSection = useCallback((section: SectionKey, data: any) => {
    setChanges(prev => ({ ...prev, [section]: { ...(prev as any)[section], ...(data ?? {}) } }));
  }, []);

  const clear = useCallback(() => setChanges({}), []);

  const value = useMemo<FormChangesContextValue>(() => ({ changes, setField, setSection, clear }), [changes, setField, setSection, clear]);

  return <FormChangesContext.Provider value={value}>{children}</FormChangesContext.Provider>;
}

export function useFormChanges(): FormChangesContextValue {
  const ctx = useContext(FormChangesContext);
  if (!ctx) throw new Error("useFormChanges must be used within a FormChangesProvider");
  return ctx;
}

/**
 * Safe variant that returns null instead of throwing when the provider is missing.
 * Use this in shared UI components that may be rendered outside of the provider.
 */
export function useFormChangesOptional(): FormChangesContextValue | null {
  return useContext(FormChangesContext);
}
