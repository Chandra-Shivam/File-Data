"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getReview, getReviewByKeys, ReviewQueueResponse } from "@/services/api/reviews";

export type ReviewDataContextValue = {
  response: ReviewQueueResponse | null;
  isLoading: boolean;
  error: unknown;
};

const ReviewDataContext = createContext<ReviewDataContextValue>({
  response: null,
  isLoading: true,
  error: null
});

export function ReviewDataProvider({ children }: { children: React.ReactNode }) {
  const { ecif } = useParams<{ ecif: string }>();
  const searchParams = useSearchParams();

  const [response, setResponse] = useState<ReviewQueueResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      setIsLoading(true);
      try {
        const reviewIdStr = searchParams.get("reviewId");
        const sampleIdStr = searchParams.get("sampleId");
        const ecifStr = String(ecif);

        // 1) Zero-network fast path—use cache from Review Queue "Open"
        if (typeof window !== "undefined" && reviewIdStr && reviewIdStr.trim() !== "") {
          const cacheKey = `reviewQueue:${ecifStr}:${reviewIdStr}`;
          try {
            const cached = sessionStorage.getItem(cacheKey);
            if (cached && cached.length > 0) {
              const parsed = JSON.parse(cached) as ReviewQueueResponse;
              if (alive) {
                setResponse(parsed);
                setIsLoading(false);
                return;
              }
            }
          } catch {
            // ignore and fall through
          }
        }

        // 2) Single backend call as a fallback
        let res: ReviewQueueResponse;
        if ((reviewIdStr && reviewIdStr.trim() !== "") || (sampleIdStr && sampleIdStr.trim() !== "")) {
          res = await getReviewByKeys({
            reviewId: reviewIdStr ? Number(reviewIdStr) : undefined,
            sampleId: sampleIdStr ? Number(sampleIdStr) : undefined,
            ecif: ecifStr
          });
        } else {
          res = await getReview(ecifStr);
        }

        if (!alive) return;
        setResponse(res);
      } catch (e) {
        if (!alive) return;
        setError(e);
      } finally {
        if (alive) setIsLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
    // Use stable dependency for searchParams to avoid unnecessary runs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ecif, searchParams.toString()]);

  const value = useMemo(() => ({ response, isLoading, error }), [response, isLoading, error]);

  return <ReviewDataContext.Provider value={value}>{children}</ReviewDataContext.Provider>;
}

export function useReviewData(): ReviewDataContextValue {
  return useContext(ReviewDataContext);
}
