(function () {
  'use strict';
  const PLUGIN_ID = 'profile';

  const I18N = {
    'zh-CN': { skills: '技能', yourName: 'Your Name' },
    'zh-TW': { skills: '技能', yourName: 'Your Name' },
    'en': { skills: 'Skills', yourName: 'Your Name' },
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

  // SVG social icons
  const SOCIAL_ICONS = {
    email: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>',
    github: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .3a12 12 0 00-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.5-1.4-1.3-1.8-1.3-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 016 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.3 2.9.1 3.2.8.8 1.2 1.9 1.2 3.1 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0012 .3z"/></svg>',
    twitter: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    website: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>',
    linkedin: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"/></svg>',
    location: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  };

  function getCurrentSlug() {
    const match = window.location.pathname.match(/\/([^\/]+)\/?$/);
    return match ? match[1] : '';
  }

  function renderProfile(settings) {
    const { avatar, name, title, bio, location, email, github, twitter, website, linkedin, skills_data, show_skills } = settings;

    let skills = [];
    if (Array.isArray(skills_data)) {
      skills = skills_data.map(item => typeof item === 'string' ? item : item?.skill || '').filter(Boolean);
    }

    const socialLinks = [];
    if (email) socialLinks.push({ icon: SOCIAL_ICONS.email, url: `mailto:${email}`, label: 'Email' });
    if (github) socialLinks.push({ icon: SOCIAL_ICONS.github, url: `https://github.com/${github}`, label: 'GitHub' });
    if (twitter) socialLinks.push({ icon: SOCIAL_ICONS.twitter, url: `https://twitter.com/${twitter}`, label: 'X' });
    if (website) socialLinks.push({ icon: SOCIAL_ICONS.website, url: website, label: 'Website' });
    if (linkedin) socialLinks.push({ icon: SOCIAL_ICONS.linkedin, url: `https://linkedin.com/in/${linkedin}`, label: 'LinkedIn' });

    let html = `<div class="pf-container">
      <div class="pf-header">
        ${avatar ? `<div class="pf-avatar"><img src="${avatar}" alt="${name || ''}"></div>` : ''}
        <div class="pf-info">
          <h1 class="pf-name">${name || t('yourName')}</h1>
          ${title ? `<p class="pf-title">${title}</p>` : ''}
          ${location ? `<p class="pf-location">${SOCIAL_ICONS.location} ${location}</p>` : ''}
        </div>
      </div>
      ${bio ? `<div class="pf-bio"><p>${bio.replace(/\n/g, '<br>')}</p></div>` : ''}
      ${socialLinks.length ? `<div class="pf-social">
        ${socialLinks.map(l => `<a href="${l.url}" target="_blank" rel="noopener noreferrer" class="pf-social-link">
          <span class="pf-social-icon">${l.icon}</span>
          <span class="pf-social-label">${l.label}</span>
        </a>`).join('')}
      </div>` : ''}`;

    if (show_skills && skills.length > 0) {
      html += `<div class="pf-skills">
        <h2 class="pf-skills-title">${t('skills')}</h2>
        <div class="pf-skills-tags">${skills.map(s => `<span class="pf-skill">${s}</span>`).join('')}</div>
      </div>`;
    }

    return html + '</div>';
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

      const targetSlug = settings.target_slug || 'about';
      if (getCurrentSlug() !== targetSlug) return;

      const tryRender = () => {
        const el = document.querySelector('.page-content, .prose, article, main');
        if (!el || el.querySelector('.pf-container')) return;
        while (el.firstChild) el.removeChild(el.firstChild);
        const wrapper = document.createElement('div');
        wrapper.innerHTML = renderProfile(settings);
        el.appendChild(wrapper);
      };
      setTimeout(tryRender, 100);
    } catch (e) {
      console.error('[Profile]', e);
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
