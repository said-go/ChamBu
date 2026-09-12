import assert from 'node:assert/strict';
import test from 'node:test';
import { createStore } from '../src/state/store.js';
import { fallbackCatalog } from '../src/state/fallback.js';

globalThis.window = { location: { hostname: 'localhost', protocol: 'http:' } };
globalThis.localStorage = { getItem: () => null };
globalThis.document = { baseURI: 'http://localhost/' };
const { renderMenu } = await import('../src/views/menu.js');

test('empty item cannot open a modal on load or after closing a valid item', async () => {
  const valid = fallbackCatalog.items[0];
  const empty = { id: '', name: '', price: 0 };
  const store = createStore({
    api: { menu: async () => ({ ...fallbackCatalog, items: [valid, empty, null, {}] }) },
    onChange() {},
  });
  await store.loadCatalog();
  assert.deepEqual(store.snapshot().catalog.items, [valid]);
  assert.doesNotMatch(renderMenu(store.snapshot()), /data-item-modal/);

  // Check the view guard even when an unfiltered catalog reaches the renderer.
  const rawState = store.snapshot();
  rawState.catalog = { ...fallbackCatalog, items: [valid, empty] };
  assert.doesNotMatch(renderMenu(rawState), /data-item-modal/);

  store.openItem('');
  store.openItem('missing');
  assert.equal(store.snapshot().selectedItemId, '');
  store.openItem(valid.id);
  assert.match(renderMenu(store.snapshot()), /data-item-modal/);
  store.closeItem();
  assert.doesNotMatch(renderMenu(store.snapshot()), /data-item-modal/);
});
