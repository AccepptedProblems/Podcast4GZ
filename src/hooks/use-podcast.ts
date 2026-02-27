// =============================================================================
// usePodcast Hook
// =============================================================================
// Fetches podcast (show) details and its episodes from the API.
// Supports paginated loading of episodes via loadMoreEpisodes().
// =============================================================================

"use client";

import { useCallback, useEffect, useState } from "react";
import { SpotifyShow, SpotifyEpisode } from "@/lib/spotify/types";

interface UsePodcastResult {
  podcast: SpotifyShow | null;
  episodes: SpotifyEpisode[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMoreEpisodes: () => Promise<void>;
}

interface EpisodesApiResponse {
  items: SpotifyEpisode[];
  total: number;
  limit: number;
  offset: number;
  next: string | null;
  previous: string | null;
}

const EPISODES_PER_PAGE = 50;

/**
 * Fetch a podcast's details and its episodes with pagination support.
 *
 * @param id - Spotify show ID
 * @returns Podcast data, episodes, loading/error state, and pagination helpers
 *
 * @example
 * ```tsx
 * const { podcast, episodes, isLoading, error, hasMore, loadMoreEpisodes } =
 *   usePodcast("6Jx4Mz9vB2u1K3c7a9y8Z");
 * ```
 */
export function usePodcast(id: string | null): UsePodcastResult {
  const [podcast, setPodcast] = useState<SpotifyShow | null>(null);
  const [episodes, setEpisodes] = useState<SpotifyEpisode[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);

  // -------------------------------------------------------------------------
  // Fetch show details
  // -------------------------------------------------------------------------
  const fetchPodcast = useCallback(async (showId: string) => {
    try {
      const response = await fetch(`/api/shows/${showId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            `Failed to fetch podcast (status ${response.status})`
        );
      }

      const data: SpotifyShow = await response.json();
      setPodcast(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch podcast details";
      setError(message);
    }
  }, []);

  // -------------------------------------------------------------------------
  // Fetch episodes (initial or paginated)
  // -------------------------------------------------------------------------
  const fetchEpisodes = useCallback(
    async (showId: string, episodeOffset: number, append: boolean = false) => {
      try {
        const params = new URLSearchParams({
          limit: String(EPISODES_PER_PAGE),
          offset: String(episodeOffset),
        });

        const response = await fetch(
          `/api/shows/${showId}/episodes?${params.toString()}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error ||
              `Failed to fetch episodes (status ${response.status})`
          );
        }

        const data: EpisodesApiResponse = await response.json();

        if (append) {
          setEpisodes((prev) => [...prev, ...data.items]);
        } else {
          setEpisodes(data.items);
        }

        setTotal(data.total);
        setOffset(episodeOffset + data.items.length);
        setHasMore(data.next !== null);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch episodes";
        setError(message);
      }
    },
    []
  );

  // -------------------------------------------------------------------------
  // Initial data load
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!id) {
      setPodcast(null);
      setEpisodes([]);
      setError(null);
      setOffset(0);
      setTotal(0);
      setHasMore(false);
      return;
    }

    let cancelled = false;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      setEpisodes([]);
      setOffset(0);

      await Promise.all([
        fetchPodcast(id),
        fetchEpisodes(id, 0, false),
      ]);

      if (!cancelled) {
        setIsLoading(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [id, fetchPodcast, fetchEpisodes]);

  // -------------------------------------------------------------------------
  // Load more episodes (pagination)
  // -------------------------------------------------------------------------
  const loadMoreEpisodes = useCallback(async () => {
    if (!id || !hasMore) return;

    setIsLoading(true);
    await fetchEpisodes(id, offset, true);
    setIsLoading(false);
  }, [id, hasMore, offset, fetchEpisodes]);

  return {
    podcast,
    episodes,
    isLoading,
    error,
    hasMore,
    loadMoreEpisodes,
  };
}
