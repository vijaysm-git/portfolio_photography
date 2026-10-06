# Photography Portfolio

A pnpm monorepo containing a React/Vite website, an Express API, and shared
database and API-contract packages.

## Repository layout

```text
apps/
  api/                  Express API
  web/                  React + Vite website
packages/
  api-client-react/     Generated React Query client
  api-spec/             OpenAPI source and code generation
  api-zod/              Generated request/response schemas
  db/                   PostgreSQL schema and Drizzle configuration
```

## Requirements

- Node.js 24
- pnpm
- A Supabase project (or another PostgreSQL-compatible database)

Install dependencies from the repository root:

```powershell
corepack pnpm install --frozen-lockfile
```

## Supabase database setup

The app uses Supabase's hosted PostgreSQL database through the standard
PostgreSQL driver. You do not need the Supabase JavaScript client or local
PostgreSQL to run the app.

1. Create a project in Supabase.
2. In the project dashboard, open **Connect** and copy the **Session pooler**
   connection string. Use the complete URI supplied by Supabase, including its
   SSL query parameter. Replace its password placeholder with the database
   password you chose when creating the project. URL-encode special characters
   in the password.
3. Open `apps/api/.env` and set `DATABASE_URL` to that full URI. Replace
   separate `host`, `port`, `database`, and `user` entries with the single
   `DATABASE_URL` setting:

```dotenv
DATABASE_URL='postgresql://...your-complete-supabase-session-pooler-uri...'
```

Do not paste the real URI into chat, put it in a `VITE_*` variable, or commit
`apps/api/.env`. The API and Drizzle load this ignored file automatically. Shell
environment variables take precedence over values in the file.

4. Apply database migrations to Supabase from the repository root:

```powershell
corepack pnpm --filter @workspace/db run migrate
```

The API's `apps/api/.env.example` documents the required API settings. Copy it
to `apps/api/.env` if needed, then add the Supabase `DATABASE_URL` and the
server-only S3 settings described below.

### Configure image storage

In Supabase Storage, enable the S3 connection and make the portfolio media
bucket publicly readable (or serve it through a public CDN); keep writes
restricted to signed API uploads. Configure the bucket's maximum upload size
to 2 MB and set its CORS allowed origins to the site's development and
production origins, allowing `PUT` and the `Content-Type` and `Content-Length`
headers.

Set these server-only values in `apps/api/.env` using the Supabase Storage S3
credentials and endpoint shown in the dashboard:

- `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`
- `S3_ACCESS_KEY`, `S3_SECRET_KEY`
- Optional `S3_PUBLIC_BASE_URL` if the public media URL differs from Supabase's
  standard public bucket URL. For another S3-compatible provider, set this to
  the public bucket or CDN base URL.

Never put S3 credentials in a `VITE_*` variable or expose them in the browser.
The API issues five-minute, admin-session-protected presigned PUT URLs. The
browser accepts JPEG, PNG, WebP, or AVIF source images up to 20 MB, resizes
them to the display dimensions shown beside each picker, converts them to WebP,
and compresses them to at most 2 MB before upload. The API accepts only the
optimized WebP output, and Supabase's bucket limit should also be set to 2 MB.
This keeps new image uploads comfortably below the Free plan's 1 GB file
storage quota for a modest portfolio. The upload URL is temporary; the stable
public URL is what gets saved to PostgreSQL when the admin saves the record:

- Portfolio cover and gallery URLs go into `portfolio.cover_image` and
  `portfolio.images`.
- Service image URLs go into `services.image`.
- Optional testimonial photo URLs go into `testimonials.photo`.
- The independent homepage hero image is saved in `homepage_settings.hero_image`
  from **Admin → Homepage**.

The upload controls show supported source formats, source limit, resize bounds,
and stored image limit beside each picker. Images are never upscaled; resizing
preserves aspect ratio. Portfolio images are bounded to 2000 × 2000 px, hero
images to 2560 × 1440 px, services to 1600 × 1200 px, and testimonial photos to
512 × 512 px. WebP conversion strips source metadata such as camera location.

Supabase Free currently includes 1 GB file storage and 5 GB each of egress and
cached egress. At a 2 MB hard maximum, 136 files (one cover plus five gallery
images for each of 20 projects, 10 services, five testimonial photos, and one
hero) have a theoretical maximum near 272 MB; if five images per project
includes the cover, the maximum is about 232 MB. Egress depends on how often
visitors load photos, so keep images close to the displayed dimensions and
below-fold images are lazy-loaded. Monitor Storage and egress usage in the
Supabase dashboard. Supabase quotas can change; check its current
[pricing](https://supabase.com/pricing).

The Admin → Storage usage page reports all objects in the configured bucket
plus active upload reservations. It warns at 500 MB and refuses new signed
uploads if the next upload would reach the 700 MB app budget. The reserve
includes in-flight signed uploads so simultaneous admin uploads cannot all
spend the same remaining capacity. Upload admission fails closed if Storage
object sizes cannot be read. This requires the API database role to query
Supabase's `storage.objects` metadata; apply the pending Drizzle migrations,
including `0004_storage_upload_reservations.sql`, before deploying this feature.
The measurement includes every object in the configured bucket, not only files
created by this app.

This app-side limit is a safety margin, not a guarantee that the Supabase
project stays within every Free quota. Public image downloads bypass the API,
so egress is not measured or blocked here. Monitor Storage, database, egress,
and cached egress independently in Supabase Dashboard. If usage reaches the
app's upload limit, review unreferenced media carefully before removing it;
the existing retention worker only purges media for content past the
15-day restore window.

If an upload succeeds but the admin cancels the form, or an image is replaced,
the unreferenced object remains in Storage. Review and remove such objects
periodically after confirming they are not referenced by any records; avoid
bulk-deleting objects directly from the bucket. Existing originals are not
automatically converted when this optimization is deployed; replace them from
the Admin pages to upload optimized WebP versions.

### Create the first admin

There is no public registration. Put the initial credentials in the ignored
`apps/api/.env` as `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Use a unique password at
least 12 characters long. These values are read only by the one-time bootstrap
command, not by the running API:

```powershell
corepack pnpm --filter @workspace/api run admin:create
```

After the command reports success, remove `ADMIN_EMAIL` and `ADMIN_PASSWORD`
from `.env`. Only the Argon2id password hash remains in PostgreSQL. In a
production environment, run this bootstrap command once from an operator
shell with the production `DATABASE_URL` and temporary bootstrap credentials;
do not leave those credentials configured on the deployed API service.

To move existing local PostgreSQL content, first apply the schema to Supabase
as above, then optionally copy application data (excluding expiring admin
sessions) with `pg_dump` and `psql`. Set `LOCAL_DATABASE_URL` to the old local
database URI and keep `DATABASE_URL` set to Supabase:

```powershell
$env:LOCAL_DATABASE_URL = "postgresql://..."
pg_dump $env:LOCAL_DATABASE_URL `
  --data-only --no-owner --no-privileges `
  --exclude-table=public.sessions --exclude-table=public.admin_accounts |
  psql $env:DATABASE_URL
```

Only run this import once into an empty Supabase database. It copies data, not
schema, and does not delete or alter the local database. If there is no
portfolio data to preserve, skip the import.

## Run locally

Start the API and website in separate terminals from the repository root. Set
the `SESSION_SECRET` and `PORT` values in `apps/api/.env`; `DATABASE_URL` must
be the Supabase URI configured above:

API:

```powershell
corepack pnpm --filter @workspace/api run dev
```

Website:

```powershell
corepack pnpm --filter @workspace/web run dev
```

Open <http://localhost:5173>. The Vite server proxies `/api` to
`http://127.0.0.1:8080` by default. Set `API_PROXY_TARGET` if the API runs
elsewhere. `PORT` controls the website port, and `BASE_PATH` can set a
non-root deployment path.

## Admin access and production routing

The portfolio pages stay public. The Admin link is intentionally omitted from
the public footer. Admins can open `/admin/login` directly on the site domain
(for example `https://www.example.com/admin/login`); there is no separate
admin domain or public registration. Hiding the link is only a discoverability
choice: the login route remains reachable, while admin pages and every
admin-only API operation require a valid authenticated session. The
`HttpOnly`, `SameSite=Lax` cookie is marked `Secure` in production.

Admin session expiry is configurable to **12 or 24 hours** in **Admin →
Account → Session security**. The default is 12 hours. The selected duration
sets both the browser cookie and the PostgreSQL session expiry for new logins;
changing it does not alter sessions that are already active. Sessions are not
configured for rolling renewal. Signing out or changing admin credentials
revokes the session immediately.

### Recently deleted content

Deleting a project, service, or testimonial moves it to **Admin → Recently
deleted** instead of removing it immediately. You can restore each item during
the 15-day recovery window; restored items return to public pages. Each content
page also supports selecting and archiving multiple records at once. Inquiries
are not included in this recovery flow.

After 15 days, the API permanently removes the archived database record and
app-owned uploaded images that are no longer referenced by other content. Image
URLs outside the configured storage bucket are never removed. The retention
sweeper runs at API startup and hourly while the API is running; items that
expire while the API is offline are purged after it starts again. Configure the
API storage credentials with object-delete permission for uploaded media so the
sweeper can complete image cleanup.

After deploying this feature, apply its database migration from the repository
root:

```powershell
corepack pnpm --filter @workspace/db run migrate
```

For production, serve the built SPA and reverse-proxy `/api/*` to the API under
the same HTTPS origin, for example `www.example.com/` for the website and
`www.example.com/api/` for the API. Configure the proxy to preserve the
original host/protocol and the API's trust-proxy setting. Do not expose API
credentials to the browser or use `VITE_*` settings for secrets.

### Optional Cloudflare Access gate

Cloudflare currently advertises a Zero Trust Free plan; confirm current limits
and eligibility in its [official plan details](https://www.cloudflare.com/plans/zero-trust-services/).
This is optional. Once the production site has a custom domain managed and
proxied through Cloudflare:

1. In Cloudflare Zero Trust, create a **Self-hosted** Access application for
   the production site, scoped to `/admin` and `/admin/*`.
2. Add an **Allow** policy for the administrator's email/identity provider and
   choose an authentication method such as a one-time PIN.
3. Test a signed-out visit to `https://<site-domain>/admin/login`; Access should
   verify identity before the app's existing email/password login appears.
   Public pages should continue to open without Access authentication.
4. Keep the application origin inaccessible except through Cloudflare (or use
   Cloudflare Tunnel), so users cannot bypass the Access check via the origin.

Admins still use the same direct link `/admin/login`; with Access enabled,
Cloudflare's identity check happens first, followed by the portfolio app's
existing admin sign-in. Cloudflare setup is performed in its dashboard and
cannot be enabled just by changing this repository.

After signing in, use **Admin → Account** to change the email and/or password.
The form requires the current password; a successful change revokes all
sessions and requires signing in again. There is no public sign-up or
email-based password recovery. If the admin account is inaccessible, an
operator with database access can temporarily set new `ADMIN_EMAIL` and
`ADMIN_PASSWORD` values in the ignored API `.env` and run:

```powershell
corepack pnpm --filter @workspace/api run admin:reset
```

The reset command requires exactly one admin account, hashes the replacement
password, and revokes sessions. Remove those temporary credential entries from
`.env` immediately afterward. Login attempts are rate-limited per API process;
if the API is later horizontally scaled, use a shared rate-limit store.

## Studio site configuration

Set these Vite variables when building the website. Unset optional contact and
social values are omitted from the site:

- `VITE_STUDIO_NAME` (defaults to `Photography Studio`)
- `VITE_STUDIO_TAGLINE`
- `VITE_STUDIO_ESTABLISHED_YEAR`
- `VITE_STUDIO_EMAIL`
- `VITE_STUDIO_PHONE`
- `VITE_STUDIO_WHATSAPP_PHONE` (international digits, without `+`; defaults to
  `919500263774`, displayed as `+91 95002 63774`)
- `VITE_STUDIO_INSTAGRAM_URL` (defaults to
  `https://www.instagram.com/ak_studio_officials/`)

These values are public and become part of the client bundle. Never put
credentials or secrets in `VITE_*` variables.

## Production build

```powershell
corepack pnpm run typecheck
corepack pnpm run build
```

The static website is emitted to `apps/web/dist`; the standalone API bundle is
emitted to `apps/api/dist`. The repository includes Netlify configuration for
deploying the website and Express API together:

- `netlify.toml` builds the Vite app from the monorepo root, publishes
  `apps/web/dist`, rewrites same-origin `/api/*` requests to a Netlify Function,
  and schedules the archive-retention cleanup hourly.
- The API function uses the existing Express application and PostgreSQL session
  store. It does not start a listening server; `PORT` is not needed on Netlify.
- Netlify Functions are request-driven rather than an always-running API
  process. They can have a cold start after inactivity. Netlify's Free plan
  has monthly usage credits/limits, so check the current
  [Netlify pricing](https://www.netlify.com/pricing/) and usage dashboard.
- The hourly scheduled cleanup runs on published deploys; scheduled functions
  are documented as available on all Netlify plans. See
  [Netlify Scheduled Functions](https://docs.netlify.com/build/functions/scheduled-functions/).

### Netlify deployment

After connecting the GitHub repository in Netlify, keep the base directory at
the repository root. The build, publish directory, function directory, API
rewrite, SPA fallback, Node version, and hourly cleanup schedule are already
declared in `netlify.toml`.

Configure these values in **Netlify → Site configuration → Environment
variables**. Use the Supabase **Shared Pooler, Transaction mode** connection
string for the runtime `DATABASE_URL`; it is intended for serverless functions
that open short-lived connections. Drizzle migrations should be run separately
from an operator environment with the Supabase direct or session-mode connection
string.

- `DATABASE_URL`
- `SESSION_SECRET` (generate a long random secret, unique to this deployment)
- `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`
- Optional `S3_PUBLIC_BASE_URL` for a non-Supabase S3-compatible storage host
- Public build-time `VITE_STUDIO_*` values listed in **Studio site
  configuration** above
- `NODE_ENV=production` (also set in `netlify.toml`)

Do not set `ADMIN_EMAIL` or `ADMIN_PASSWORD` as persistent Netlify environment
variables. After applying all database migrations to the production Supabase
project, create the initial admin once from a trusted operator terminal using
the production database URL and temporary bootstrap credentials. Remove the
temporary credentials immediately after the command succeeds. Never add
production secrets to Git or `VITE_*` variables.

Add the custom domain in the Netlify domain settings, then copy the DNS records
Netlify provides into the domain registrar (for example Hostinger). Wait for
DNS and HTTPS provisioning before testing admin login, uploads, and the
`/api/*` routes. Because the API is reached through the same site origin, the
existing secure, HttpOnly admin session cookie does not require a separate API
domain or permissive cross-origin credentials.

Supabase Free can still pause projects after low activity; hosting the API on
Netlify does not prevent database pausing. Supabase documents that paid
projects are not paused for inactivity. For production availability, use
Supabase Pro and continue monitoring its included resource quotas and Netlify
credits. Netlify Functions may cold-start, but are invoked automatically by
incoming requests; there is no always-on server to manually wake.

Before launch, verify public pages and images, contact submission, admin
login/logout, session expiry, upload signing and storage usage, recent-delete
restore, and the scheduled retention sweep. Keep the Supabase database and S3
credentials out of the client build and Git history.

Existing database records are preserved; old Replit object-storage media paths
will not resolve and need migration before their images can display.

## Workspace commands

- `corepack pnpm run typecheck` — typecheck shared packages and apps
- `corepack pnpm run build` — typecheck and build all packages and apps
- `corepack pnpm --filter @workspace/api-spec run codegen` — regenerate API clients and schemas from OpenAPI
- `corepack pnpm --filter @workspace/db run migrate` — apply database migrations
