/* Carga cada sección desde /sections dentro del index, sin abrir otras páginas. */
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const CFG = window.SITE_CONFIG || {};

  /* ---------- 1. Cargar secciones ---------- */
  async function loadSections() {
    const slots = $$('[data-include]');
    try {
      await Promise.all(slots.map(async (el) => {
        const res = await fetch(el.dataset.include);
        if (!res.ok) throw new Error(el.dataset.include);
        el.innerHTML = await res.text();
      }));
      return true;
    } catch (err) {
      const box = document.createElement('div');
      box.className = 'load-error';
      box.innerHTML = '<p>No se pudieron cargar las secciones. Abre el sitio con un servidor local ' +
        '(por ejemplo, la extensión Live Server de VS Code) en lugar de abrir el archivo directamente.</p>';
      document.body.appendChild(box);
      return false;
    }
  }

  /* ---------- 2. Menú ---------- */
  function initNav() {
    const toggle = $('.nav-toggle');
    const menu = $('#menu');
    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    $$('a', menu).forEach((a) => a.addEventListener('click', () => {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }));

    // Resalta el enlace de la sección que se está viendo
    const links = new Map($$('a', menu).map((a) => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => a.classList.remove('active'));
        const link = links.get(e.target.id);
        if (link) link.classList.add('active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach((s) => io.observe(s));
  }

  /* ---------- 3. Carrusel de herramientas ---------- */
  function initTools() {
    const track = $('.marquee-track');
    if (!track) return;
    // Duplica los elementos para que el bucle no tenga saltos
    [...track.children].forEach((li) => {
      const copy = li.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      track.appendChild(copy);
    });
  }

  /* ---------- 4. Proyecto Sonlich ---------- */
  function initProject() {
    const urlInput = $('#sl-url');
    if (!urlInput) return;
    const openBtn = $('#sl-open');
    const status = $('#sl-status');
    const list = $('#sl-accounts');
    const addBtn = $('#sl-add');
    const KEY = 'hanna.sonlich';

    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { saved = {}; }
    let cuentas = saved.cuentas || (CFG.cuentas || []).map((c) => ({ ...c }));
    let url = saved.url || CFG.sonlichUrl || '';

    const persist = () => {
      try { localStorage.setItem(KEY, JSON.stringify({ url, cuentas })); } catch (e) { /* sin almacenamiento */ }
    };

    function isValidUrl(value) {
      try { const u = new URL(value); return u.protocol === 'https:' || u.protocol === 'http:'; }
      catch (e) { return false; }
    }

    function renderUrl() {
      const ok = isValidUrl(url);
      openBtn.href = ok ? url : '#';
      openBtn.setAttribute('aria-disabled', String(!ok));
      status.textContent = ok || !url ? '' : 'Escribe una URL completa, por ejemplo https://mi-proyecto.vercel.app';
    }

    function renderAccounts() {
      list.innerHTML = '';
      cuentas.forEach((c, i) => {
        const row = document.createElement('div');
        row.className = 'account';
        [['rol', 'Rol'], ['usuario', 'Usuario'], ['clave', 'Contraseña']].forEach(([field, label]) => {
          const input = document.createElement('input');
          input.type = 'text';
          input.value = c[field] || '';
          input.setAttribute('aria-label', label);
          input.placeholder = label;
          input.addEventListener('input', () => { cuentas[i][field] = input.value; persist(); });
          row.appendChild(input);
        });
        const del = document.createElement('button');
        del.type = 'button';
        del.textContent = '×';
        del.setAttribute('aria-label', 'Quitar cuenta');
        del.addEventListener('click', () => { cuentas.splice(i, 1); persist(); renderAccounts(); });
        row.appendChild(del);
        list.appendChild(row);
      });
    }

    urlInput.value = url;
    urlInput.addEventListener('input', () => { url = urlInput.value.trim(); persist(); renderUrl(); });
    addBtn.addEventListener('click', () => {
      cuentas.push({ rol: '', usuario: '', clave: '' });
      persist();
      renderAccounts();
      const inputs = $$('.account input', list);
      inputs[inputs.length - 3].focus();
    });

    renderUrl();
    renderAccounts();
  }

  /* ---------- 5. Contacto ---------- */
  function initContact() {
    const form = $('#contact-form');
    if (!form) return;
    const mail = CFG.correo;
    if (mail) {
      const link = $('[data-mail]');
      if (link) { link.href = 'mailto:' + mail; link.lastChild.textContent = mail; }
    }
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = new FormData(form);
      const subject = encodeURIComponent('Mensaje desde tu portafolio – ' + d.get('nombre'));
      const body = encodeURIComponent(d.get('mensaje') + '\n\n' + d.get('nombre') + '\n' + d.get('correo'));
      window.location.href = 'mailto:' + (mail || '') + '?subject=' + subject + '&body=' + body;
    });
  }

  /* ---------- Arranque ---------- */
  document.addEventListener('DOMContentLoaded', async () => {
    const ok = await loadSections();
    initNav();
    if (!ok) return;
    initTools();
    initProject();
    initContact();
    // Las secciones llegaron después de la carga: si la URL trae #blog, baja hasta ahí
    if (location.hash) {
      const target = document.getElementById(location.hash.slice(1));
      if (target) target.scrollIntoView();
    }
  });
})();
