(function() {
  'use strict';
  
  const PLUGIN_ID = 'video-embed';
  
  // 默认设置
  const DEFAULT_SETTINGS = {
    enable_youtube: true,
    enable_bilibili: true,
    enable_twitter: true,
    video_width: '100%',
    video_height: '450',
    border_radius: '8',
    show_platform_badge: true,
    auto_replace_links: true,
    preserve_original_link: false,
    lazy_load: true
  };
  
  let settings = { ...DEFAULT_SETTINGS };
  
  // 视频平台配置
  const platforms = {
    youtube: {
      name: 'YouTube',
      icon: '▶️',
      regex: /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i,
      getEmbedUrl: (videoId) => `https://www.youtube.com/embed/${videoId}`,
      enabled: () => settings.enable_youtube
    },
    bilibili: {
      name: 'Bilibili',
      icon: '📺',
      regex: /(?:https?:\/\/)?(?:www\.)?bilibili\.com\/video\/((?:BV|av)[a-zA-Z0-9]+)/i,
      getEmbedUrl: (videoId) => {
        if (videoId.startsWith('av')) {
          return `//player.bilibili.com/player.html?aid=${videoId.substring(2)}`;
        }
        return `//player.bilibili.com/player.html?bvid=${videoId}`;
      },
      enabled: () => settings.enable_bilibili
    },
    twitter: {
      name: 'Twitter/X',
      icon: '🐦',
      regex: /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/i,
      getEmbedUrl: null, // Twitter 需要特殊处理
      enabled: () => settings.enable_twitter
    }
  };
  
  // 创建视频播放器 HTML
  function createVideoPlayer(platform, videoId, originalUrl) {
    const width = settings.video_width;
    const height = settings.video_height;
    const borderRadius = settings.border_radius;
    const showBadge = settings.show_platform_badge;
    const preserveLink = settings.preserve_original_link;
    const lazyLoad = settings.lazy_load;
    
    const platformConfig = platforms[platform];
    
    let playerHtml = `
      <div class="video-embed-container" data-platform="${platform}">
        ${showBadge ? `
          <div class="video-embed-badge">
            <span class="badge-icon">${platformConfig.icon}</span>
            <span class="badge-text">${platformConfig.name}</span>
          </div>
        ` : ''}
        <div class="video-embed-wrapper" style="width: ${width}; max-width: 100%;">
    `;
    
    if (platform === 'twitter') {
      // Twitter 视频需要异步加载
      playerHtml += `
          <div class="video-embed-loading" data-tweet-id="${videoId}">
            <div class="loading-spinner"></div>
            <p>正在加载视频...</p>
          </div>
      `;
    } else {
      // YouTube 和 Bilibili 使用 iframe
      const embedUrl = platformConfig.getEmbedUrl(videoId);
      const iframeAttrs = lazyLoad ? 'loading="lazy"' : '';
      
      playerHtml += `
          <div class="video-embed-player" style="border-radius: ${borderRadius}px; overflow: hidden;">
            <iframe
              src="${embedUrl}"
              width="100%"
              height="${height}"
              frameborder="0"
              allowfullscreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              ${iframeAttrs}
            ></iframe>
          </div>
      `;
    }
    
    if (preserveLink) {
      playerHtml += `
          <div class="video-embed-link">
            <a href="${originalUrl}" target="_blank" rel="noopener noreferrer">
              🔗 查看原始链接
            </a>
          </div>
      `;
    }
    
    playerHtml += `
        </div>
      </div>
    `;
    
    return playerHtml;
  }
  
  // 加载 Twitter 视频
  async function loadTwitterVideo(tweetId, container) {
    try {
      const response = await fetch(`https://api.vxtwitter.com/i/status/${tweetId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tweet data');
      }
      
      const data = await response.json();
      
      // 检查是否有视频
      if (!data.media_extended || data.media_extended.length === 0) {
        throw new Error('No media found in tweet');
      }
      
      // 查找视频
      const videoMedia = data.media_extended.find(m => m.type === 'video' || m.type === 'gif');
      
      if (!videoMedia || !videoMedia.url) {
        throw new Error('No video found in tweet');
      }
      
      // 创建 HTML5 video 播放器
      const height = settings.video_height;
      const borderRadius = settings.border_radius;
      
      const videoHtml = `
        <div class="video-embed-player" style="border-radius: ${borderRadius}px; overflow: hidden;">
          <video
            controls
            width="100%"
            height="${height}"
            style="display: block; background: #000;"
            poster="${videoMedia.thumbnail_url || ''}"
          >
            <source src="${videoMedia.url}" type="video/mp4">
            您的浏览器不支持 HTML5 视频播放。
          </video>
          ${data.text ? `
            <div class="video-embed-caption">
              <p>${escapeHtml(data.text)}</p>
              <small>— @${data.user_screen_name}</small>
            </div>
          ` : ''}
        </div>
      `;
      
      container.innerHTML = videoHtml;
    } catch (error) {
      console.error('[Video Embed] Failed to load Twitter video:', error);
      container.innerHTML = `
        <div class="video-embed-error">
          <p>❌ 无法加载视频</p>
          <small>${error.message}</small>
        </div>
      `;
    }
  }
  
  // HTML 转义
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // 预处理：隐藏即将被替换的 URL（减少闪烁）
  function preProcessUrls() {
    const contentSelectors = [
      '.post-content',
      '.prose',
      '.article-content'
    ];
    
    let contentElement = null;
    for (const selector of contentSelectors) {
      contentElement = document.querySelector(selector);
      if (contentElement) break;
    }
    
    if (!contentElement) return;
    
    const paragraphs = contentElement.querySelectorAll('p');
    paragraphs.forEach(p => {
      const text = p.textContent.trim();
      
      // 检查是否是视频 URL
      for (const [platformKey, platformConfig] of Object.entries(platforms)) {
        if (!platformConfig.enabled()) continue;
        
        const match = text.match(platformConfig.regex);
        if (match && text.startsWith('http')) {
          // 添加一个临时类，稍微降低透明度
          p.style.opacity = '0.3';
          p.style.transition = 'opacity 0.2s';
          p.setAttribute('data-video-url', 'pending');
          break;
        }
      }
    });
  }
  
  // 处理文章内容中的视频链接
  function processVideoLinks() {
    if (!settings.auto_replace_links) {
      return;
    }
    
    // 查找文章内容容器
    const contentSelectors = [
      '.post-content',
      '.prose',
      '.article-content',
      'article .content',
      'main article',
      '.markdown-body',
      '.content',
      'article'
    ];
    
    let contentElement = null;
    for (const selector of contentSelectors) {
      contentElement = document.querySelector(selector);
      if (contentElement) break;
    }
    
    if (!contentElement) {
      return;
    }
    
    // 方法 1: 处理 <a> 标签
    const links = contentElement.querySelectorAll('a[href]');
    
    links.forEach(link => {
      const url = link.href;
      processUrl(url, link, link.parentElement);
    });
    
    // 方法 2: 处理纯文本 URL（在段落中查找）
    const paragraphs = contentElement.querySelectorAll('p');
    
    paragraphs.forEach((p) => {
      // 跳过已经处理过的段落
      if (p.querySelector('.video-embed-container')) {
        return;
      }
      
      const text = p.textContent.trim();
      
      // 检查段落是否只包含一个 URL
      for (const [platformKey, platformConfig] of Object.entries(platforms)) {
        if (!platformConfig.enabled()) {
          continue;
        }
        
        const match = text.match(platformConfig.regex);
        if (match && match[1]) {
          const videoId = match[1];
          const url = match[0];
          
          // 确保整个段落就是这个 URL（允许前后有少量空白）
          const cleanText = text.replace(/\s+/g, '');
          const cleanUrl = url.replace(/\s+/g, '');
          
          if (text === url || cleanText === cleanUrl || text.startsWith('http')) {
            // 创建播放器
            const playerHtml = createVideoPlayer(platformKey, videoId, url);
            const wrapper = document.createElement('div');
            wrapper.innerHTML = playerHtml;
            
            // 替换段落
            p.replaceWith(wrapper.firstElementChild);
            
            // 如果是 Twitter，异步加载视频
            if (platformKey === 'twitter') {
              const loadingContainer = wrapper.querySelector('.video-embed-loading');
              if (loadingContainer) {
                loadTwitterVideo(videoId, loadingContainer);
              }
            }
            
            break;
          }
        }
      }
    });
  }
  
  // 处理单个 URL
  function processUrl(url, element, parent) {
    // 检查每个平台
    for (const [platformKey, platformConfig] of Object.entries(platforms)) {
      if (!platformConfig.enabled()) {
        continue;
      }
      
      const match = url.match(platformConfig.regex);
      if (match && match[1]) {
        const videoId = match[1];
        
        // 检查链接是否是独立的段落
        const isStandalone = parent && (
          parent.tagName === 'P' && 
          parent.textContent.trim() === element.textContent.trim()
        );
        
        const shouldReplace = isStandalone || 
                              element.textContent === url || 
                              element.textContent.includes(videoId);
        
        if (shouldReplace) {
          // 创建播放器
          const playerHtml = createVideoPlayer(platformKey, videoId, url);
          const wrapper = document.createElement('div');
          wrapper.innerHTML = playerHtml;
          
          // 替换链接所在的段落
          if (parent && parent.tagName === 'P') {
            parent.replaceWith(wrapper.firstElementChild);
          } else {
            element.replaceWith(wrapper.firstElementChild);
          }
          
          // 如果是 Twitter，异步加载视频
          if (platformKey === 'twitter') {
            const loadingContainer = wrapper.querySelector('.video-embed-loading');
            if (loadingContainer) {
              loadTwitterVideo(videoId, loadingContainer);
            }
          }
          
          break;
        }
      }
    }
  }
  
  // 加载插件设置
  async function loadSettings() {
    try {
      // 检查是否有模拟设置（用于测试）
      if (window.mockPluginSettings) {
        settings = { ...DEFAULT_SETTINGS, ...window.mockPluginSettings };
        return;
      }
      
      const response = await fetch('/api/v1/plugins/enabled');
      const plugins = await response.json();
      const plugin = plugins.find(p => p.id === PLUGIN_ID);
      
      if (plugin && plugin.settings) {
        settings = { ...DEFAULT_SETTINGS, ...plugin.settings };
      }
    } catch (error) {
      console.error('[Video Embed] Failed to load settings:', error);
    }
  }
  
  // 处理内容（检查页面类型、查找容器、调用 processVideoLinks）
  function processContent() {
    const isArticlePage = window.location.pathname.includes('/posts/') || 
                          document.querySelector('article') !== null;
    if (!isArticlePage) return;
    
    const contentElement = document.querySelector('.post-content, .prose, .article-content');
    if (!contentElement || contentElement.children.length === 0) return;
    
    if (contentElement.getAttribute('data-video-processed') === window.location.pathname) return;
    
    processVideoLinks();
    contentElement.setAttribute('data-video-processed', window.location.pathname);
  }
  
  // 初始化
  async function init() {
    // 1. 先注册 hook（不等 settings），这样不会错过任何 content_render 触发
    //    即使 settings 还没加载完，processContent 也会用 DEFAULT_SETTINGS 工作
    const registerHook = () => {
      if (window.Noteva && window.Noteva.hooks) {
        window.Noteva.hooks.on('content_render', () => {
          document.querySelectorAll('[data-video-processed]').forEach(el => {
            el.removeAttribute('data-video-processed');
          });
          processContent();
        });
      } else {
        setTimeout(registerHook, 100);
      }
    };
    registerHook();
    
    // 2. 然后异步加载设置
    await loadSettings();
    
    // 3. 设置加载完成后，清除标记并重新处理（用真实设置替换默认设置的结果）
    document.querySelectorAll('[data-video-processed]').forEach(el => {
      el.removeAttribute('data-video-processed');
    });
    
    // 首次加载处理
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      preProcessUrls();
      setTimeout(processContent, 100);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        preProcessUrls();
        setTimeout(processContent, 100);
      });
    }
    
    // MutationObserver 兜底：监听 SPA 路由变化和内容动态加载
    let lastPath = window.location.pathname;
    const observer = new MutationObserver(() => {
      // 路由变化时清除标记
      if (window.location.pathname !== lastPath) {
        lastPath = window.location.pathname;
        document.querySelectorAll('[data-video-processed]').forEach(el => {
          el.removeAttribute('data-video-processed');
        });
      }
      const contentElement = document.querySelector('.post-content, .prose, .article-content');
      if (contentElement && contentElement.children.length > 0 && 
          contentElement.getAttribute('data-video-processed') !== window.location.pathname) {
        processContent();
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  }
  
  // 启动插件
  init();
})();
