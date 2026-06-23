# Brandfledger

> Multi-tenant SaaS accounting & invoicing platform for small businesses.
> Built with **Next.js 14** · **TypeScript** · **Tailwind CSS** · **Supabase**

---

## Features

- **Authentication** — Supabase Auth (email/password) with protected routes
- **Multi-tenant** — Each user owns one or more business workspaces, fully isolated
- **Dashboard** — Revenue, expenses, profit & outstanding invoices at a glance
- **Customers** — Full CRUD with search
- **Products / Services** — Catalog with pricing
- **Invoices** — Create, line items, auto-totals, tax, status management (Draft → Sent → Paid / Overdue)
- **Payments** — Record payments linked to invoices; auto-marks invoice as paid
- **Expenses** — Track spending by category with vendor & receipt support
- **Reports** — Revenue vs expenses bar chart + profit trend line chart
- **Settings** — Business name, currency, invoice prefix

---

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/geniuspulse/brandfledger.git
cd brandfledger
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase/migrations/001_initial_schema.sql`
3. Copy your project URL and anon key

### 3. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`.

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, Register, Forgot Password
│   ├── (dashboard)/     # All protected pages
│   │   ├── dashboard/
│   │   ├── customers/
│   │   ├── invoices/
│   │   ├── products/
│   │   ├── payments/
│   │   ├── expenses/
│   │   ├── reports/
│   │   └── settings/
│   ├── onboarding/      # New user business setup
│   └── layout.tsx
├── components/
│   ├── layout/          # Sidebar, Header
│   └── ui/              # shadcn/ui components
├── lib/
│   ├── supabase/        # Client, Server, Middleware helpers
│   ├── actions/         # Server Actions (auth)
│   └── utils.ts
├── hooks/
│   └── use-toast.ts
└── types/
    └── index.ts
```

---

## Database Schema

All tables have Row Level Security (RLS) enabled — data is isolated per business owner.

| Table | Purpose |
|-------|---------|
| `businesses` | Business workspaces |
| `business_members` | Team roles (owner, admin, member, viewer) |
| `customers` | Customer database |
| `products` | Product/service catalog |
| `invoices` | Invoices with JSON line items |
| `payments` | Payments linked to invoices |
| `expenses` | Business expenses |
| `subscriptions` | SaaS subscription plan tracking |

---

## Deployment

Deploy to **Vercel** in one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/geniuspulse/brandfledger)

Set the same environment variables in your Vercel project settings.

---

## License

MIT
