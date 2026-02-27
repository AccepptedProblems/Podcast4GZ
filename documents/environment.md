# PodcastW4GZ - Environment Variables & Secrets

## `.env.example` Template

Create a file named `.env.local` in the project root by copying `.env.example`:

```bash
cp .env.example .env.local
```

### `.env.example`

```env
# =============================================================================
# PodcastW4GZ Environment Variables
# =============================================================================
# Copy this file to .env.local and fill in the values.
# NEVER commit .env.local to version control.
# =============================================================================

# --- Spotify API Credentials ---
# Required. Obtain from https://developer.spotify.com/dashboard
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here

# --- Database ---
# SQLite database file path (relative to project root)
DATABASE_URL="file:./prisma/dev.db"

# --- Application ---
# Base URL of the application (used for metadata and OG tags)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Default Spotify market code for search
NEXT_PUBLIC_DEFAULT_MARKET=VN

# --- Cache ---
# Cache TTL in seconds (default: 900 = 15 minutes)
CACHE_TTL=900

# Maximum cached entries (default: 5000)
CACHE_MAX_KEYS=5000
```

---

## Environment Variable Reference

### Required Variables

| Variable                 | Required | Secret | Default                  | Description                                                |
| ------------------------ | -------- | ------ | ------------------------ | ---------------------------------------------------------- |
| `SPOTIFY_CLIENT_ID`     | Yes      | No     | -                        | Spotify application Client ID                              |
| `SPOTIFY_CLIENT_SECRET`  | Yes      | Yes    | -                        | Spotify application Client Secret                          |
| `DATABASE_URL`           | Yes      | No     | `file:./prisma/dev.db`   | Prisma database connection string (SQLite file path)       |

### Optional Variables

| Variable                       | Required | Secret | Default                  | Description                                           |
| ------------------------------ | -------- | ------ | ------------------------ | ----------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`          | No       | No     | `http://localhost:3000`  | Public-facing base URL for metadata and OG images     |
| `NEXT_PUBLIC_DEFAULT_MARKET`   | No       | No     | `VN`                     | Default Spotify market code for search queries        |
| `CACHE_TTL`                    | No       | No     | `900`                    | Default cache time-to-live in seconds                 |
| `CACHE_MAX_KEYS`              | No       | No     | `5000`                   | Maximum number of entries in the in-memory cache      |

### Variable Naming Conventions

- `NEXT_PUBLIC_*` -- Exposed to the browser. **Never** put secrets in these variables.
- All other variables are server-side only and never sent to the client.

---

## How to Get Spotify API Credentials

### Step 1: Create a Spotify Developer Account

1. Go to [https://developer.spotify.com/](https://developer.spotify.com/).
2. Log in with your existing Spotify account, or create a free Spotify account first.
3. Accept the Spotify Developer Terms of Service.

### Step 2: Create an Application

1. Navigate to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Click **"Create app"**.
3. Fill in the form:
   - **App name**: `PodcastW4GZ` (or any name you prefer)
   - **App description**: `Vietnamese podcast research and analysis tool`
   - **Redirect URIs**: `http://localhost:3000/api/auth/callback` (not used for Client Credentials flow, but required by Spotify)
   - **APIs used**: Check **Web API**
4. Click **"Save"**.

### Step 3: Get Your Credentials

1. On your app's dashboard page, you will see the **Client ID** displayed.
2. Click **"View client secret"** to reveal the **Client Secret**.
3. Copy both values into your `.env.local` file:

```env
SPOTIFY_CLIENT_ID=abc123def456...
SPOTIFY_CLIENT_SECRET=xyz789ghi012...
```

### Step 4: Verify Your Credentials

Run the following command to test that your credentials work:

```bash
curl -X POST "https://accounts.spotify.com/api/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET"
```

A successful response looks like:

```json
{
  "access_token": "BQD...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

---

## Authentication Flow

PodcastW4GZ uses the **Client Credentials** OAuth 2.0 flow. This flow:

- Does **not** require user login or consent.
- Grants access to public Spotify data only (shows, episodes, search).
- Does **not** provide access to user-specific data (playlists, listening history).
- Tokens expire after 3600 seconds (1 hour) and are automatically refreshed.

```
+------------------+                      +------------------------+
|  Next.js Server  |                      |  Spotify Accounts API  |
|  (API Route)     |                      |  accounts.spotify.com  |
+--------+---------+                      +------------+-----------+
         |                                             |
         |  POST /api/token                            |
         |  grant_type=client_credentials              |
         |  Authorization: Basic base64(id:secret)     |
         +-------------------------------------------->|
         |                                             |
         |  200 OK                                     |
         |  { access_token, expires_in: 3600 }         |
         |<--------------------------------------------+
         |                                             |
         |  (token cached in node-cache for ~3540s)    |
         |                                             |
         |  GET /v1/search?q=podcast&market=VN         |
         |  Authorization: Bearer {access_token}       |
         +-------------------------------------------->|
         |                                             |
         |  200 OK { shows: { items: [...] } }         |
         |<--------------------------------------------+
         |                                             |
```

---

## Security Considerations

1. **Never commit `.env.local`** to version control. The `.gitignore` file must include:
   ```
   .env.local
   .env*.local
   ```

2. **`SPOTIFY_CLIENT_SECRET` is a secret**. It must only exist in:
   - `.env.local` for local development.
   - Vercel environment variables (encrypted) for production.
   - Never in client-side code, logs, or error messages.

3. **Rotate credentials** if they are ever accidentally exposed:
   - Go to the Spotify Developer Dashboard.
   - Navigate to your app settings.
   - Click **"Reset client secret"**.
   - Update `.env.local` and Vercel environment variables immediately.

4. **Rate limiting**: Spotify enforces rate limits. The server-side cache (`node-cache`) reduces API calls. If you receive `429 Too Many Requests`, the Spotify client should respect the `Retry-After` header.

---

## `.gitignore` Entries

Ensure the following entries exist in `.gitignore`:

```gitignore
# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Database
prisma/dev.db
prisma/dev.db-journal

# Dependencies
node_modules/

# Next.js build
.next/
out/

# Misc
.DS_Store
*.tsbuildinfo
```
