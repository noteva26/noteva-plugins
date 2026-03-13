/**
 * 媒体播放器插件 v1.1.0
 * Enhanced video/audio playback with HLS streaming + custom audio UI
 */
(function () {
  let hlsLoaded = false;
  let hlsLoading = false;

  function loadHls(callback) {
    if (hlsLoaded) return callback();
    if (hlsLoading) {
      const check = setInterval(() => {
        if (hlsLoaded) { clearInterval(check); callback(); }
      }, 100);
      return;
    }
    hlsLoading = true;
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest/dist/hls.min.js';
    script.onload = () => { hlsLoaded = true; hlsLoading = false; callback(); };
    script.onerror = () => { hlsLoading = false; console.warn('[media-player] Failed to load HLS.js'); };
    document.head.appendChild(script);
  }

  function initHlsElements() {
    const elements = document.querySelectorAll('[data-hls="true"]:not([data-hls-init])');
    if (elements.length === 0) return;

    loadHls(() => {
      if (typeof Hls === 'undefined' || !Hls.isSupported()) return;
      elements.forEach(el => {
        el.setAttribute('data-hls-init', 'true');
        const src = el.getAttribute('src');
        if (!src) return;
        const hls = new Hls();
        hls.loadSource(src);
        hls.attachMedia(el);
      });
    });
  }

  // Enhance native video elements
  function enhanceVideos() {
    document.querySelectorAll('.shortcode-video:not([data-mp-init])').forEach(wrap => {
      wrap.setAttribute('data-mp-init', 'true');
      const video = wrap.querySelector('video');
      if (!video) return;

      // Add loading overlay
      const loading = document.createElement('div');
      loading.className = 'mp-loading';
      loading.innerHTML = '<div class="mp-spinner"></div>';
      wrap.appendChild(loading);

      video.addEventListener('waiting', () => loading.classList.add('show'));
      video.addEventListener('playing', () => loading.classList.remove('show'));
      video.addEventListener('canplay', () => loading.classList.remove('show'));
    });
  }

  // Enhance native audio elements with custom UI
  function enhanceAudios() {
    document.querySelectorAll('.shortcode-audio:not([data-mp-init])').forEach(wrap => {
      wrap.setAttribute('data-mp-init', 'true');
      const audio = wrap.querySelector('audio');
      if (!audio) return;

      // Hide native controls
      audio.removeAttribute('controls');
      audio.style.display = 'none';

      // Get title
      const titleEl = wrap.querySelector('.shortcode-audio-title');
      const title = titleEl ? titleEl.textContent : '';

      // Build custom UI
      const player = document.createElement('div');
      player.className = 'mp-audio-player';
      player.innerHTML = `
        <button class="mp-audio-btn mp-audio-play" aria-label="Play">
          <svg class="mp-icon-play" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          <svg class="mp-icon-pause" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        </button>
        ${title ? `<div class="mp-audio-title">${title}</div>` : ''}
        <div class="mp-audio-progress">
          <div class="mp-audio-progress-fill"></div>
          <div class="mp-audio-progress-thumb"></div>
        </div>
        <div class="mp-audio-time">0:00</div>
      `;

      // Remove old title element
      if (titleEl) titleEl.remove();

      wrap.appendChild(player);

      // Elements
      const btnPlay = player.querySelector('.mp-audio-play');
      const iconPlay = player.querySelector('.mp-icon-play');
      const iconPause = player.querySelector('.mp-icon-pause');
      const progressBar = player.querySelector('.mp-audio-progress');
      const progressFill = player.querySelector('.mp-audio-progress-fill');
      const progressThumb = player.querySelector('.mp-audio-progress-thumb');
      const timeDisplay = player.querySelector('.mp-audio-time');

      function formatTime(sec) {
        if (!sec || isNaN(sec)) return '0:00';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
      }

      btnPlay.onclick = () => {
        if (audio.paused) {
          audio.play().catch(() => { });
        } else {
          audio.pause();
        }
      };

      audio.onplay = () => {
        iconPlay.style.display = 'none';
        iconPause.style.display = '';
        btnPlay.classList.add('playing');
      };

      audio.onpause = () => {
        iconPlay.style.display = '';
        iconPause.style.display = 'none';
        btnPlay.classList.remove('playing');
      };

      audio.ontimeupdate = () => {
        if (!audio.duration) return;
        const pct = (audio.currentTime / audio.duration) * 100;
        progressFill.style.width = pct + '%';
        progressThumb.style.left = pct + '%';
        timeDisplay.textContent = formatTime(audio.currentTime) + ' / ' + formatTime(audio.duration);
      };

      audio.onloadedmetadata = () => {
        timeDisplay.textContent = '0:00 / ' + formatTime(audio.duration);
      };

      // Seekable progress bar
      function seekTo(e) {
        const rect = progressBar.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        if (audio.duration) audio.currentTime = pct * audio.duration;
      }

      let dragging = false;
      progressBar.addEventListener('mousedown', (e) => { dragging = true; seekTo(e); });
      document.addEventListener('mousemove', (e) => { if (dragging) seekTo(e); });
      document.addEventListener('mouseup', () => { dragging = false; });
      progressBar.addEventListener('touchstart', (e) => seekTo(e.touches[0]), { passive: true });
      progressBar.addEventListener('touchmove', (e) => seekTo(e.touches[0]), { passive: true });
    });
  }

  function enhanceAll() {
    initHlsElements();
    enhanceVideos();
    enhanceAudios();
  }

  function waitForNoteva(callback) {
    if (typeof Noteva !== 'undefined') callback();
    else setTimeout(() => waitForNoteva(callback), 100);
  }

  waitForNoteva(function () {
    Noteva.hooks.on('content_render', () => setTimeout(enhanceAll, 200));

    // MutationObserver fallback
    function startObserver() {
      if (!document.body) { setTimeout(startObserver, 100); return; }
      const observer = new MutationObserver(() => {
        if (document.querySelector('.shortcode-video:not([data-mp-init])') ||
          document.querySelector('.shortcode-audio:not([data-mp-init])') ||
          document.querySelector('[data-hls="true"]:not([data-hls-init])')) {
          setTimeout(enhanceAll, 100);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
    startObserver();

    Noteva.ready(() => setTimeout(enhanceAll, 500));
  });
})();
