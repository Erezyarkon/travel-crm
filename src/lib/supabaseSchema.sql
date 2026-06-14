-- =============================================
-- TRAVEL CRM - SUPABASE SCHEMA
-- Run this in your Supabase SQL editor
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- CLIENTS TABLE
create table clients (
  id uuid primary key default uuid_generate_v4(),
  file_number text unique not null,
  full_name text not null,
  phone text,
  email text,
  passport_number text,
  date_of_birth date,
  nationality text,
  status text default 'lead' check (status in ('lead','active','past')),
  preferences text,
  created_at timestamptz default now()
);

-- TRAVELERS TABLE (linked to client)
create table travelers (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade,
  full_name text not null,
  passport_number text,
  date_of_birth date,
  nationality text,
  gender text,
  is_lead boolean default false,
  type text default 'adult' check (type in ('adult','child')),
  age integer,
  created_at timestamptz default now()
);

-- SUPPLIERS TABLE
create table suppliers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null,
  contact_name text,
  phone text,
  email text,
  notes text,
  created_at timestamptz default now()
);

-- BOOKINGS TABLE
create table bookings (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade,
  file_number text not null,
  type text not null,
  status text default 'inquiry' check (status in ('inquiry','quoted','confirmed','paid','voucher_sent','completed','cancelled')),
  service_name text not null,
  check_in date,
  check_out date,
  pickup_date date,
  return_date date,
  num_travelers integer default 1,
  total_price numeric(10,2) default 0,
  deposit_paid numeric(10,2) default 0,
  supplier_id uuid references suppliers(id),
  supplier_confirmation text,
  notes text,
  details jsonb default '{}',
  created_at timestamptz default now()
);

-- AUTO-INCREMENT FILE NUMBER FUNCTION
create sequence client_file_seq start 1;
create or replace function generate_file_number()
returns text as $$
begin
  return 'TRV-' || lpad(nextval('client_file_seq')::text, 4, '0');
end;
$$ language plpgsql;

-- Row Level Security (enable for production)
alter table clients enable row level security;
alter table travelers enable row level security;
alter table bookings enable row level security;
alter table suppliers enable row level security;

-- Policies (allow all for now - tighten with auth later)
create policy "allow_all_clients" on clients for all using (true);
create policy "allow_all_travelers" on travelers for all using (true);
create policy "allow_all_bookings" on bookings for all using (true);
create policy "allow_all_suppliers" on suppliers for all using (true);
