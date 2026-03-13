/**
 * 视频嵌入插件 v1.1.0
 * Auto-embed YouTube, Bilibili, Twitter/X videos from URLs
 */
(function () {
  'use strict';

  const PLUGIN_ID = 'video-embed';

  // i18n
  const I18N = {
    'zh-CN': { loading: '正在加载视频…', error: '无法加载视频', viewOriginal: '查看原始链接', unsupported: '您的浏览器不支持视频播放' },
    'zh-TW': { loading: '正在載入影片…', error: '無法載入影片', viewOriginal: '查看原始連結', unsupported: '您的瀏覽器不支援影片播放' },
    'en': { loading: 'Loading video…', error: 'Failed to load video', viewOriginal: 'View original link', unsupported: 'Your browser does not support video playback' },
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

  // SVG platform icons
  const PLATFORM_ICONS = {
    youtube: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2 31.5 31.5 0 000 12a31.5 31.5 0 00.5 5.8 3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1c.4-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z"/></svg>',
    bilibili: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.8 2.8L16 5H8L6.2 2.8a1 1 0 00-1.5 1.4L6.3 6H4a3 3 0 00-3 3v9a3 3 0 003 3h16a3 3 0 003-3V9a3 3 0 00-3-3h-2.3l1.6-1.8a1 1 0 10-1.5-1.4zM9 11a1 1 0 110 4 1 1 0 010-4zm6 0a1 1 0 110 4 1 1 0 010-4z"/></svg>',
    twitter: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
  };

  const DEFAULT_SETTINGS = {
    enable_youtube: true,
    enable_bilibili: true,
    enable_twitter: true,
    video_width: '100%',
    video_height: '450',
    border_radius: '12',
    show_platform_badge: true,
    auto_replace_links: true,
    preserve_original_link: false,
    lazy_load: true,
  };

  let settings = { ...DEFAULT_SETTINGS };

  const platforms = {
    youtube: {
      name: 'YouTube',
      color: '#FF0000',
      regex: /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i,
      getEmbedUrl: (id) => `https://www.youtube.com/embed/${id}`,
      enabled: () => settings.enable_youtube,
    },
    bilibili: {
      name: 'Bilibili',
      color: '#00A1D6',
      regex: /(?:https?:\/\/)?(?:www\.)?bilibili\.com\/video\/((?:BV|av)[a-zA-Z0-9]+)/i,
      getEmbedUrl: (id) => id.startsWith('av')
        ? `//player.bilibili.com/player.html?aid=${id.substring(2)}`
        : `//player.bilibili.com/player.html?bvid=${id}`,
      enabled: () => settings.enable_bilibili,
    },
    twitter: {
      name: 'X',
      color: '#000',
      regex: /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/i,
      getEmbedUrl: null,
      enabled: () => settings.enable_twitter,
    },
  };

  function createVideoPlayer(platform, videoId, originalUrl) {
    const { video_width: width, video_height: height, border_radius: radius, show_platform_badge: showBadge, preserve_original_link: preserveLink, lazy_load: lazyLoad } = settings;
    const cfg = platforms[platform];

    let html = `<div class="ve-container" data-platform="${platform}">`;

    if (showBadge) {
      html += `<div class="ve-badge" style="--ve-badge-color: ${cfg.color}">
        <span class="ve-badge-icon">${PLATFORM_ICONS[platform] || ''}</span>
        <span class="ve-badge-text">${cfg.name}</span>
      </div>`;
    }

    html += `<div class="ve-wrapper" style="width: ${width}; max-width: 100%;">`;

    if (platform === 'twitter') {
      html += `<div class="ve-loading" data-tweet-id="${videoId}">
        <div class="ve-spinner"></div>
        <p>${t('loading')}</p>
      </div>`;
    } else {
      const embedUrl = cfg.getEmbedUrl(videoId);
      html += `<div class="ve-player" style="border-radius: ${radius}px;">
        <iframe src="${embedUrl}" width="100%" height="${height}" frameborder="0" allowfullscreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          ${lazyLoad ? 'loading="lazy"' : ''}></iframe>
      </div>`;
    }

    if (preserveLink) {
      html += `<div class="ve-link">
        <a href="${originalUrl}" target="_blank" rel="noopener noreferrer">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          ${t('viewOriginal')}
        </a>
      </div>`;
    }

    html += '</div></div>';
    return html;
  }

  async function loadTwitterVideo(tweetId, container) {
    try {
      const response = await fetch(`https://api.vxtwitter.com/i/status/${tweetId}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();

      if (!data.media_extended || data.media_extended.length === 0) throw new Error('No media');
      const video = data.media_extended.find(m => m.type === 'video' || m.type === 'gif');
      if (!video || !video.url) throw new Error('No video');

      const radius = settings.border_radius;
      container.innerHTML = `
        <div class="ve-player" style="border-radius: ${radius}px;">
          <video controls width="100%" style="display:block; background:#000;" poster="${video.thumbnail_url || ''}">
            <source src="${video.url}" type="video/mp4">
            ${t('unsupported')}
          </video>
          ${data.text ? `<div class="ve-caption"><p>${escapeHtml(data.text)}</p><small>— @${data.user_screen_name}</small></div>` : ''}
        </div>`;
    } catch (error) {
      container.innerHTML = `<div class="ve-error"><p>${t('error')}</p><small>${error.message}</small></div>`;
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function processVideoLinks() {
    if (!settings.auto_replace_links) return;

    const contentSelectors = ['.post-content', '.prose', '.article-content', 'article .content', 'main article', '.markdown-body', '.content', 'article'];
    let contentEl = null;
    for (const sel of contentSelectors) {
      contentEl = document.querySelector(sel);
      if (contentEl) break;
    }
    if (!contentEl) return;

    // Process <a> tags
    contentEl.querySelectorAll('a[href]').forEach(link => {
      processUrl(link.href, link, link.parentElement);
    });

    // Process plain-text URLs in paragraphs
    contentEl.querySelectorAll('p').forEach(p => {
      if (p.querySelector('.ve-container')) return;
      const text = p.textContent.trim();

      for (const [key, cfg] of Object.entries(platforms)) {
        if (!cfg.enabled()) continue;
        const match = text.match(cfg.regex);
        if (match && match[1]) {
          const cleanText = text.replace(/\s+/g, '');
          const cleanUrl = match[0].replace(/\s+/g, '');
          if (text === match[0] || cleanText === cleanUrl || text.startsWith('http')) {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = createVideoPlayer(key, match[1], match[0]);
            p.replaceWith(wrapper.firstElementChild);
            if (key === 'twitter') {
              const loadingEl = wrapper.querySelector('.ve-loading');
              if (loadingEl) loadTwitterVideo(match[1], loadingEl);
            }
            break;
          }
        }
      }
    });
  }

  function processUrl(url, element, parent) {
    for (const [key, cfg] of Object.entries(platforms)) {
      if (!cfg.enabled()) continue;
      const match = url.match(cfg.regex);
      if (match && match[1]) {
        const isStandalone = parent && parent.tagName === 'P' && parent.textContent.trim() === element.textContent.trim();
        if (isStandalone || element.textContent === url || element.textContent.includes(match[1])) {
          const wrapper = document.createElement('div');
          wrapper.innerHTML = createVideoPlayer(key, match[1], url);
          if (parent && parent.tagName === 'P') parent.replaceWith(wrapper.firstElementChild);
          else element.replaceWith(wrapper.firstElementChild);
          if (key === 'twitter') {
            const loadingEl = wrapper.querySelector('.ve-loading');
            if (loadingEl) loadTwitterVideo(match[1], loadingEl);
          }
          break;
        }
      }
    }
  }

  function processContent() {
    const isArticle = window.location.pathname.includes('/posts/') || document.querySelector('article');
    if (!isArticle) return;
    const el = document.querySelector('.post-content, .prose, .article-content');
    if (!el || el.children.length === 0) return;
    if (el.getAttribute('data-ve-done') === window.location.pathname) return;
    processVideoLinks();
    el.setAttribute('data-ve-done', window.location.pathname);
  }

  async function init() {
    const registerHook = () => {
      if (window.Noteva && window.Noteva.hooks) {
        // Load settings from SDK
        const pluginSettings = Noteva.plugins.getSettings(PLUGIN_ID);
        if (pluginSettings && Object.keys(pluginSettings).length > 0) {
          settings = { ...DEFAULT_SETTINGS, ...pluginSettings };
        }

        Noteva.hooks.on('content_render', () => {
          document.querySelectorAll('[data-ve-done]').forEach(el => el.removeAttribute('data-ve-done'));
          processContent();
        });
      } else {
        setTimeout(registerHook, 100);
      }
    };
    registerHook();

    // Initial load
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(processContent, 100);
    } else {
      document.addEventListener('DOMContentLoaded', () => setTimeout(processContent, 100));
    }

    // MutationObserver for SPA
    let lastPath = window.location.pathname;
    const observer = new MutationObserver(() => {
      if (window.location.pathname !== lastPath) {
        lastPath = window.location.pathname;
        document.querySelectorAll('[data-ve-done]').forEach(el => el.removeAttribute('data-ve-done'));
      }
      const el = document.querySelector('.post-content, .prose, .article-content');
      if (el && el.children.length > 0 && el.getAttribute('data-ve-done') !== window.location.pathname) {
        processContent();
      }
    });

    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
    else document.addEventListener('DOMContentLoaded', () => observer.observe(document.body, { childList: true, subtree: true }));
  }

  init();
})();
