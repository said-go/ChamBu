import assert from 'node:assert/strict';
import test from 'node:test';
import { createStore } from '../src/state/store.js';
import { fallbackCatalog } from '../src/state/fallback.js';

globalThis.window = { location: { hostname: 'localhost', protocol: 'http:', hash: '#admin' } };
globalThis.localStorage = { getItem: () => null };
globalThis.document = { baseURI: 'http://localhost/' };
const { renderAdmin } = await import('../src/views/admin.js');

test('unified overview includes every item, editing, selection and no old navigation', () => {
  const state = { catalog: fallbackCatalog, adminToken: 'test', activeCategory: 'all', query: '', adminSelected: new Set() };
  const html = renderAdmin(state);
  assert.equal((html.match(/data-item-actions /g) || []).length, fallbackCatalog.items.length);
  assert.equal((html.match(/data-edit-item=/g) || []).length, fallbackCatalog.items.length);
  assert.equal((html.match(/data-select-item=/g) || []).length, fallbackCatalog.items.length);
  assert.doesNotMatch(html, /data-route="admin\/(items|showcase)"/);
  assert.doesNotMatch(html, /class="admin-more"[^>]*data-delete-item/);
});

test('failed save reports failure and keeps the catalog', async () => {
  const store = createStore({ api: { saveItem: async () => { throw new Error('Unavailable'); } }, onChange() {} });
  assert.equal(await store.saveItem({ id: 'test' }), false);
  assert.equal(store.snapshot().saving, false);
  assert.equal(store.snapshot().notice, 'Unavailable');
  assert.deepEqual(store.snapshot().catalog.items, fallbackCatalog.items);
});

test('save refreshes data; deleting an item removes its selection', async () => {
  const changed = { ...fallbackCatalog.items[0], name: 'Updated', available: false };
  const store = createStore({ api: {
    saveItem: async () => {}, deleteItem: async () => {},
    menu: async () => ({ ...fallbackCatalog, items: [changed] }),
  }, onChange() {} });
  assert.equal(await store.saveItem(changed), true);
  assert.deepEqual(store.snapshot().catalog.items, [changed]);
  store.toggleAdminSelection(changed.id);
  await store.deleteItem(changed.id);
  assert.equal(store.snapshot().adminSelected.size, 0);
});
