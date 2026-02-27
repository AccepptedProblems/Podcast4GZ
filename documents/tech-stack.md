# PodcastW4GZ - Tech Stack

## Summary

| Layer          | Technology                | Version   | Purpose                                |
| -------------- | ------------------------- | --------- | -------------------------------------- |
| Framework      | Next.js (App Router)      | 14+       | Full-stack React framework             |
| Language       | TypeScript                | 5.x       | Type-safe JavaScript                   |
| Styling        | Tailwind CSS              | 3.x       | Utility-first CSS framework            |
| UI Components  | shadcn/ui                 | latest    | Accessible, composable component lib   |
| Charts         | Recharts                  | 2.x       | Declarative React charting library     |
| Caching        | node-cache                | 5.x       | In-memory server-side cache            |
| Database       | SQLite + Prisma           | latest    | Lightweight relational DB + ORM        |
| Fuzzy Search   | Fuse.js                   | 7.x       | Client/server fuzzy text matching      |
| Deployment     | Vercel                    | -         | Serverless deployment platform         |
| Package Mgr    | npm                       | 10+       | Dependency management                  |
| Linting        | ESLint                    | 8+        | Code quality                           |
| Formatting     | Prettier                  | 3.x       | Code formatting                        |

---

## Framework: Next.js 14+ (App Router)

Next.js provides the full-stack foundation: server-side rendering, API routes, and file-system routing.

### Configuration

```ts
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.scdn.co",  // Spotify CDN for cover art
      },
    ],
  },
};

export default nextConfig;
```

### Key Choices

- **App Router** (`src/app/`) over Pages Router for React Server Components, layouts, and streaming.
- **Server Components** by default; `"use client"` only for interactive components (search bar, chart interactions, comparison selector).
- **Route Handlers** (`route.ts`) for all API endpoints; no legacy `pages/api/`.

---

## Language: TypeScript 5.x

Strict mode enabled. All files use `.ts` / `.tsx` extensions.

```json
// tsconfig.json (key settings)
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "preserve",
    "module": "esnext",
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## Styling: Tailwind CSS 3.x

Utility-first CSS with the following customizations.

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        spotify: {
          green: "#1DB954",
          black: "#191414",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

### Design Tokens

| Token              | Value       | Usage                              |
| ------------------ | ----------- | ---------------------------------- |
| `spotify-green`    | `#1DB954`   | Primary accent, CTA buttons        |
| `spotify-black`    | `#191414`   | Dark backgrounds                   |
| Border radius      | `0.5rem`    | Default via shadcn/ui              |
| Font               | `Inter`     | Primary sans-serif                 |

---

## UI Components: shadcn/ui

shadcn/ui is not an installed npm package -- components are copied into `src/components/ui/` and owned by the project.

### Required Components

| Component       | Usage                                         |
| --------------- | --------------------------------------------- |
| `Button`        | All interactive buttons                       |
| `Input`         | Search bar, form fields                       |
| `Card`          | Podcast cards, episode cards, stat cards      |
| `Badge`         | Category tags, status indicators              |
| `Skeleton`      | Loading states for all cards and lists         |
| `Table`         | Comparison table, episode lists               |
| `Tabs`          | Podcast detail sections, analytics views       |
| `Select`        | Filter dropdowns, market selector             |
| `Dialog`        | Confirmation dialogs, export options           |
| `Pagination`    | Search results, episode lists                 |
| `Separator`     | Visual dividers                               |
| `Sheet`         | Mobile sidebar navigation                     |
| `Tooltip`       | Info hints on analytics charts                |

### Installation

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input card badge skeleton table tabs select dialog separator sheet tooltip
```

---

## Charts: Recharts 2.x

Used in the Phase 2 analytics dashboard.

```bash
npm install recharts
```

### Chart Types Used

| Chart Type      | Component            | Purpose                                   |
| --------------- | -------------------- | ----------------------------------------- |
| Line Chart      | `<LineChart>`        | Episode duration trend over time          |
| Bar Chart       | `<BarChart>`         | Episodes per month                        |
| Area Chart      | `<AreaChart>`        | Cumulative episode count                  |
| Heatmap (custom)| Custom grid          | Publish day/time heatmap                  |
| Pie Chart       | `<PieChart>`         | Duration distribution buckets             |

### Recharts Configuration Pattern

```tsx
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

export function DurationTrendChart({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis unit="min" />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="durationMin"
          stroke="#1DB954"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

---

## Caching: node-cache 5.x

In-memory key-value cache running on the server side within Next.js API routes.

```bash
npm install node-cache
```

### Configuration

```ts
// src/lib/cache.ts
import NodeCache from "node-cache";

export const cache = new NodeCache({
  stdTTL: 900,        // 15 minutes default TTL
  checkperiod: 120,   // Check for expired keys every 2 minutes
  useClones: false,    // Return references for performance
  maxKeys: 5000,       // Limit total cached entries
});
```

### Caching Strategy

| Data Type           | TTL        | Cache Key Pattern                   |
| ------------------- | ---------- | ----------------------------------- |
| Search results      | 15 min     | `search:{query}:{market}:{offset}`  |
| Show metadata       | 30 min     | `show:{id}`                         |
| Episode list        | 15 min     | `episodes:{showId}:{offset}`        |
| Episode metadata    | 30 min     | `episode:{id}`                      |
| Spotify token       | Token exp  | `spotify:token`                     |

---

## Database: SQLite + Prisma

SQLite is used as a lightweight persistent store for historical episode snapshots (Phase 2 analytics). Prisma serves as the ORM and migration tool.

```bash
npm install prisma @prisma/client
npx prisma init --datasource-provider sqlite
```

### Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Show {
  id              String    @id              // Spotify show ID
  name            String
  publisher       String
  description     String?
  totalEpisodes   Int
  imageUrl        String?
  spotifyUrl      String
  market          String    @default("VN")
  firstSeenAt     DateTime  @default(now())
  lastUpdatedAt   DateTime  @updatedAt
  episodes        Episode[]
  snapshots       ShowSnapshot[]

  @@index([market])
  @@index([name])
}

model Episode {
  id              String    @id              // Spotify episode ID
  showId          String
  name            String
  description     String?
  durationMs      Int
  releaseDate     String                     // "YYYY-MM-DD" from Spotify
  imageUrl        String?
  audioPreviewUrl String?
  spotifyUrl      String
  firstSeenAt     DateTime  @default(now())
  show            Show      @relation(fields: [showId], references: [id])

  @@index([showId])
  @@index([releaseDate])
}

model ShowSnapshot {
  id              Int       @id @default(autoincrement())
  showId          String
  totalEpisodes   Int
  snapshotDate    DateTime  @default(now())
  show            Show      @relation(fields: [showId], references: [id])

  @@index([showId, snapshotDate])
}
```

### Migrations

```bash
npx prisma migrate dev --name init
npx prisma generate
```

---

## Fuzzy Search: Fuse.js 7.x

Used for client-side fuzzy filtering of cached results and local directory search.

```bash
npm install fuse.js
```

### Configuration

```ts
// src/lib/search.ts
import Fuse from "fuse.js";
import type { SpotifyShow } from "@/types/spotify";

const fuseOptions: Fuse.IFuseOptions<SpotifyShow> = {
  keys: [
    { name: "name", weight: 0.6 },
    { name: "publisher", weight: 0.3 },
    { name: "description", weight: 0.1 },
  ],
  threshold: 0.4,
  includeScore: true,
  minMatchCharLength: 2,
};

export function fuzzySearch(shows: SpotifyShow[], query: string) {
  const fuse = new Fuse(shows, fuseOptions);
  return fuse.search(query);
}
```

---

## Deployment: Vercel

The application is deployed to Vercel with zero-config Next.js support.

### Vercel Requirements

| Setting                | Value                               |
| ---------------------- | ----------------------------------- |
| Framework Preset       | Next.js                             |
| Build Command          | `next build`                        |
| Output Directory       | `.next`                             |
| Node.js Version        | 20.x                                |
| Install Command        | `npm install`                       |
| Root Directory         | `/`                                 |

### Vercel Environment Variables

All environment variables listed in `environment.md` must be configured in the Vercel project settings under **Settings > Environment Variables**.

---

## Package.json Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "recharts": "^2.12.0",
    "node-cache": "^5.1.2",
    "@prisma/client": "^5.0.0",
    "fuse.js": "^7.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.350.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "prisma": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "tailwindcss-animate": "^1.0.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0",
    "prettier": "^3.2.0"
  }
}
```
