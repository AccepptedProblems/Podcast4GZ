// =============================================================================
// Spotify Authentication - Client Credentials Flow
// =============================================================================
// Manages access tokens with automatic refresh. Tokens are stored in memory
// and refreshed 60 seconds before expiry to avoid mid-request failures.
// =============================================================================

import { SpotifyTokenResponse } from "./types";

const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";

/** Buffer in seconds before actual expiry to trigger a refresh */
const EXPIRY_BUFFER_SECONDS = 60;

/** In-memory token storage */
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Request a new access token from Spotify using the Client Credentials flow.
 *
 * Requires SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables.
 */
async function requestAccessToken(): Promise<SpotifyTokenResponse> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing Spotify credentials. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables."
    );
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to obtain Spotify access token: ${response.status} ${response.statusText} - ${errorBody}`
    );
  }

  const data: SpotifyTokenResponse = await response.json();
  return data;
}

/**
 * Returns a valid Spotify access token.
 *
 * If the current token is still valid (with a 60-second buffer), it is returned
 * from memory. Otherwise a fresh token is requested and cached.
 */
export async function getAccessToken(): Promise<string> {
  const now = Date.now();

  // Return cached token if it is still valid (accounting for the buffer)
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const tokenResponse = await requestAccessToken();

  cachedToken = tokenResponse.access_token;
  // Convert expires_in (seconds) to a timestamp, subtracting the buffer
  tokenExpiresAt =
    now + (tokenResponse.expires_in - EXPIRY_BUFFER_SECONDS) * 1000;

  return cachedToken;
}

/**
 * Force-clear the cached token. Useful when a 401 is received unexpectedly.
 */
export function clearTokenCache(): void {
  cachedToken = null;
  tokenExpiresAt = 0;
}
