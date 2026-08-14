create table if not exists brand_settings (
  id bigserial primary key,
  name text not null,
  subtitle text,
  description text,
  phone text,
  address text,
  hours text,
  highlights jsonb not null default '[]'::jsonb
);

create table if not exists menu_categories (
  id bigserial primary key,
  created_at timestamptz,
  updated_at timestamptz,
  deleted_at timestamptz,
  slug text not null unique,
  name text not null,
  description text,
  sort_order integer not null default 100
);

create index if not exists idx_menu_categories_deleted_at on menu_categories(deleted_at);

create table if not exists menu_items (
  id bigserial primary key,
  created_at timestamptz,
  updated_at timestamptz,
  deleted_at timestamptz,
  slug text not null unique,
  category_id text not null,
  name text not null,
  description text,
  price bigint not null,
  weight text,
  badges jsonb not null default '[]'::jsonb,
  image text,
  image_url text,
  available boolean not null default true,
  sort_order integer not null default 100
);

create index if not exists idx_menu_items_deleted_at on menu_items(deleted_at);
create index if not exists idx_menu_items_category_id on menu_items(category_id);

create table if not exists admins (
  id bigserial primary key,
  created_at timestamptz,
  updated_at timestamptz,
  deleted_at timestamptz,
  name text,
  email text not null unique,
  password_hash text not null,
  role text default 'manager'
);

create index if not exists idx_admins_deleted_at on admins(deleted_at);

create table if not exists orders (
  id bigserial primary key,
  created_at timestamptz,
  updated_at timestamptz,
  deleted_at timestamptz,
  customer_name text not null,
  contact_method bigint not null,
  phone text,
  city text,
  delivery_address text,
  status text not null default 'new',
  comment text,
  total_price bigint not null default 0
);

create index if not exists idx_orders_deleted_at on orders(deleted_at);

create table if not exists order_items (
  id bigserial primary key,
  created_at timestamptz,
  updated_at timestamptz,
  deleted_at timestamptz,
  order_id bigint,
  menu_item_id bigint not null,
  quantity bigint not null,
  unit_price bigint not null,
  total_price bigint not null,
  constraint fk_orders_items foreign key (order_id) references orders(id) on update cascade on delete cascade,
  constraint fk_order_items_menu_item foreign key (menu_item_id) references menu_items(id)
);

create index if not exists idx_order_items_deleted_at on order_items(deleted_at);
create index if not exists idx_order_items_order_id on order_items(order_id);
