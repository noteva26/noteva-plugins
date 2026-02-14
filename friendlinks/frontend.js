(function() {
  'use strict';
  
  const PLUGIN_ID = 'friendlinks';
  
  // 获取当前页面的 slug
  function getCurrentSlug() {
    const path = window.location.pathname;
    const match = path.match(/\/([^\/]+)\/?$/);
    return match ? match[1] : '';
  }
  
  // 渲染友链列表
  function renderFriendlinks(settings) {
    console.log('[Friendlinks] Settings:', settings);
    const { title, description, links_data, layout, columns, show_logo, show_description } = settings;
    console.log('[Friendlinks] links_data:', links_data);
    const links = Array.isArray(links_data) ? links_data : [];
    console.log('[Friendlinks] Parsed links:', links);
    
    // 按分类分组
    const categories = {};
    links.forEach(link => {
      const category = link.category || '未分类';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(link);
    });
    
    let html = `
      <div class="friendlinks-container">
        <h1 class="friendlinks-title">${title || '友情链接'}</h1>
        ${description ? `<p class="friendlinks-description">${description}</p>` : ''}
    `;
    
    // 如果没有友链，显示提示
    if (links.length === 0) {
      html += `
        <div class="friendlinks-empty">
          <p>暂无友链，请在插件设置中添加。</p>
        </div>
      `;
    } else {
      // 渲染每个分类
      Object.keys(categories).forEach(category => {
      const categoryLinks = categories[category];
      
      html += `
        <div class="friendlinks-category">
          ${Object.keys(categories).length > 1 ? `<h2 class="category-title">${category}</h2>` : ''}
          <div class="friendlinks-${layout}" style="${layout === 'grid' ? `grid-template-columns: repeat(${columns || 3}, 1fr);` : ''}">
      `;
      
      categoryLinks.forEach(link => {
        html += `
          <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="friendlink-card">
            ${show_logo && link.logo ? `
              <div class="friendlink-logo">
                <img src="${link.logo}" alt="${link.name}" onerror="this.style.display='none'">
              </div>
            ` : ''}
            <div class="friendlink-info">
              <h3 class="friendlink-name">${link.name}</h3>
              ${show_description && link.description ? `<p class="friendlink-description">${link.description}</p>` : ''}
            </div>
          </a>
        `;
      });
      
      html += `
          </div>
        </div>
      `;
    });
    }
    
    html += '</div>';
    
    return html;
  }
  
  // 初始化
  async function init() {
    try {
      // 获取插件设置
      const response = await fetch('/api/v1/plugins/enabled');
      const plugins = await response.json();
      const plugin = plugins.find(p => p.id === PLUGIN_ID);
      
      if (!plugin || !plugin.settings) {
        return;
      }
      
      const settings = plugin.settings;
      const targetSlug = settings.target_slug || 'friendlinks';
      const currentSlug = getCurrentSlug();
      
      // 检查是否匹配目标页面
      if (currentSlug === targetSlug) {
        // 等待页面内容加载
        const tryRender = () => {
          const contentElement = document.querySelector('.page-content, .prose, article, main');
          if (contentElement) {
            // 避免重复渲染
            if (contentElement.querySelector('.friendlinks-container')) return;
            // 清空并替换页面内容
            while (contentElement.firstChild) {
              contentElement.removeChild(contentElement.firstChild);
            }
            const wrapper = document.createElement('div');
            wrapper.innerHTML = renderFriendlinks(settings);
            contentElement.appendChild(wrapper);
          }
        };
        setTimeout(tryRender, 100);
      }
    } catch (error) {
      console.error('[Friendlinks Plugin] Error:', error);
    }
  }
  
  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 200));
  } else {
    setTimeout(init, 200);
  }
  
  // SPA 路由切换时重新初始化
  function registerHook() {
    if (typeof Noteva !== 'undefined' && Noteva.hooks) {
      Noteva.hooks.on('content_render', () => {
        setTimeout(init, 100);
      });
    } else {
      setTimeout(registerHook, 200);
    }
  }
  registerHook();

  // MutationObserver 兜底：监听 SPA 内容动态加载
  let lastPath = window.location.pathname;
  const observer = new MutationObserver(() => {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      setTimeout(init, 200);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
