let openMenu = null;
let menuTrigger = null;

export function closeAdminMenu() {
  if (openMenu) openMenu.hidden = true;
  menuTrigger?.setAttribute('aria-expanded', 'false');
  openMenu = null;
  menuTrigger = null;
}

export function bindAdminActionMenus() {
  closeAdminMenu();
  document.querySelectorAll('[data-item-actions]').forEach((button) => {
    button.addEventListener('click', () => {
      const wasOpen = menuTrigger === button;
      closeAdminMenu();
      if (wasOpen) return;
      menuTrigger = button;
      openMenu = button.nextElementSibling;
      openMenu.hidden = false;
      button.setAttribute('aria-expanded', 'true');
      positionMenu();
      openMenu?.querySelector('button').focus({ preventScroll: true });
    });
  });
}

document.addEventListener('click', (event) => {
  if (!event.target.closest('.admin-item-actions')) closeAdminMenu();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && openMenu) {
    menuTrigger?.focus();
    closeAdminMenu();
  }
});
window.addEventListener('resize', closeAdminMenu);
function positionMenu() {
  if (!openMenu || !menuTrigger) return;
  const anchor = menuTrigger.getBoundingClientRect();
  if (anchor.bottom < 0 || anchor.top > window.innerHeight) return closeAdminMenu();
  const menu = openMenu.getBoundingClientRect();
  openMenu.style.left = `${Math.max(12, Math.min(anchor.right - menu.width, window.innerWidth - menu.width - 12))}px`;
  openMenu.style.top = `${Math.max(12, anchor.bottom + menu.height + 12 <= window.innerHeight ? anchor.bottom + 4 : anchor.top - menu.height - 4)}px`;
}
window.addEventListener('scroll', positionMenu, true);

export function confirmDeletion(count = 1) {
  closeAdminMenu();
  const previousFocus = document.activeElement;
  const dialog = document.createElement('dialog');
  dialog.className = 'admin-confirm';
  dialog.setAttribute('aria-labelledby', 'admin-confirm-title');
  dialog.innerHTML = `
    <form method="dialog">
      <h2 id="admin-confirm-title">${count === 1 ? 'Удалить эту позицию?' : `Удалить выбранные позиции (${count})?`}</h2>
      <div class="admin-confirm__buttons">
        <button value="cancel" autofocus>Отмена</button>
        <button value="delete" class="danger-button">Удалить</button>
      </div>
    </form>`;
  document.body.append(dialog);
  dialog.showModal();
  return new Promise((resolve) => {
    dialog.addEventListener('close', () => {
      const confirmed = dialog.returnValue === 'delete';
      dialog.remove();
      previousFocus?.focus();
      resolve(confirmed);
    }, { once: true });
  });
}
