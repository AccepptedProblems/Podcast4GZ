---
id: export
title: Data Export
phase: 2
status: planned
priority: medium
depends_on:
  - search
  - podcast-detail
  - analytics
  - comparison
api_routes:
  - GET /api/export
screens:
  - /search
  - /podcast/[id]
  - /compare
created: 2026-02-27
updated: 2026-02-27
---

# Data Export

## Overview

The export feature allows users to download research data in CSV and PDF formats. CSV exports cover search results, episode lists, and comparison data. PDF reports provide formatted single-podcast profiles with analytics and comparison reports. Exports are generated server-side via API routes and delivered as file downloads. CSV generation uses plain string building. PDF generation uses `@react-pdf/renderer` for React-based PDF layout.

## User Stories

- **US-01**: As a researcher, I want to export search results to CSV so I can analyze podcast data in a spreadsheet.
- **US-02**: As a researcher, I want to export a podcast's episode list to CSV so I can work with episode data externally.
- **US-03**: As a researcher, I want to export comparison data to CSV so I can share comparative analysis.
- **US-04**: As a researcher, I want a PDF report of a single podcast's profile and analytics so I can present findings.
- **US-05**: As a researcher, I want a PDF comparison report so I can share side-by-side analysis.

## Technical Spec

### API Route

#### GET /api/export

File: `src/app/api/export/route.ts`

| Parameter | Type   | Required | Description                                          |
|-----------|--------|----------|------------------------------------------------------|
| `type`    | string | yes      | `csv` or `pdf`                                       |
| `data`    | string | yes      | `search`, `episodes`, `compare`, `podcast-report`, `compare-report` |
| `q`       | string | cond.    | Required when `data=search`: search query            |
| `id`      | string | cond.    | Required when `data=episodes` or `data=podcast-report`: Spotify show ID |
| `ids`     | string | cond.    | Required when `data=compare` or `data=compare-report`: comma-separated show IDs |
| `market`  | string | no       | Default: `VN`                                        |

**Request flow for CSV:**

```
GET /api/export?type=csv&data=search&q=kinh+te&market=VN
  -> Validate params
  -> Fetch data from internal API routes:
       search: GET /api/search?q={q}&market={market}&limit=10&offset=0 (paginate to collect all, max 100)
       episodes: GET /api/shows/{id}/episodes (paginate to collect all)
       compare: POST /api/compare { showIds }
  -> Convert to CSV string
  -> Return Response with headers:
       Content-Type: text/csv; charset=utf-8
       Content-Disposition: attachment; filename="{data}-{timestamp}.csv"
```

**Request flow for PDF:**

```
GET /api/export?type=pdf&data=podcast-report&id=abc123
  -> Validate params
  -> Fetch show data + analytics:
       GET /api/shows/{id}
       GET /api/analytics/{id}
  -> Render PDF using @react-pdf/renderer
  -> Return Response with headers:
       Content-Type: application/pdf
       Content-Disposition: attachment; filename="podcast-report-{name}-{timestamp}.pdf"
```

**Error responses:**

| Status | Condition                                         |
|--------|---------------------------------------------------|
| 400    | Missing required params for the selected data type|
| 400    | Invalid `type` (must be `csv` or `pdf`)          |
| 400    | Invalid `data` value                             |
| 404    | Show ID not found                                |
| 502    | Upstream data fetch failed                       |

### CSV Generation

File: `src/lib/export/csv-generator.ts`

```typescript
export function generateSearchCSV(shows: SpotifyShow[]): string {
  const headers = [
    "Spotify ID", "Name", "Publisher", "Total Episodes",
    "Languages", "Explicit", "Externally Hosted", "Spotify URL",
  ];

  const rows = shows.map(show => [
    show.id,
    escapeCsvField(show.name),
    escapeCsvField(show.publisher),
    show.total_episodes.toString(),
    show.languages.join("; "),
    show.explicit ? "Yes" : "No",
    show.is_externally_hosted ? "Yes" : "No",
    show.external_urls.spotify,
  ]);

  return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
}

export function generateEpisodesCSV(episodes: SpotifyEpisode[]): string {
  const headers = [
    "Spotify ID", "Name", "Release Date", "Duration (ms)",
    "Duration (formatted)", "Languages", "Explicit", "Spotify URL",
  ];

  const rows = episodes.map(ep => [
    ep.id,
    escapeCsvField(ep.name),
    ep.release_date,
    ep.duration_ms.toString(),
    formatDuration(ep.duration_ms),
    ep.languages.join("; "),
    ep.explicit ? "Yes" : "No",
    ep.external_urls.spotify,
  ]);

  return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
}

export function generateCompareCSV(data: CompareResponse): string {
  const headers = ["Metric", ...data.shows.map(s => s.name)];

  const metricRows = [
    ["Publisher", ...data.shows.map(s => s.publisher)],
    ["Total Episodes", ...data.shows.map(s => s.metrics.totalEpisodes.toString())],
    ["Avg Duration (min)", ...data.shows.map(s => s.metrics.avgDurationMinutes.toFixed(1))],
    ["Content Hours", ...data.shows.map(s => s.metrics.totalContentHours.toFixed(1))],
    ["Release Frequency (days)", ...data.shows.map(s => s.metrics.avgDaysBetweenReleases.toFixed(1))],
    ["Schedule", ...data.shows.map(s => s.metrics.schedule)],
    ["Status", ...data.shows.map(s => s.metrics.activeStatus)],
    ["Last Episode", ...data.shows.map(s => s.metrics.lastEpisodeDate)],
    ["Languages", ...data.shows.map(s => s.languages.join("; "))],
  ];

  return [headers.join(","), ...metricRows.map(r => r.map(escapeCsvField).join(","))].join("\n");
}

function escapeCsvField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}
```

### PDF Generation

File: `src/lib/export/pdf-generator.tsx`

Uses `@react-pdf/renderer` for server-side PDF rendering.

```typescript
import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 20 },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 12, fontWeight: "bold", marginBottom: 5, borderBottom: "1 solid #eee", paddingBottom: 3 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  label: { color: "#666", width: "40%" },
  value: { fontWeight: "bold", width: "60%" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { width: "23%", padding: 8, backgroundColor: "#f9fafb", borderRadius: 4 },
  statValue: { fontSize: 14, fontWeight: "bold" },
  statLabel: { fontSize: 8, color: "#666" },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, textAlign: "center", fontSize: 8, color: "#999" },
});

export async function generatePodcastReportPDF(
  show: ShowResponse,
  analytics: AnalyticsResponse
): Promise<Buffer> {
  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{show.name}</Text>
        <Text style={styles.subtitle}>by {show.publisher}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Show Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Total Episodes</Text>
            <Text style={styles.value}>{show.total_episodes}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Languages</Text>
            <Text style={styles.value}>{show.languages.join(", ")}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Explicit</Text>
            <Text style={styles.value}>{show.explicit ? "Yes" : "No"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Spotify URL</Text>
            <Text style={styles.value}>{show.external_urls.spotify}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analytics Summary</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{analytics.summary.totalContentHours.toFixed(1)}h</Text>
              <Text style={styles.statLabel}>Content Hours</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{analytics.summary.avgDurationFormatted}</Text>
              <Text style={styles.statLabel}>Avg Duration</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{analytics.releasePattern.schedule}</Text>
              <Text style={styles.statLabel}>Schedule</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{analytics.releasePattern.activeStatus}</Text>
              <Text style={styles.statLabel}>Status</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text>{show.description}</Text>
        </View>

        <Text style={styles.footer}>
          Generated by PodcastW4GZ on {new Date().toISOString().split("T")[0]}
        </Text>
      </Page>
    </Document>
  );

  return await renderToBuffer(doc);
}

export async function generateCompareReportPDF(data: CompareResponse): Promise<Buffer> {
  const doc = (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.title}>Podcast Comparison Report</Text>
        <Text style={styles.subtitle}>{data.shows.map(s => s.name).join(" vs ")}</Text>

        {/* Comparison table rendered as View rows */}
        <View style={styles.section}>
          {/* Header row */}
          <View style={{ flexDirection: "row", borderBottom: "1 solid #000", paddingBottom: 5, marginBottom: 5 }}>
            <Text style={{ width: "20%", fontWeight: "bold" }}>Metric</Text>
            {data.shows.map(s => (
              <Text key={s.id} style={{ width: `${80 / data.shows.length}%`, fontWeight: "bold" }}>{s.name}</Text>
            ))}
          </View>
          {/* Data rows for each metric */}
          {[
            { label: "Total Episodes", values: data.shows.map(s => s.metrics.totalEpisodes.toString()) },
            { label: "Avg Duration", values: data.shows.map(s => `${s.metrics.avgDurationMinutes.toFixed(1)} min`) },
            { label: "Content Hours", values: data.shows.map(s => `${s.metrics.totalContentHours.toFixed(1)}h`) },
            { label: "Frequency", values: data.shows.map(s => `${s.metrics.avgDaysBetweenReleases.toFixed(0)} days`) },
            { label: "Schedule", values: data.shows.map(s => s.metrics.schedule) },
            { label: "Status", values: data.shows.map(s => s.metrics.activeStatus) },
          ].map(row => (
            <View key={row.label} style={{ flexDirection: "row", paddingVertical: 3, borderBottom: "0.5 solid #eee" }}>
              <Text style={{ width: "20%", color: "#666" }}>{row.label}</Text>
              {row.values.map((v, i) => (
                <Text key={i} style={{ width: `${80 / data.shows.length}%` }}>{v}</Text>
              ))}
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          Generated by PodcastW4GZ on {new Date().toISOString().split("T")[0]}
        </Text>
      </Page>
    </Document>
  );

  return await renderToBuffer(doc);
}
```

### Components

#### ExportButton

File: `src/components/export/export-button.tsx`

```typescript
interface ExportButtonProps {
  type: "csv" | "pdf";
  data: "search" | "episodes" | "compare" | "podcast-report" | "compare-report";
  params: Record<string, string>; // Additional query params (q, id, ids, market)
  label?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
}
```

- shadcn/ui `Button` with `Download` icon (lucide-react)
- Default label: "Export CSV" or "Export PDF" based on `type`
- On click: constructs URL `/api/export?type={type}&data={data}&{...params}` and triggers download
- Download mechanism: `window.open(url)` or programmatic `<a>` click with `download` attribute
- Loading state: button shows `Loader2` spinner during download initiation
- Disabled state when required params are missing

#### ExportModal

File: `src/components/export/export-modal.tsx`

```typescript
interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  context: {
    data: string;
    params: Record<string, string>;
  };
}
```

- shadcn/ui `Dialog` component
- Title: "Export Data"
- Content: radio group to select format (CSV or PDF)
- Description text explaining what will be exported
- Available formats depend on `data` type:
  - `search`: CSV only
  - `episodes`: CSV only
  - `compare`: CSV or PDF
  - `podcast-report`: PDF only (single podcast analytics)
- "Download" button triggers the export
- "Cancel" button closes the dialog

**Format availability matrix:**

| Data Type        | CSV | PDF |
|------------------|-----|-----|
| search           | yes | no  |
| episodes         | yes | no  |
| compare          | yes | yes |
| podcast-report   | no  | yes |
| compare-report   | no  | yes |

### Page Integration

Export buttons are placed in the following locations:

| Location                  | Export Options                                          |
|---------------------------|--------------------------------------------------------|
| Search results toolbar    | `ExportButton type="csv" data="search" params={{q}}`   |
| Podcast detail page       | `ExportButton type="pdf" data="podcast-report" params={{id}}` |
| Episode list toolbar      | `ExportButton type="csv" data="episodes" params={{id}}`|
| Compare page              | `ExportModal` with CSV and PDF options                 |

### Data Flow

```
ExportButton / ExportModal
  |
  +-- onClick / onDownload
  |     +-- Construct URL: /api/export?type=csv&data=search&q=kinh+te
  |     +-- window.open(url) or <a download>
  |
  v
GET /api/export (server-side)
  |
  +-- Validate params
  +-- Fetch source data (internal API calls)
  +-- Generate file:
  |     +-- CSV: generateSearchCSV() / generateEpisodesCSV() / generateCompareCSV()
  |     +-- PDF: generatePodcastReportPDF() / generateCompareReportPDF()
  +-- Return file with Content-Disposition header
  |
  v
Browser downloads file
```

## Acceptance Criteria

- [ ] GET /api/export?type=csv&data=search returns a valid CSV file with search results
- [ ] CSV export includes all columns: ID, Name, Publisher, Episodes, Languages, Explicit, Hosted, URL
- [ ] CSV fields with commas or quotes are properly escaped
- [ ] GET /api/export?type=csv&data=episodes returns all episodes for the given show ID
- [ ] GET /api/export?type=csv&data=compare returns a comparison metrics table in CSV
- [ ] GET /api/export?type=pdf&data=podcast-report returns a formatted PDF with show info and analytics
- [ ] PDF report includes: show name, publisher, episode count, languages, content hours, avg duration, schedule, status
- [ ] GET /api/export?type=pdf&data=compare-report returns a landscape PDF with side-by-side comparison
- [ ] Content-Disposition header sets the correct filename with timestamp
- [ ] Content-Type headers are correct: `text/csv` for CSV, `application/pdf` for PDF
- [ ] Export button shows loading spinner during download initiation
- [ ] Export modal correctly limits format options based on data type
- [ ] Returns 400 for invalid type or data parameters
- [ ] Returns 400 when required contextual params (q, id, ids) are missing
- [ ] CSV files use UTF-8 encoding with BOM for Excel compatibility
