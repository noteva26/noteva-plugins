/**
 * 回复可见插件 v1.1.0
 * Hides content behind reply gate with polished locked/unlocked UI
 */
(function () {
  const PLUGIN_ID = 'hide-until-reply';
  let isProcessing = false;

  // i18n
  const I18N = {
    'zh-CN': { locked: '回复后可见', unlocked: '内容已解锁！', login: '请先登录', reply: '回复文章即可查看隐藏内容' },
    'zh-TW': { locked: '回覆後可見', unlocked: '內容已解鎖！', login: '請先登入', reply: '回覆文章即可查看隱藏內容' },
    'en': { locked: 'Reply to view', unlocked: 'Content unlocked!', login: 'Please log in first', reply: 'Reply to this post to reveal hidden content' },
  };

  function getLocale() {
    // Theme stores locale in localStorage via Zustand
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

  // SVG icons
  const ICON_LOCK = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
  const ICON_UNLOCK = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>';

  function waitForNoteva(callback) {
    if (typeof Noteva !== 'undefined') callback();
    else setTimeout(() => waitForNoteva(callback), 100);
  }

  waitForNoteva(function () {
    async function checkUnlocked(articleId) {
      const currentUser = await Noteva.user.check();
      if (!currentUser) return false;

      try {
        const comments = await Noteva.api.get(`/comments/${articleId}`);
        if (!comments.comments) return false;

        function hasUserComment(list) {
          for (const c of list) {
            if (c.user_id === currentUser.id) return true;
            if (c.replies && hasUserComment(c.replies)) return true;
          }
          return false;
        }
        return hasUserComment(comments.comments);
      } catch (e) {
        return false;
      }
    }

    function unlockContent(articleId) {
      const elements = document.querySelectorAll(`.noteva-hidden-content[data-article-id="${articleId}"]`);
      elements.forEach(el => {
        const template = el.querySelector('.noteva-hidden-template');
        if (!template) return;

        // Add unlock animation
        el.classList.add('hur-unlocking');

        setTimeout(() => {
          const revealed = document.createElement('div');
          revealed.className = 'hur-revealed';
          revealed.innerHTML = `
            <div class="hur-revealed-header">
              <span class="hur-revealed-icon">${ICON_UNLOCK}</span>
              <span class="hur-revealed-label">${t('unlocked')}</span>
            </div>
            <div class="hur-revealed-content">${template.innerHTML}</div>
          `;
          el.parentNode.replaceChild(revealed, el);

          // Trigger entrance animation
          requestAnimationFrame(() => revealed.classList.add('show'));
        }, 300);
      });
    }

    async function initHiddenContent() {
      if (isProcessing) return;

      const hiddenElements = document.querySelectorAll('.noteva-hidden-content[data-article-id]');
      if (hiddenElements.length === 0) return;

      isProcessing = true;

      // Enhance placeholder UI
      hiddenElements.forEach(el => {
        if (el.dataset.hurInit) return;
        el.dataset.hurInit = 'true';

        const placeholder = el.querySelector('.hide-until-reply-placeholder');
        if (placeholder && !placeholder.querySelector('.hur-placeholder')) {
          const settings = Noteva.plugins.getSettings(PLUGIN_ID);
          const text = settings.placeholder_text || t('locked');

          placeholder.innerHTML = `
            <div class="hur-placeholder">
              <div class="hur-placeholder-icon">${ICON_LOCK}</div>
              <div class="hur-placeholder-text">${text}</div>
              <div class="hur-placeholder-hint">${t('reply')}</div>
            </div>
          `;
        }
      });

      for (const el of hiddenElements) {
        const articleId = parseInt(el.dataset.articleId, 10);
        if (articleId) {
          const unlocked = await checkUnlocked(articleId);
          if (unlocked) unlockContent(articleId);
        }
      }

      isProcessing = false;
    }

    // Listen for comment creation
    Noteva.hooks.on('comment_after_create', async (data) => {
      if (data.articleId) {
        setTimeout(() => {
          unlockContent(data.articleId);
          if (Noteva.ui && Noteva.ui.toast) {
            Noteva.ui.toast(t('unlocked'), 'success');
          }
        }, 500);
      }
    });

    Noteva.hooks.on('content_render', () => setTimeout(initHiddenContent, 100));

    // MutationObserver fallback
    function startObserver() {
      if (!document.body) { setTimeout(startObserver, 100); return; }
      const observer = new MutationObserver(() => {
        if (document.querySelector('.noteva-hidden-content[data-article-id]:not([data-hur-init])')) {
          setTimeout(initHiddenContent, 100);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
    startObserver();

    Noteva.ready(() => {
      setTimeout(initHiddenContent, 500);
      setTimeout(initHiddenContent, 1500);
    });
  });
})();
