create table if not exists brand_settings (
  id integer primary key default 1,
  name text not null,
  subtitle text not null,
  description text not null,
  phone text not null,
  address text not null,
  hours text not null,
  highlights jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  constraint brand_singleton check (id = 1)
);

create table if not exists menu_categories (
  id text primary key,
  name text not null,
  description text not null default '',
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists menu_items (
  id text primary key,
  category_id text not null references menu_categories(id) on delete cascade,
  name text not null,
  description text not null default '',
  price integer not null check (price >= 0),
  weight text not null default '',
  badges jsonb not null default '[]'::jsonb,
  image text not null default 'coffee',
  available boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
