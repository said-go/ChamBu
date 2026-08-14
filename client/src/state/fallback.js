export const fallbackCatalog = {
  brand: {
    name: 'ЧамБу',
    subtitle: 'Блины, завтраки и напитки в Грозном',
    description: 'Теплое меню для быстрых завтраков, спокойных встреч и сладких пауз.',
    phone: '+7 938 994-88-00',
    address: 'Грозный, ул. Хамзата Орзамиева, 30/30А',
    hours: 'Ежедневно 08:00-22:00',
    highlights: ['с собой', 'завтраки весь день', 'свежая выпечка'],
  },
  categories: [
    { id: 'pancakes', name: 'Блины', description: 'Сладкие и сытные блины.' },
    { id: 'breakfast', name: 'Завтраки', description: 'Сытное начало дня.' },
    { id: 'drinks', name: 'Напитки', description: 'Кофе, чай и лимонады.' },
  ],
  items: [
    { id: 'pancake-honey', categoryId: 'pancakes', name: 'Блин с медом', description: 'Тонкий румяный блин со сливочным маслом и горным медом.', price: 190, weight: '180 г', badges: ['нежный'], image: 'pancake-folded', imageUrl: '/assets/dishes/blini-folded.jpg', available: true },
    { id: 'pancake-chicken', categoryId: 'pancakes', name: 'Блин с курицей', description: 'Сытная начинка из курицы, сыра и зелени.', price: 290, weight: '240 г', badges: ['сытно'], image: 'pancake-stack', imageUrl: '/assets/dishes/blini-stack.jpg', available: true },
    { id: 'syrniki', categoryId: 'breakfast', name: 'Сырники', description: 'Творожные сырники со сметаной и ягодным соусом.', price: 340, weight: '240 г', badges: ['сладкое'], image: 'pancake-berries', imageUrl: '/assets/dishes/blini-berries.jpg', available: true },
    { id: 'raf-cardamom', categoryId: 'drinks', name: 'Раф кардамон', description: 'Сливочный кофе с тонкой пряной нотой.', price: 260, weight: '300 мл', badges: ['хит'], image: 'citrus', imageUrl: '/assets/dishes/citrus.jpg', available: true },
  ],
};
