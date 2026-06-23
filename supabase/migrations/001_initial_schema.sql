-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- BUSINESSES
-- ============================================================
create table if not exists businesses (
  id              uuid primary key default uuid_generate_v4(),
  owner_id        uuid references auth.users(id) on delete cascade not null,
  name            text not null,
  email           text,
  phone           text,
  address         text,
  website         text,
  logo_url        text,
  currency        text not null default 'USD',
  invoice_prefix  text not null default 'INV',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table businesses enable row level security;
create policy "owner_all" on businesses for all using (auth.uid() = owner_id);

-- ============================================================
-- BUSINESS MEMBERS (multi-tenant team support)
-- ============================================================
create table if not exists business_members (
  id          uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade not null,
  user_id     uuid references auth.users(id) on delete cascade not null,
  role        text not null default 'member' check (role in ('owner','admin','member','viewer')),
  created_at  timestamptz default now(),
  unique(business_id, user_id)
);

alter table business_members enable row level security;
create policy "member_select" on business_members for select using (auth.uid() = user_id);
create policy "owner_manage" on business_members for all using (
  exists (select 1 from businesses b where b.id = business_id and b.owner_id = auth.uid())
);

-- ============================================================
-- CUSTOMERS
-- ============================================================
create table if not exists customers (
  id              uuid primary key default uuid_generate_v4(),
  business_id     uuid references businesses(id) on delete cascade not null,
  name            text not null,
  email           text,
  phone           text,
  address         text,
  notes           text,
  total_invoiced  numeric(12,2) default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table customers enable row level security;
create policy "business_customers" on customers for all using (
  business_id in (select id from businesses where owner_id = auth.uid())
);

-- ============================================================
-- PRODUCTS / SERVICES
-- ============================================================
create table if not exists products (
  id          uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade not null,
  name        text not null,
  description text,
  price       numeric(12,2) not null default 0,
  category    text,
  unit        text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table products enable row level security;
create policy "business_products" on products for all using (
  business_id in (select id from businesses where owner_id = auth.uid())
);

-- ============================================================
-- INVOICES
-- ============================================================
create table if not exists invoices (
  id              uuid primary key default uuid_generate_v4(),
  business_id     uuid references businesses(id) on delete cascade not null,
  customer_id     uuid references customers(id) on delete set null,
  invoice_number  text not null,
  status          text not null default 'draft' check (status in ('draft','sent','paid','overdue')),
  issue_date      date not null,
  due_date        date not null,
  items           jsonb not null default '[]',
  subtotal        numeric(12,2) not null default 0,
  tax_rate        numeric(5,2)  not null default 0,
  tax_amount      numeric(12,2) not null default 0,
  total           numeric(12,2) not null default 0,
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table invoices enable row level security;
create policy "business_invoices" on invoices for all using (
  business_id in (select id from businesses where owner_id = auth.uid())
);

-- ============================================================
-- PAYMENTS
-- ============================================================
create table if not exists payments (
  id          uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade not null,
  invoice_id  uuid references invoices(id) on delete cascade not null,
  amount      numeric(12,2) not null,
  date        date not null,
  method      text,
  reference   text,
  notes       text,
  created_at  timestamptz default now()
);

alter table payments enable row level security;
create policy "business_payments" on payments for all using (
  business_id in (select id from businesses where owner_id = auth.uid())
);

-- ============================================================
-- EXPENSES
-- ============================================================
create table if not exists expenses (
  id              uuid primary key default uuid_generate_v4(),
  business_id     uuid references businesses(id) on delete cascade not null,
  description     text not null,
  category        text,
  amount          numeric(12,2) not null,
  date            date not null,
  vendor          text,
  notes           text,
  receipt_url     text,
  payment_method  text,
  is_recurring    boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table expenses enable row level security;
create policy "business_expenses" on expenses for all using (
  business_id in (select id from businesses where owner_id = auth.uid())
);

-- ============================================================
-- SUBSCRIPTIONS (SaaS readiness)
-- ============================================================
create table if not exists subscriptions (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references auth.users(id) on delete cascade not null unique,
  plan          text not null default 'free' check (plan in ('free','starter','pro','enterprise')),
  status        text not null default 'active',
  current_period_start  timestamptz,
  current_period_end    timestamptz,
  created_at    timestamptz default now()
);

alter table subscriptions enable row level security;
create policy "own_subscription" on subscriptions for all using (auth.uid() = user_id);

-- ============================================================
-- INDEXES for performance
-- ============================================================
create index if not exists idx_businesses_owner      on businesses(owner_id);
create index if not exists idx_customers_business    on customers(business_id);
create index if not exists idx_products_business     on products(business_id);
create index if not exists idx_invoices_business     on invoices(business_id);
create index if not exists idx_invoices_customer     on invoices(customer_id);
create index if not exists idx_invoices_status       on invoices(status);
create index if not exists idx_payments_invoice      on payments(invoice_id);
create index if not exists idx_expenses_business     on expenses(business_id);
create index if not exists idx_expenses_date         on expenses(date);
