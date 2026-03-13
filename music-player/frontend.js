/**
 * 音乐播放器插件 v3.1.0
 * Premium floating player with glassmorphism, SVG icons, progress ring
 */
(function () {
  const PLUGIN_ID = 'music-player';

  // SVG Icons
  const ICONS = {
    play: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',
    prev: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>',
    next: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm2 0h2V6h-2v12z" transform="translate(4,0)"/></svg>',
    list: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    volumeHigh: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>',
    volumeLow: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>',
    volumeMute: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>',
    shuffle: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>',
  };

  const DEFAULT_COVER = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHJ4PSI4IiBmaWxsPSIjMjIyIi8+PHBhdGggZD0iTTE2IDEydjExLjVhMy41IDMuNSAwIDEgMS0yLTMuMTVWMTVoNnYtM2gtNHoiIGZpbGw9IiM2NjYiLz48L3N2Zz4=';

  // i18n
  const I18N = {
    'zh-CN': { unknown: '未知歌曲', unknownArtist: '未知', playlist: '播放列表', play: '播放', pause: '暂停', prev: '上一首', next: '下一首', volume: '音量', shuffle: '随机播放' },
    'zh-TW': { unknown: '未知歌曲', unknownArtist: '未知', playlist: '播放列表', play: '播放', pause: '暫停', prev: '上一首', next: '下一首', volume: '音量', shuffle: '隨機播放' },
    'en': { unknown: 'Unknown', unknownArtist: 'Unknown', playlist: 'Playlist', play: 'Play', pause: 'Pause', prev: 'Previous', next: 'Next', volume: 'Volume', shuffle: 'Shuffle' },
  };

  function getLocale() {
    try {
      const stored = JSON.parse(localStorage.getItem('noteva-locale') || '{}');
      if (stored.state?.locale) return stored.state.locale;
    } catch (e) { }
    if (Noteva.i18n) return Noteva.i18n.getLocale();
    return 'zh-CN';
  }

  function t(key) {
    const locale = getLocale();
    const lang = locale.split('-')[0];
    const msgs = I18N[locale] || I18N[lang] || I18N['zh-CN'];
    return msgs[key] || key;
  }

  let currentIndex = 0;
  let playlist = [];
  let audio = null;
  let isPlaying = false;
  let shuffleMode = false;
  let collapseTimer = null;
  const COLLAPSE_DELAY = 4000;

  // Storage helpers
  const STORAGE_KEY = 'noteva-music-player';

  function saveState() {
    try {
      const state = {
        index: currentIndex,
        time: audio ? audio.currentTime : 0,
        volume: audio ? audio.volume : 0.5,
        shuffle: shuffleMode,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* ignore */ }
  }

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) { return {}; }
  }

  function parseSongs(songsData) {
    if (Array.isArray(songsData)) return songsData.filter(s => s.url);
    try {
      const songs = JSON.parse(songsData || '[]');
      return Array.isArray(songs) ? songs.filter(s => s.url) : [];
    } catch (e) { return []; }
  }

  function isDark() {
    return document.documentElement.classList.contains('dark');
  }

  function createPlayer() {
    const settings = Noteva.plugins.getSettings(PLUGIN_ID);
    playlist = parseSongs(settings.songs);
    if (playlist.length === 0) return;

    const saved = settings.remember !== false ? loadState() : {};
    const position = settings.position || 'bottom-right';
    const loop = settings.loop !== false;
    const volume = saved.volume !== undefined ? saved.volume : (settings.volume || 50) / 100;
    const autoplay = settings.autoplay || false;
    shuffleMode = saved.shuffle || settings.shuffle || false;
    currentIndex = (saved.index !== undefined && saved.index < playlist.length) ? saved.index : 0;

    const song = playlist[currentIndex];

    const player = document.createElement('div');
    player.id = 'noteva-music-player';
    player.className = `nmp-pos-${position}`;
    if (isDark()) player.classList.add('nmp-dark');

    // Progress ring SVG (for collapsed state)
    const ringSize = 48;
    const ringR = 21;
    const ringCirc = 2 * Math.PI * ringR;

    player.innerHTML = `
      <audio id="nmp-audio" preload="auto"></audio>

      <div class="nmp-collapsed-ring">
        <svg width="${ringSize}" height="${ringSize}" viewBox="0 0 ${ringSize} ${ringSize}">
          <circle class="nmp-ring-bg" cx="${ringSize / 2}" cy="${ringSize / 2}" r="${ringR}" fill="none" stroke-width="2.5"/>
          <circle class="nmp-ring-fill" cx="${ringSize / 2}" cy="${ringSize / 2}" r="${ringR}" fill="none" stroke-width="2.5"
            stroke-dasharray="${ringCirc}" stroke-dashoffset="${ringCirc}" transform="rotate(-90 ${ringSize / 2} ${ringSize / 2})"/>
        </svg>
        <img class="nmp-collapsed-cover" src="${song.cover || DEFAULT_COVER}" alt="">
      </div>

      <div class="nmp-body">
        <img class="nmp-cover" src="${song.cover || DEFAULT_COVER}" alt="">

        <div class="nmp-info">
          <div class="nmp-title">${song.name || t('unknown')}</div>
          <div class="nmp-artist">${song.artist || t('unknownArtist')}</div>
        </div>

        <div class="nmp-controls">
          <button class="nmp-btn nmp-btn-prev" title="${t('prev')}">${ICONS.prev}</button>
          <button class="nmp-btn nmp-btn-play" title="${t('play')}">${ICONS.play}</button>
          <button class="nmp-btn nmp-btn-next" title="${t('next')}">${ICONS.next}</button>
        </div>

        <div class="nmp-actions">
          <button class="nmp-btn nmp-btn-shuffle${shuffleMode ? ' active' : ''}" title="${t('shuffle')}">${ICONS.shuffle}</button>
          <div class="nmp-volume-wrap">
            <button class="nmp-btn nmp-btn-volume" title="${t('volume')}">${ICONS.volumeHigh}</button>
            <div class="nmp-volume-popup">
              <input type="range" class="nmp-volume-bar" min="0" max="100" value="${Math.round(volume * 100)}" orient="vertical">
            </div>
          </div>
          <button class="nmp-btn nmp-btn-list" title="${t('playlist')}">${ICONS.list}</button>
        </div>

        <div class="nmp-progress">
          <div class="nmp-progress-fill"></div>
          <div class="nmp-progress-thumb"></div>
        </div>
      </div>

      <div class="nmp-playlist">
        <div class="nmp-playlist-header">${t('playlist')} <span class="nmp-playlist-count">(${playlist.length})</span></div>
        <div class="nmp-playlist-list"></div>
      </div>
    `;

    document.body.appendChild(player);

    // Elements
    audio = document.getElementById('nmp-audio');
    const collapsedRing = player.querySelector('.nmp-collapsed-ring');
    const collapsedCover = player.querySelector('.nmp-collapsed-cover');
    const body = player.querySelector('.nmp-body');
    const cover = player.querySelector('.nmp-cover');
    const titleEl = player.querySelector('.nmp-title');
    const artistEl = player.querySelector('.nmp-artist');
    const btnPrev = player.querySelector('.nmp-btn-prev');
    const btnPlay = player.querySelector('.nmp-btn-play');
    const btnNext = player.querySelector('.nmp-btn-next');
    const btnShuffle = player.querySelector('.nmp-btn-shuffle');
    const btnVolume = player.querySelector('.nmp-btn-volume');
    const volumePopup = player.querySelector('.nmp-volume-popup');
    const volumeBar = player.querySelector('.nmp-volume-bar');
    const btnList = player.querySelector('.nmp-btn-list');
    const playlistPanel = player.querySelector('.nmp-playlist');
    const playlistList = player.querySelector('.nmp-playlist-list');
    const progressBar = player.querySelector('.nmp-progress');
    const progressFill = player.querySelector('.nmp-progress-fill');
    const progressThumb = player.querySelector('.nmp-progress-thumb');
    const ringFill = player.querySelector('.nmp-ring-fill');

    audio.volume = volume;

    // --- Collapse / Expand ---
    function resetCollapseTimer() {
      clearTimeout(collapseTimer);
      collapseTimer = setTimeout(() => {
        player.classList.add('collapsed');
        volumePopup.classList.remove('show');
        playlistPanel.classList.remove('show');
      }, COLLAPSE_DELAY);
    }

    function expand() {
      player.classList.remove('collapsed');
      resetCollapseTimer();
    }

    player.addEventListener('mouseenter', () => { clearTimeout(collapseTimer); expand(); });
    player.addEventListener('mouseleave', resetCollapseTimer);
    collapsedRing.addEventListener('click', expand);
    player.addEventListener('touchstart', () => {
      if (player.classList.contains('collapsed')) expand();
      else resetCollapseTimer();
    }, { passive: true });

    // Start collapsed
    player.classList.add('collapsed');

    // --- Playlist rendering ---
    function renderPlaylist() {
      playlistList.innerHTML = playlist.map((s, i) => `
        <div class="nmp-pl-item${i === currentIndex ? ' active' : ''}" data-index="${i}">
          <div class="nmp-pl-indicator">${i === currentIndex && isPlaying ? '<span class="nmp-wave"><i></i><i></i><i></i></span>' : (i + 1)}</div>
          <img class="nmp-pl-cover" src="${s.cover || DEFAULT_COVER}" alt="">
          <div class="nmp-pl-info">
            <div class="nmp-pl-name">${s.name || t('unknown')}</div>
            <div class="nmp-pl-artist">${s.artist || t('unknownArtist')}</div>
          </div>
        </div>
      `).join('');
    }
    renderPlaylist();

    // --- Load / Play ---
    function loadSong(index) {
      if (index < 0 || index >= playlist.length) return;
      currentIndex = index;
      const s = playlist[index];
      audio.src = s.url;
      cover.src = s.cover || DEFAULT_COVER;
      collapsedCover.src = s.cover || DEFAULT_COVER;
      titleEl.textContent = s.name || t('unknown');
      artistEl.textContent = s.artist || t('unknownArtist');
      progressFill.style.width = '0%';
      progressThumb.style.left = '0%';
      updateRing(0);
      renderPlaylist();
      saveState();
    }

    function setPlayingState(playing) {
      isPlaying = playing;
      btnPlay.innerHTML = playing ? ICONS.pause : ICONS.play;
      btnPlay.title = playing ? t('pause') : t('play');
      player.classList.toggle('playing', playing);
      renderPlaylist();
    }

    function togglePlay() {
      if (audio.paused) {
        audio.play().then(() => setPlayingState(true)).catch(() => { });
      } else {
        audio.pause();
        setPlayingState(false);
      }
    }

    function prevSong() {
      let idx;
      if (shuffleMode) {
        idx = Math.floor(Math.random() * playlist.length);
      } else {
        idx = currentIndex - 1;
        if (idx < 0) idx = loop ? playlist.length - 1 : 0;
      }
      loadSong(idx);
      if (isPlaying) audio.play().catch(() => { });
    }

    function nextSong() {
      let idx;
      if (shuffleMode) {
        idx = Math.floor(Math.random() * playlist.length);
      } else {
        idx = currentIndex + 1;
        if (idx >= playlist.length) {
          if (loop) idx = 0;
          else { setPlayingState(false); return; }
        }
      }
      loadSong(idx);
      if (isPlaying) audio.play().catch(() => { });
    }

    // --- Progress ring (collapsed state) ---
    function updateRing(pct) {
      const offset = ringCirc - (pct * ringCirc);
      ringFill.style.strokeDashoffset = offset;
    }

    // --- Events ---
    btnPlay.onclick = togglePlay;
    collapsedRing.addEventListener('dblclick', (e) => { e.stopPropagation(); togglePlay(); });
    btnPrev.onclick = prevSong;
    btnNext.onclick = nextSong;

    audio.ontimeupdate = () => {
      if (!audio.duration) return;
      const pct = audio.currentTime / audio.duration;
      progressFill.style.width = (pct * 100) + '%';
      progressThumb.style.left = (pct * 100) + '%';
      updateRing(pct);
    };

    audio.onended = nextSong;

    // Save state periodically
    let saveTimer = null;
    audio.ontimeupdate = () => {
      if (!audio.duration) return;
      const pct = audio.currentTime / audio.duration;
      progressFill.style.width = (pct * 100) + '%';
      progressThumb.style.left = (pct * 100) + '%';
      updateRing(pct);
      if (!saveTimer) {
        saveTimer = setTimeout(() => { saveState(); saveTimer = null; }, 5000);
      }
    };

    // --- Progress bar drag ---
    function seekTo(e) {
      const rect = progressBar.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      if (audio.duration) {
        audio.currentTime = pct * audio.duration;
        progressFill.style.width = (pct * 100) + '%';
        progressThumb.style.left = (pct * 100) + '%';
        updateRing(pct);
      }
    }

    let dragging = false;
    progressBar.addEventListener('mousedown', (e) => { dragging = true; seekTo(e); });
    document.addEventListener('mousemove', (e) => { if (dragging) seekTo(e); });
    document.addEventListener('mouseup', () => { dragging = false; });
    progressBar.addEventListener('touchstart', (e) => { seekTo(e.touches[0]); }, { passive: true });
    progressBar.addEventListener('touchmove', (e) => { seekTo(e.touches[0]); }, { passive: true });

    // --- Volume ---
    const volumeWrap = player.querySelector('.nmp-volume-wrap');
    volumeWrap.addEventListener('mouseenter', () => volumePopup.classList.add('show'));
    volumeWrap.addEventListener('mouseleave', () => volumePopup.classList.remove('show'));

    function updateVolumeIcon() {
      if (audio.volume === 0) btnVolume.innerHTML = ICONS.volumeMute;
      else if (audio.volume < 0.5) btnVolume.innerHTML = ICONS.volumeLow;
      else btnVolume.innerHTML = ICONS.volumeHigh;
    }

    volumeBar.oninput = (e) => {
      audio.volume = e.target.value / 100;
      updateVolumeIcon();
      saveState();
    };
    updateVolumeIcon();

    // --- Shuffle ---
    btnShuffle.onclick = () => {
      shuffleMode = !shuffleMode;
      btnShuffle.classList.toggle('active', shuffleMode);
      saveState();
    };

    // --- Playlist panel ---
    btnList.onclick = (e) => {
      e.stopPropagation();
      playlistPanel.classList.toggle('show');
      volumePopup.classList.remove('show');
    };

    playlistList.onclick = (e) => {
      const item = e.target.closest('.nmp-pl-item');
      if (item) {
        loadSong(parseInt(item.dataset.index));
        audio.play().then(() => setPlayingState(true)).catch(() => { });
        playlistPanel.classList.remove('show');
      }
    };

    // Close panels on outside click
    document.addEventListener('click', (e) => {
      if (!player.contains(e.target)) {
        volumePopup.classList.remove('show');
        playlistPanel.classList.remove('show');
      }
    });

    // --- Theme sync ---
    const observer = new MutationObserver(() => {
      player.classList.toggle('nmp-dark', isDark());
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // --- Init ---
    loadSong(currentIndex);
    if (saved.time && settings.remember !== false) {
      audio.addEventListener('loadedmetadata', () => {
        if (saved.time < audio.duration) audio.currentTime = saved.time;
      }, { once: true });
    }

    if (autoplay) {
      audio.play().then(() => setPlayingState(true)).catch(() => { });
    }
  }

  Noteva.events.on('theme:ready', createPlayer);
})();
