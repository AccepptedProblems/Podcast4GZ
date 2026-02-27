# PodcastW4GZ - Deployment Guide

## Prerequisites

Before starting, ensure you have the following installed and configured:

| Requirement         | Minimum Version | Verification Command         |
| ------------------- | --------------- | ---------------------------- |
| Node.js             | 20.x            | `node --version`             |
| npm                 | 10.x            | `npm --version`              |
| Git                 | 2.x             | `git --version`              |
| Spotify API creds   | -               | See `environment.md`         |

Optional for production:

| Requirement         | Purpose                          |
| ------------------- | -------------------------------- |
| Vercel account      | Production hosting               |
| Vercel CLI          | CLI-based deployment             |
| Custom domain       | Custom domain for production URL |

---

## Local Development Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/w4gz/podcastw4gz.git
cd podcastw4gz
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs all dependencies listed in `package.json`, including Prisma CLI as a dev dependency.

### Step 3: Set Up Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Spotify credentials:

```env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
DATABASE_URL="file:./prisma/dev.db"
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEFAULT_MARKET=VN
```

See `environment.md` for instructions on obtaining Spotify API credentials.

### Step 4: Initialize the Database

```bash
npx prisma migrate dev --name init
npx prisma generate
```

This creates the SQLite database at `prisma/dev.db` and generates the Prisma client.

### Step 5: Install shadcn/ui Components

```bash
npx shadcn-ui@latest init
```

When prompted:
- Style: **Default**
- Base color: **Slate**
- CSS variables: **Yes**
- Tailwind config: `tailwind.config.ts`
- Components path: `src/components/ui`
- Utils path: `src/lib/utils`
- React Server Components: **Yes**

Then install the required components:

```bash
npx shadcn-ui@latest add button input card badge skeleton table tabs select dialog separator sheet tooltip
```

### Step 6: Start the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Step 7: Verify the Setup

1. Open [http://localhost:3000](http://localhost:3000) in your browser.
2. Try searching for a Vietnamese podcast (e.g., "Have A Sip").
3. Click on a result to view the podcast detail page.
4. If you see results, the Spotify API connection is working correctly.

### Development Scripts

| Command               | Description                                   |
| --------------------- | --------------------------------------------- |
| `npm run dev`         | Start dev server with hot reload (port 3000)  |
| `npm run build`       | Create production build                       |
| `npm run start`       | Start production server locally               |
| `npm run lint`        | Run ESLint on all source files                |
| `npm run format`      | Run Prettier on all source files              |
| `npx prisma studio`   | Open Prisma Studio (database GUI)             |
| `npx prisma migrate dev` | Run pending database migrations            |

---

## Vercel Deployment

### Option A: Deploy via Vercel Dashboard (Recommended)

#### Step 1: Push to GitHub

Ensure your code is pushed to a GitHub repository:

```bash
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/w4gz/podcastw4gz.git
git push -u origin main
```

#### Step 2: Import Project in Vercel

1. Go to [https://vercel.com/](https://vercel.com/) and sign in.
2. Click **"Add New..."** > **"Project"**.
3. Select **"Import Git Repository"**.
4. Find and select the `podcastw4gz` repository.
5. Vercel auto-detects Next.js. Verify the settings:

| Setting            | Value          |
| ------------------ | -------------- |
| Framework Preset   | Next.js        |
| Root Directory     | `./`           |
| Build Command      | `next build`   |
| Output Directory   | `.next`        |
| Install Command    | `npm install`  |

6. Click **"Deploy"**.

#### Step 3: Configure Environment Variables

1. In the Vercel project dashboard, go to **Settings** > **Environment Variables**.
2. Add the following variables:

| Name                          | Value                        | Environment        |
| ----------------------------- | ---------------------------- | ------------------ |
| `SPOTIFY_CLIENT_ID`           | `your_client_id`             | Production, Preview |
| `SPOTIFY_CLIENT_SECRET`       | `your_client_secret`         | Production, Preview |
| `DATABASE_URL`                | `file:./prisma/prod.db`      | Production         |
| `NEXT_PUBLIC_APP_URL`         | `https://your-domain.vercel.app` | Production     |
| `NEXT_PUBLIC_DEFAULT_MARKET`  | `VN`                         | Production, Preview |

3. Click **"Save"** for each variable.
4. Trigger a redeployment: go to **Deployments** > select the latest > **Redeploy**.

#### Step 4: Verify Deployment

1. Open the Vercel deployment URL (e.g., `https://podcastw4gz.vercel.app`).
2. Perform a test search to confirm the Spotify API is connected.
3. Check the **Functions** tab in Vercel for any API route errors.

### Option B: Deploy via Vercel CLI

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Authenticate

```bash
vercel login
```

#### Step 3: Deploy

From the project root:

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

#### Step 4: Set Environment Variables via CLI

```bash
vercel env add SPOTIFY_CLIENT_ID
vercel env add SPOTIFY_CLIENT_SECRET
vercel env add DATABASE_URL
vercel env add NEXT_PUBLIC_APP_URL
vercel env add NEXT_PUBLIC_DEFAULT_MARKET
```

Each command will prompt you for the value and target environments (Production, Preview, Development).

After adding variables, redeploy:

```bash
vercel --prod
```

---

## Database Setup for Production

### SQLite on Vercel (Simple)

By default, SQLite stores data in a local file. On Vercel serverless functions, the filesystem is ephemeral. This means:

- The SQLite file is **recreated on each deployment**.
- Data does **not** persist across deployments.
- This is **acceptable for Phase 1 MVP** where all data comes from the Spotify API and the database is only used for caching.

For Phase 1, set:

```env
DATABASE_URL="file:./prisma/prod.db"
```

Add a build step to run migrations automatically:

```json
// package.json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build",
    "postinstall": "prisma generate"
  }
}
```

### Persistent Database for Phase 2+

For Phase 2 (analytics with historical data), you need a persistent database. Options:

#### Option 1: Turso (SQLite-compatible, recommended)

[Turso](https://turso.tech) provides hosted SQLite (libSQL) with a generous free tier.

1. Install the Turso CLI:
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   turso auth signup
   ```

2. Create a database:
   ```bash
   turso db create podcastw4gz
   turso db show podcastw4gz --url
   turso db tokens create podcastw4gz
   ```

3. Update Prisma schema datasource:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

4. Set Vercel environment variables:
   ```env
   DATABASE_URL=libsql://podcastw4gz-yourname.turso.io?authToken=your_token
   ```

5. Install the libSQL Prisma adapter:
   ```bash
   npm install @prisma/adapter-libsql @libsql/client
   ```

#### Option 2: PostgreSQL (via Vercel Postgres or Neon)

If you need to scale beyond SQLite, switch to PostgreSQL:

1. Create a Vercel Postgres database in the Vercel dashboard.
2. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Re-run migrations:
   ```bash
   npx prisma migrate dev --name switch-to-postgres
   ```
4. Vercel auto-populates `DATABASE_URL` when you link the database.

---

## Custom Domain Setup

### Step 1: Add Domain in Vercel

1. Go to your Vercel project dashboard.
2. Navigate to **Settings** > **Domains**.
3. Enter your custom domain (e.g., `podcast.w4gz.com`).
4. Click **"Add"**.

### Step 2: Configure DNS

Vercel will display the required DNS records. Add them at your domain registrar:

#### For apex domain (e.g., `w4gz.com`):

| Type  | Name  | Value             |
| ----- | ----- | ----------------- |
| A     | @     | `76.76.21.21`     |

#### For subdomain (e.g., `podcast.w4gz.com`):

| Type  | Name      | Value                        |
| ----- | --------- | ---------------------------- |
| CNAME | podcast   | `cname.vercel-dns.com`       |

### Step 3: Wait for DNS Propagation

DNS changes can take up to 48 hours to propagate, though it usually happens within minutes. Vercel will show a checkmark when the domain is verified.

### Step 4: SSL Certificate

Vercel automatically provisions a free SSL certificate via Let's Encrypt once the domain is verified. No manual action is required.

### Step 5: Update Environment Variable

After the domain is active, update `NEXT_PUBLIC_APP_URL`:

```env
NEXT_PUBLIC_APP_URL=https://podcast.w4gz.com
```

Redeploy for the change to take effect.

---

## Post-Deployment Checklist

After deploying to production, verify the following:

- [ ] Home page loads without errors.
- [ ] Search returns results for Vietnamese podcast queries.
- [ ] Podcast detail page displays metadata and episodes.
- [ ] Episode detail page shows description and audio preview.
- [ ] Compare page can select and compare multiple podcasts.
- [ ] API routes return valid JSON (test via browser or `curl`).
- [ ] No Spotify credentials are exposed in client-side code (check browser Network tab).
- [ ] Custom domain resolves and shows a valid SSL certificate.
- [ ] Vercel Functions logs show no persistent errors.

---

## Troubleshooting

### Spotify API returns 401 Unauthorized

- Verify `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` are set correctly in Vercel.
- Ensure the credentials are for the correct Spotify Developer app.
- Check that the app has not been suspended on the Spotify Developer Dashboard.

### Build fails with Prisma errors

- Ensure the `build` script includes `prisma generate && prisma migrate deploy`.
- Ensure `@prisma/client` is in `dependencies` (not `devDependencies`).
- Ensure `prisma` is in `devDependencies`.

### Search returns no results

- Verify the `market` parameter is set to `VN`.
- Try a broader search term (e.g., "podcast" instead of a specific name).
- Check the Spotify API status at [https://developer.spotify.com/](https://developer.spotify.com/).

### Environment variables not loading

- In local development, ensure the file is named `.env.local` (not `.env`).
- In Vercel, ensure variables are assigned to the correct environment (Production, Preview, or Development).
- After changing Vercel environment variables, you must redeploy.
- Variables prefixed with `NEXT_PUBLIC_` are available in client-side code; all others are server-side only.
