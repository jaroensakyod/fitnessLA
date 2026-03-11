# Vercel Real Auth Checklist (fitnessLA)

## Required Environment Variables

Set the following values in Vercel for `Preview` and `Production` environments:

- `DATABASE_URL`: Supabase pooled connection string for Prisma.
- `BETTER_AUTH_SECRET`: strong secret for Better-Auth session signing.
- `BETTER_AUTH_URL`: canonical auth base URL (for example `https://<your-domain>/api/auth`).
- `NEXT_PUBLIC_BETTER_AUTH_URL`: public auth base URL matching `BETTER_AUTH_URL`.
- `NEXT_PUBLIC_APP_ADAPTER`: set to `real` for real API + cookie session mode.

## Route Protection

- `middleware.ts` now protects core app routes (`/dashboard`, `/shift`, `/pos`, `/expenses`, `/members`, `/coa`, `/admin`, `/reports`).
- Requests without a Better-Auth session cookie are redirected to `/login`.

## Runtime Note

- Better-Auth API route is declared with `runtime = "nodejs"` in `src/app/api/auth/[...all]/route.ts`.
- This avoids Edge runtime incompatibilities for auth internals.

## Manual Verification Before Deploy

1. Open `/login` in `real` mode and sign in with seeded account (`owner/admin/staff`).
2. Confirm `GET /api/auth/session` returns `200` with user role mapped to app role.
3. Open `/pos` in an incognito window without login and confirm redirect to `/login`.
4. Sign out and confirm protected route access is blocked until login again.
