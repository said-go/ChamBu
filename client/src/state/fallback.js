export const fallbackCatalog = {
  brand: {
    name: 'ЧамБу',
    subtitle: 'Кофе, завтраки и десерты в Грозном',
    description: 'Теплое меню для быстрых завтраков, спокойных встреч и сладких пауз.',
    phone: '+7 938 994-88-00',
    address: 'Грозный, ул. Хамзата Орзамиева, 30/30А',
    hours: 'Ежедневно 08:00-22:00',
    highlights: ['с собой', 'завтраки весь день', 'свежая выпечка'],
  },
  categories: [
    { id: 'coffee', name: 'Кофе', description: 'Классика и авторские напитки.' },
    { id: 'tea', name: 'Чай и лимонады', description: 'Горячие и холодные напитки.' },
    { id: 'breakfast', name: 'Завтраки', description: 'Сытное начало дня.' },
    { id: 'desserts', name: 'Десерты', description: 'Сладости к кофе.' },
  ],
  items: [
    { id: 'raf-cardamom', categoryId: 'coffee', name: 'Раф кардамон', description: 'Сливочный кофе с тонкой пряной нотой.', price: 260, weight: '300 мл', badges: ['хит'], image: 'coffee', available: true },
    { id: 'mountain-tea', categoryId: 'tea', name: 'Горный чай', description: 'Душистый травяной сбор.', price: 220, weight: '450 мл', badges: ['без кофеина'], image: 'tea', available: true },
    { id: 'croissant-salmon', categoryId: 'breakfast', name: 'Круассан с лососем', description: 'Сливочный сыр, лосось и свежий огурец.', price: 430, weight: '210 г', badges: ['премиум'], image: 'croissant', available: true },
    { id: 'tiramisu', categoryId: 'desserts', name: 'Тирамису', description: 'Кофейный десерт с маскарпоне.', price: 320, weight: '150 г', badges: ['к кофе'], image: 'tiramisu', available: true },
  ],
};
