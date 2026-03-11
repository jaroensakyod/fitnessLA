# fitnessLA

Gym management system focused on accounting integrity first: strict shift control, POS flow, and audit-friendly financial data.

## Current State

- Real mode auth migrated to Better-Auth cookie sessions
- Core protected app routes are guarded by middleware
- Real adapter is wired for products, shifts, orders, expenses, daily summary, and admin user creation
- Latest verification passed: build + lint + tests (74/74)

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Useful Scripts

```bash
npm run build
npm run lint
npm run test
npm run db:migrate
npm run db:seed
npm run db:seed:users
npm run db:seed:real-mode
```

## Docs Map

- `project_map.md`
- `docs/main.md`
- `docs/Handoff_2026-03-11_Agent-B_Real-Mode.md`
- `docs/Vercel_Real_Auth_Checklist.md`
- `docs/API_Contract.md`

## Immediate Next Steps

- Run browser smoke test in real mode (`NEXT_PUBLIC_APP_ADAPTER=real`)
- Validate cookie persistence and middleware redirects
- Continue integration for APIs that are still not implemented
