// router.js — navigasi berbasis hash (#/masalah). Cocok untuk GitHub Pages (statis).

const routes = {}; // id -> render(container)
let current = null;
let afterRender = null;

export const Router = {
  register(id, renderFn) { routes[id] = renderFn; },
  onAfterRender(fn) { afterRender = fn; },

  go(id) {
    if (location.hash !== '#/' + id) { location.hash = '#/' + id; }
    else { this._render(id); } // hash sama → paksa render ulang
  },

  current() { return current; },

  _render(id) {
    const container = document.getElementById('vm-main');
    if (!container || !routes[id]) return;
    current = id;
    container.innerHTML = '';
    const view = routes[id](container);
    if (view instanceof Node) container.appendChild(view);
    container.scrollTop = 0;
    if (afterRender) afterRender(id);
  },

  start(defaultId) {
    const handle = () => {
      const id = (location.hash.replace('#/', '') || defaultId);
      this._render(routes[id] ? id : defaultId);
    };
    window.addEventListener('hashchange', handle);
    handle();
  },
};
