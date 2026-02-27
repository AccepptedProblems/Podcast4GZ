// =============================================================================
// Spotify API Client
// =============================================================================
// High-level client for the Spotify Web API podcast/episode endpoints.
// All methods use the Client Credentials token from auth.ts and cache
// responses via cache.ts. Rate limiting (HTTP 429) is handled with
// automatic retry using the Retry-After header.
// =============================================================================

import { getAccessToken, clearTokenCache } from "./auth";
import {
  SpotifyShow,
  SpotifyEpisode,
  SpotifyPaginatedResponse,
  SpotifySearchResponse,
} from "./types";
import {
  getCached,
  setCached,
  SEARCH_TTL,
  SHOW_TTL,
  EPISODE_TTL,
} from "../cache";

const BASE_URL = "https://api.spotify.com/v1";

/** Maximum number of automatic retries on 429 responses */
const MAX_RETRIES = 3;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface SearchOptions {
  market?: string;
  language?: string;
  limit?: number;
  offset?: number;
}

interface EpisodeListOptions {
  limit?: number;
  offset?: number;
  market?: string;
}

/**
 * Make an authenticated GET request to the Spotify API.
 * Handles 429 rate-limit responses by waiting for the duration specified in
 * the Retry-After header and retrying up to MAX_RETRIES times.
 * On 401, clears the token cache and retries once.
 */
async function spotifyFetch<T>(
  path: string,
  params?: Record<string, string | number | undefined>,
  retryCount: number = 0
): Promise<T> {
  const token = await getAccessToken();

  // Build query string, omitting undefined values
  const searchParams = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value));
      }
    }
  }

  const queryString = searchParams.toString();
  const url = `${BASE_URL}${path}${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Handle rate limiting (429)
  if (response.status === 429) {
    if (retryCount >= MAX_RETRIES) {
      throw new Error(
        "Spotify API rate limit exceeded. Maximum retries reached."
      );
    }

    const retryAfter = response.headers.get("Retry-After");
    const waitSeconds = retryAfter ? parseInt(retryAfter, 10) : 1;
    const waitMs = Math.max(waitSeconds, 1) * 1000;

    await new Promise((resolve) => setTimeout(resolve, waitMs));
    return spotifyFetch<T>(path, params, retryCount + 1);
  }

  // Handle expired / invalid token (401) - retry once with a fresh token
  if (response.status === 401 && retryCount === 0) {
    clearTokenCache();
    return spotifyFetch<T>(path, params, retryCount + 1);
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Spotify API error: ${response.status} ${response.statusText} - ${errorBody}`
    );
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Search for podcasts (shows) on Spotify.
 */
export async function searchShows(
  query: string,
  options: SearchOptions = {}
): Promise<SpotifyPaginatedResponse<SpotifyShow>> {
  const { market, language, limit = 10, offset = 0 } = options;

  const cacheKey = `search:shows:${query}:${market}:${language}:${limit}:${offset}`;
  const cached = getCached<SpotifyPaginatedResponse<SpotifyShow>>(cacheKey);
  if (cached) return cached;

  const data = await spotifyFetch<SpotifySearchResponse>("/search", {
    q: query,
    type: "show",
    market,
    limit,
    offset,
  });

  const result = data.shows ?? {
    href: "",
    items: [],
    limit,
    next: null,
    offset,
    previous: null,
    total: 0,
  };

  setCached(cacheKey, result, SEARCH_TTL);
  return result;
}

/**
 * Search for episodes on Spotify.
 */
export async function searchEpisodes(
  query: string,
  options: SearchOptions = {}
): Promise<SpotifyPaginatedResponse<SpotifyEpisode>> {
  const { market, language, limit = 10, offset = 0 } = options;

  const cacheKey = `search:episodes:${query}:${market}:${language}:${limit}:${offset}`;
  const cached = getCached<SpotifyPaginatedResponse<SpotifyEpisode>>(cacheKey);
  if (cached) return cached;

  const data = await spotifyFetch<SpotifySearchResponse>("/search", {
    q: query,
    type: "episode",
    market,
    limit,
    offset,
  });

  const result = data.episodes ?? {
    href: "",
    items: [],
    limit,
    next: null,
    offset,
    previous: null,
    total: 0,
  };

  setCached(cacheKey, result, SEARCH_TTL);
  return result;
}

/**
 * Get details for a single podcast (show) by its Spotify ID.
 */
export async function getShow(
  id: string,
  market?: string
): Promise<SpotifyShow> {
  const cacheKey = `show:${id}:${market}`;
  const cached = getCached<SpotifyShow>(cacheKey);
  if (cached) return cached;

  const data = await spotifyFetch<SpotifyShow>(`/shows/${id}`, { market });

  setCached(cacheKey, data, SHOW_TTL);
  return data;
}

/**
 * Get details for multiple podcasts (shows) by their Spotify IDs.
 * The Spotify API allows up to 50 IDs per request.
 */
export async function getShows(
  ids: string[],
  market?: string
): Promise<SpotifyShow[]> {
  if (ids.length === 0) return [];

  const cacheKey = `shows:${ids.join(",")}:${market}`;
  const cached = getCached<SpotifyShow[]>(cacheKey);
  if (cached) return cached;

  const data = await spotifyFetch<{ shows: SpotifyShow[] }>("/shows", {
    ids: ids.join(","),
    market,
  });

  setCached(cacheKey, data.shows, SHOW_TTL);

  // Also cache individual shows
  for (const show of data.shows) {
    if (show) {
      setCached(`show:${show.id}:${market}`, show, SHOW_TTL);
    }
  }

  return data.shows;
}

/**
 * Get the episodes of a podcast (show).
 */
export async function getShowEpisodes(
  id: string,
  options: EpisodeListOptions = {}
): Promise<SpotifyPaginatedResponse<SpotifyEpisode>> {
  const { limit = 50, offset = 0, market } = options;

  const cacheKey = `show:${id}:episodes:${limit}:${offset}:${market}`;
  const cached =
    getCached<SpotifyPaginatedResponse<SpotifyEpisode>>(cacheKey);
  if (cached) return cached;

  const data = await spotifyFetch<SpotifyPaginatedResponse<SpotifyEpisode>>(
    `/shows/${id}/episodes`,
    { limit, offset, market }
  );

  setCached(cacheKey, data, EPISODE_TTL);
  return data;
}

/**
 * Get details for a single episode by its Spotify ID.
 */
export async function getEpisode(
  id: string,
  market?: string
): Promise<SpotifyEpisode> {
  const cacheKey = `episode:${id}:${market}`;
  const cached = getCached<SpotifyEpisode>(cacheKey);
  if (cached) return cached;

  const data = await spotifyFetch<SpotifyEpisode>(`/episodes/${id}`, {
    market,
  });

  setCached(cacheKey, data, EPISODE_TTL);
  return data;
}

/**
 * Get details for multiple episodes by their Spotify IDs.
 * The Spotify API allows up to 50 IDs per request.
 */
export async function getEpisodes(
  ids: string[],
  market?: string
): Promise<SpotifyEpisode[]> {
  if (ids.length === 0) return [];

  const cacheKey = `episodes:${ids.join(",")}:${market}`;
  const cached = getCached<SpotifyEpisode[]>(cacheKey);
  if (cached) return cached;

  const data = await spotifyFetch<{ episodes: SpotifyEpisode[] }>(
    "/episodes",
    {
      ids: ids.join(","),
      market,
    }
  );

  setCached(cacheKey, data.episodes, EPISODE_TTL);

  // Also cache individual episodes
  for (const episode of data.episodes) {
    if (episode) {
      setCached(`episode:${episode.id}:${market}`, episode, EPISODE_TTL);
    }
  }

  return data.episodes;
}
