# CRM Submission

Mini ERP + CRM built with Next.js, Better Auth, PostgreSQL, and Drizzle ORM. The app is organized around three core modules:

- Customers: capture leads, manage pipeline status, and log follow-ups.
- Products: manage inventory, stock levels, and stock movement history.
- Sales Challans: create, confirm, deliver, and track dispatch challans while updating stock automatically.

## Deployment

- Live Demo URL: [https://crm-submission.vercel.app](https://crm-submission.vercel.app)
- Live Backend API Base: `https://crm-submission.vercel.app/api`

## Tech Stack

- Next.js 16
- React 19
- Better Auth
- PostgreSQL
- Drizzle ORM
- Tailwind CSS + shadcn-style UI components

## Setup

1. Install dependencies.

```powershell
pnpm install
```

2. Configure environment variables in `.env.local`.

```env
DATABASE_URL=postgresql://postgres:<your-password>@<host>:5432/postgres
BETTER_AUTH_SECRET=<your-secret>
BETTER_AUTH_URL=http://localhost:3000
```

3. Initialize the database schema.

```powershell
pnpm db:init
```

4. Seed demo CRM data.

```powershell
pnpm db:seed
```

5. Seed demo login accounts for all roles.

```powershell
pnpm db:seed-auth
```

6. Start the development server.

```powershell
pnpm dev
```

7. Open the app in your browser.

```text
http://localhost:3000
```

## Demo Login Credentials

These accounts are seeded for local/demo use:

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@example.com | Admin@12345 |
| Sales | sales@example.com | Sales@12345 |
| Inventory Manager | inventory@example.com | Inventory@12345 |

## What You Can Do

- Sign in with any of the demo roles above.
- Manage customers and pipeline stages.
- Manage products and inventory.
- Create sales challans from live customer/product data.
- Confirm challans to decrement stock and log stock movements.

## Useful Scripts

```powershell
pnpm dev
pnpm build
pnpm start
pnpm db:init
pnpm db:seed
pnpm db:seed-auth
pnpm lint
```

## Notes

- `pnpm db:seed` populates CRM sample data.
- `pnpm db:seed-auth` creates the demo auth users and credentials.
- If you change `.env.local`, restart the dev server.
