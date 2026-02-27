// =============================================================================
// useSearch Hook
// =============================================================================
// Provides a debounced search against the /api/search endpoint.
// Returns results, loading state, error, and total count.
// =============================================================================

"use client";

import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "./use-debounce";
import { SpotifyShow } from "@/lib/spotify/types";

interface UseSearchResult {
  results: SpotifyShow[];
  isLoading: boolean;
  error: string | null;
  total: number;
}

interface SearchApiResponse {
  items: SpotifyShow[];
  total: number;
  limit: number;
  offset: number;
  next: string | null;
  previous: string | null;
}

/**
 * Search for Vietnamese podcasts with automatic debouncing.
 *
 * @param query - The raw search query (debounced internally)
 * @param delay - Debounce delay in ms (default 300)
 * @returns Search results, loading/error state, and total count
 *
 * @example
 * ```tsx
 * const { results, isLoading, error, total } = useSearch(query);
 * ```
 */
export function useSearch(query: string, delay: number = 300): UseSearchResult {
  const debouncedQuery = useDebounce(query, delay);

  const [results, setResults] = useState<SpotifyShow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);

  const fetchResults = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setTotal(0);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        type: "show",
      });

      const response = await fetch(`/api/search?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Search failed with status ${response.status}`
        );
      }

      const data: SearchApiResponse = await response.json();

      setResults(data.items);
      setTotal(data.total);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
      setResults([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults(debouncedQuery);
  }, [debouncedQuery, fetchResults]);

  return { results, isLoading, error, total };
}
