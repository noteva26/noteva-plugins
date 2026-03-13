(function () {
  'use strict';
  const PLUGIN_ID = 'friendlinks';

  const I18N = {
    'zh-CN': { title: '友情链接', uncategorized: '未分类', empty: '暂无友链，请在插件设置中添加。' },
    'zh-TW': { title: '友情連結', uncategorized: '未分類', empty: '暫無友連，請在插件設定中新增。' },
    'en': { title: 'Friend Links', uncategorized: 'Uncategorized', empty: 'No links yet. Add them in plugin settings.' },
  };

  function getLocale() {
    try {
      const stored = JSON.parse(localStorage.getItem('noteva-locale') || '{}');
      if (stored.state?.locale) return stored.state.locale;
    } catch (e) { }
    if (typeof Noteva !== 'undefined' && Noteva.i18n) return Noteva.i18n.getLocale();
    return 'zh-CN';
  }

  function t(key) {
    const locale = getLocale();
    const lang = locale.split('-')[0];
    const msgs = I18N[locale] || I18N[lang] || I18N['zh-CN'];
    return msgs[key] || key;
  }

  const ICON_LINK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>';

  function getCurrentSlug() {
    const match = window.location.pathname.match(/\/([^\/]+)\/?$/);
    return match ? match[1] : '';
  }

  function renderFriendlinks(settings) {
    const { title, description, links_data, layout, columns, show_logo, show_description } = settings;
    const links = Array.isArray(links_data) ? links_data : [];

    const categories = {};
    links.forEach(link => {
      const cat = link.category || t('uncategorized');
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(link);
    });

    let html = `<div class="fl-container">
      <h1 class="fl-title">${title || t('title')}</h1>
      ${description ? `<p class="fl-desc">${description}</p>` : ''}`;

    if (links.length === 0) {
      html += `<div class="fl-empty"><p>${t('empty')}</p></div>`;
    } else {
      Object.keys(categories).forEach(cat => {
        html += `<div class="fl-category">
          ${Object.keys(categories).length > 1 ? `<h2 class="fl-cat-title">${cat}</h2>` : ''}
          <div class="fl-${layout || 'grid'}" style="${layout === 'grid' ? `grid-template-columns: repeat(${columns || 3}, 1fr);` : ''}">`;

        categories[cat].forEach(link => {
          html += `<a href="${link.url}" target="_blank" rel="noopener noreferrer" class="fl-card">
            ${show_logo && link.logo ? `<div class="fl-logo"><img src="${link.logo}" alt="${link.name}" onerror="this.style.display='none'"></div>` : ''}
            <div class="fl-info">
              <h3 class="fl-name">${link.name}<span class="fl-ext">${ICON_LINK}</span></h3>
              ${show_description && link.description ? `<p class="fl-link-desc">${link.description}</p>` : ''}
            </div>
          </a>`;
        });

        html += '</div></div>';
      });
    }

    html += '</div>';
    return html;
  }

  async function init() {
    try {
      let settings;
      if (typeof Noteva !== 'undefined' && Noteva.plugins) {
        settings = Noteva.plugins.getSettings(PLUGIN_ID);
      }
      if (!settings || Object.keys(settings).length === 0) {
        const response = await fetch('/api/v1/plugins/enabled');
        const plugins = await response.json();
        const plugin = plugins.find(p => p.id === PLUGIN_ID);
        if (!plugin || !plugin.settings) return;
        settings = plugin.settings;
      }

      const targetSlug = settings.target_slug || 'friendlinks';
      if (getCurrentSlug() !== targetSlug) return;

      const tryRender = () => {
        const el = document.querySelector('.page-content, .prose, article, main');
        if (!el || el.querySelector('.fl-container')) return;
        while (el.firstChild) el.removeChild(el.firstChild);
        const wrapper = document.createElement('div');
        wrapper.innerHTML = renderFriendlinks(settings);
        el.appendChild(wrapper);
      };
      setTimeout(tryRender, 100);
    } catch (e) {
      console.error('[Friendlinks]', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 200));
  } else {
    setTimeout(init, 200);
  }

  function registerHook() {
    if (typeof Noteva !== 'undefined' && Noteva.hooks) {
      Noteva.hooks.on('content_render', () => setTimeout(init, 100));
    } else {
      setTimeout(registerHook, 200);
    }
  }
  registerHook();

  let lastPath = window.location.pathname;
  const obs = new MutationObserver(() => {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      setTimeout(init, 200);
    }
  });
  if (document.body) obs.observe(document.body, { childList: true, subtree: true });
})();
