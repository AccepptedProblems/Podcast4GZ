// =============================================================================
// Spotify Web API Type Definitions
// =============================================================================

/** Spotify image object returned in API responses */
export interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

/** Copyright information for a show */
export interface SpotifyCopyright {
  text: string;
  type: string;
}

/** External URL references (typically a Spotify link) */
export interface SpotifyExternalUrls {
  spotify: string;
}

/** Spotify Show (Podcast) object */
export interface SpotifyShow {
  id: string;
  name: string;
  description: string;
  html_description: string;
  publisher: string;
  languages: string[];
  total_episodes: number;
  media_type: string;
  explicit: boolean;
  images: SpotifyImage[];
  available_markets: string[];
  is_externally_hosted: boolean;
  copyrights: SpotifyCopyright[];
  external_urls: SpotifyExternalUrls;
  uri: string;
}

/** Spotify Episode object */
export interface SpotifyEpisode {
  id: string;
  name: string;
  description: string;
  html_description: string;
  duration_ms: number;
  release_date: string;
  release_date_precision: "year" | "month" | "day";
  languages: string[];
  explicit: boolean;
  audio_preview_url: string | null;
  images: SpotifyImage[];
  is_playable: boolean;
  is_externally_hosted: boolean;
  show?: SpotifyShow;
  external_urls: SpotifyExternalUrls;
  uri: string;
}

/** Generic paginated response wrapper from the Spotify API */
export interface SpotifyPaginatedResponse<T> {
  href: string;
  items: T[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
}

/** Search endpoint response containing optional show and episode results */
export interface SpotifySearchResponse {
  shows?: SpotifyPaginatedResponse<SpotifyShow>;
  episodes?: SpotifyPaginatedResponse<SpotifyEpisode>;
}

/** Token response from the Client Credentials auth flow */
export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}
