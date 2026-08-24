insert into brand_settings (id, name, subtitle, description, phone, address, hours, highlights)
values (
  1,
  'ЧамБу',
  'Блины, завтраки и напитки в Грозном',
  'Теплое меню для быстрых завтраков, спокойных встреч и сладких пауз.',
  '+7 938 994-88-00',
  'Грозный, ул. Хамзата Орзамиева, 30/30А',
  'Ежедневно 08:00-22:00',
  '["с собой", "завтраки весь день", "свежая выпечка"]'
)
on conflict (id) do update set
  name = excluded.name,
  subtitle = excluded.subtitle,
  description = excluded.description,
  phone = excluded.phone,
  address = excluded.address,
  hours = excluded.hours,
  highlights = excluded.highlights;

insert into menu_categories (slug, name, description, sort_order) values
  ('pancakes', 'Блины', 'Сладкие и сытные блины с аккуратной подачей.', 10),
  ('breakfast', 'Завтраки', 'Сытные блюда для утра и позднего старта.', 20),
  ('drinks', 'Напитки', 'Кофе, чай, лимонады и сезонные вкусы.', 30)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order;

insert into menu_items (slug, category_id, name, description, price, weight, badges, image, image_url, available, sort_order) values
  ('pancake-honey', 'pancakes', 'Блин с медом', 'Тонкий румяный блин со сливочным маслом и горным медом.', 190, '180 г', '["нежный"]', 'pancake-folded', '', true, 10),
  ('pancake-chicken', 'pancakes', 'Блин с курицей', 'Сытная начинка из курицы, сыра и зелени.', 290, '240 г', '["сытно"]', 'pancake-stack', '', true, 20),
  ('pancake-berry', 'pancakes', 'Блин с ягодами', 'Творожный крем, ягодный соус и легкая сахарная пудра.', 270, '220 г', '["хит"]', 'pancake-berries', '', true, 30),
  ('omelet-cheese', 'breakfast', 'Омлет с сыром', 'Воздушный омлет, свежая зелень и теплый хлеб.', 320, '260 г', '["завтрак"]', 'breakfast', '', true, 10),
  ('syrniki', 'breakfast', 'Сырники', 'Творожные сырники со сметаной и ягодным соусом.', 340, '240 г', '["сладкое"]', 'syrniki', '', true, 20),
  ('croissant-salmon', 'breakfast', 'Круассан с лососем', 'Хрустящий круассан, сливочный сыр, лосось и свежий огурец.', 430, '210 г', '["премиум"]', 'croissant', '', true, 30),
  ('raf-cardamom', 'drinks', 'Раф кардамон', 'Сливочный кофе с тонкой пряной нотой и бархатной пеной.', 260, '300 мл', '["хит"]', 'coffee', '', true, 10),
  ('mountain-tea', 'drinks', 'Горный чай', 'Душистый травяной сбор с медовым послевкусием.', 220, '450 мл', '["без кофеина"]', 'tea', '', true, 20),
  ('berry-lemonade', 'drinks', 'Ягодный лимонад', 'Смородина, мята, цитрус и много льда.', 280, '400 мл', '["холодный"]', 'lemonade', '', true, 30)
on conflict (slug) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  weight = excluded.weight,
  badges = excluded.badges,
  image = excluded.image,
  image_url = excluded.image_url,
  available = excluded.available,
  sort_order = excluded.sort_order;
