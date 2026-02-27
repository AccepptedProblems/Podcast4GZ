// =============================================================================
// Application Constants
// =============================================================================

// ---------------------------------------------------------------------------
// Spotify API defaults
// ---------------------------------------------------------------------------

/** Default market code for Spotify API requests (Vietnam) */
export const DEFAULT_MARKET = "VN";

/** Default language filter for search queries */
export const DEFAULT_LANGUAGE = "vi";

/** Number of search results per page */
export const SEARCH_LIMIT = 10;

/** Number of episodes to fetch per page */
export const EPISODES_LIMIT = 50;

// ---------------------------------------------------------------------------
// Podcast categories with pre-built search queries
// ---------------------------------------------------------------------------

export interface Category {
  name: string;
  query: string;
}

export const CATEGORIES: Category[] = [
  { name: "Tất cả", query: "" },
  { name: "Tin tức", query: "tin tức việt nam" },
  { name: "Kinh doanh", query: "kinh doanh khởi nghiệp" },
  { name: "Công nghệ", query: "công nghệ technology" },
  { name: "Giáo dục", query: "giáo dục học tập" },
  { name: "Sức khỏe", query: "sức khỏe wellness" },
  { name: "Văn hóa", query: "văn hóa nghệ thuật" },
  { name: "Giải trí", query: "giải trí comedy" },
  { name: "Lịch sử", query: "lịch sử việt nam history" },
  { name: "Tâm lý", query: "tâm lý self-help" },
  { name: "Tài chính", query: "tài chính đầu tư finance" },
  { name: "Thể thao", query: "thể thao sports" },
];

// ---------------------------------------------------------------------------
// Sort options
// ---------------------------------------------------------------------------

export interface SortOptionDef {
  label: string;
  value: string;
}

export const PODCAST_SORT_OPTIONS: SortOptionDef[] = [
  { label: "Phù hợp nhất", value: "relevance" },
  { label: "Nhiều tập nhất", value: "total_episodes_desc" },
  { label: "Ít tập nhất", value: "total_episodes_asc" },
  { label: "Tên A-Z", value: "name_asc" },
  { label: "Tên Z-A", value: "name_desc" },
];

export const EPISODE_SORT_OPTIONS: SortOptionDef[] = [
  { label: "Mới nhất", value: "date_desc" },
  { label: "Cũ nhất", value: "date_asc" },
  { label: "Dài nhất", value: "duration_desc" },
  { label: "Ngắn nhất", value: "duration_asc" },
  { label: "Tên A-Z", value: "name_asc" },
  { label: "Tên Z-A", value: "name_desc" },
];

// ---------------------------------------------------------------------------
// Navigation links
// ---------------------------------------------------------------------------

export interface NavLink {
  label: string;
  href: string;
}

export const NAV_LINKS: NavLink[] = [
  { label: "Trang chủ", href: "/" },
  { label: "Tìm kiếm", href: "/search" },
  { label: "Danh mục", href: "/categories" },
  { label: "So sánh", href: "/compare" },
];
