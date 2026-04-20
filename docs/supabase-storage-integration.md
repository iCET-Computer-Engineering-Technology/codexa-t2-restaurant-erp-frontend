# Supabase Storage Integration (Menu Item Images)

This is a practical, step-by-step guide to set up **Supabase Storage** for menu item images.
It’s written as a hand-off for a dev lead who will configure Supabase under the **organization’s account**, then plug the values into this Angular frontend.

## Quick overview (what happens in the app)

- When adding/updating a menu item, the user picks an image from their PC.
- The frontend uploads it to Supabase Storage.
- Supabase returns a URL, and the frontend saves that URL into `imageUrl`.
- Your backend stores `imageUrl` in the database.
- Order Placement displays the image using `<img [src]="item.imageUrl">`.

## Where to look in this repo

- Upload helper: `src/app/services/supabase-storage.service.ts`
- Menu Item page (file picker + save): `src/app/page/menu-item/menu-item.ts`, `src/app/page/menu-item/menu-item.html`
- Order Placement image URL normalization (important for older data): `src/app/services/order.service.ts`
- Config: `src/environments/environment.ts`

## Supabase setup (organization account)

### 1) Create (or pick) the Supabase project

In Supabase (org account):
- Create a project (or use an existing one).
- Go to **Project Settings → API** and copy:
  - Project URL
  - `anon` public key

### 2) Create the Storage bucket

Storage → Buckets → New bucket
- Bucket name: `menu-item-images` (or update `environment.supabase.bucket` to match)
- Recommended (simplest): **Public bucket**
  - This allows images to load directly via a public URL inside `<img src="...">`.

If you keep the bucket **private**, you’ll need **signed URLs** (extra code + refresh logic). For this app’s current approach, public bucket is the intended setup.

### 3) Policies (RLS) for browser uploads

Supabase Storage uses the `storage.objects` table with Row Level Security (RLS).

Because the browser uploads directly using the **anon key**, you must allow `INSERT` into the bucket (or uploads will fail).

#### Option A: UI Policy Builder (recommended)

Storage → Policies → `storage.objects` → New Policy
- Policy name: `Allow anon uploads to menu images`
- Allowed operation: `INSERT`
- Target roles: `anon`
- WITH CHECK expression (IMPORTANT: this box is an expression only — don’t paste `create policy ...` here):

```sql
bucket_id = 'menu-item-images'
```

#### Option B: SQL Editor

```sql
create policy "Allow anon uploads to menu images"
on storage.objects
for insert
to anon
with check (bucket_id = 'menu-item-images');
```

### Optional: read policies

If the bucket is public, images usually work without custom `SELECT` policies.

If the bucket is private and you still want to show images, you either:
- implement signed URLs (recommended for private buckets), or
- add read policies (not recommended for public-facing images).

## Frontend configuration

In `src/environments/environment.ts`:

```ts
supabase: {
  url: 'https://<project-ref>.supabase.co',
  anonKey: '<anon-public-key>',
  bucket: 'menu-item-images',
}
```

## Security notes (important before pushing to `dev`)

- The `anon` key is **meant** to be used in frontend apps (it’s not the same as a server secret).
- The real risk is your **policies**.

If you allow `anon` to upload (INSERT) to a bucket, then anyone who can run your frontend can also upload. That can lead to abuse and increased storage/bandwidth costs.

For internal/dev environments this might be OK. For production, consider the “safer production options” below.

## Safer production options (recommended)

### Option 1: Upload via your backend (best control)

- Frontend sends image to your backend.
- Backend uploads to Supabase using a server-side credential (service role key) OR to another storage.
- Backend returns a final URL.

Pros: You control who can upload (based on your own auth).  
Cons: More backend work.

### Option 2: Supabase Auth + restrict uploads to `authenticated`

- Implement Supabase Auth login.
- Replace the INSERT policy to allow only `authenticated` role.

Pros: Native Supabase security model.  
Cons: Requires adopting Supabase Auth.

### Option 3: Private bucket + signed URLs

- Keep bucket private.
- Generate signed URLs for images.

Pros: Images aren’t publicly accessible.
Cons: Signed URLs expire and must be refreshed; requires more code.

## Troubleshooting

### Images not showing / Chrome "OpaqueResponseBlocking" (ORB)

ORB usually means the browser requested an image, but the response was **not actually an image** (often an HTML/JSON error response like 401/403/404). Chrome blocks it for security reasons.

Checklist:
1. DevTools → Network → filter “Img” → click the failed request
2. Confirm:
  - Request URL is a **full Supabase URL** (not just `chicken_curry.jpg`)
   - Status is **200**
   - Response header `Content-Type` starts with `image/`

Most common root causes:
- The database contains only a filename like `chicken_curry.jpg`. The browser then requests a local/relative URL (or your API host), which returns 404 HTML → ORB.
- The bucket is private but the app uses a public object URL.

What we did in this repo:
- `OrderService` normalizes older/legacy `imageUrl` values (filename-only or Supabase-relative paths) into a valid Supabase public URL.

### Image URL works in a browser tab, but not inside `<img>`

If the URL opens in a new tab but fails in `<img>`, check the response headers (rare, but possible):
- restrictive `Cross-Origin-Resource-Policy` (CORP)

For Supabase public object URLs we tested, headers were compatible with `<img>`:
- `200 OK`
- `Content-Type: image/jpeg`
- `Access-Control-Allow-Origin: *`

So if it still fails, it’s usually because the app is not actually using that same URL (or the DB still contains old filename-only values).

## Before merging/pushing to `dev`

- Confirm you’re not committing **personal** Supabase project config if the organization will use a different Supabase project.
- Never commit a Supabase **service role** key to the frontend.
- Decide whether the org will accept anonymous uploads in dev/prod:
  - Dev: OK
  - Prod: strongly consider backend-mediated uploads or authenticated-only policies
