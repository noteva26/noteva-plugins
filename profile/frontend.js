(function() {
  'use strict';
  
  const PLUGIN_ID = 'profile';
  
  // 获取当前页面的 slug
  function getCurrentSlug() {
    const path = window.location.pathname;
    const match = path.match(/\/([^\/]+)\/?$/);
    return match ? match[1] : '';
  }
  
  // 渲染社交链接图标
  function getSocialIcon(platform) {
    const icons = {
      email: '✉️',
      github: '🐙',
      twitter: '🐦',
      website: '🌐',
      linkedin: '💼'
    };
    return icons[platform] || '🔗';
  }
  
  // 渲染个人主页
  function renderProfile(settings) {
    const { avatar, name, title, bio, location, email, github, twitter, website, linkedin, skills_data, show_skills } = settings;
    // 处理技能数据：可能是字符串数组或对象数组
    let skills = [];
    if (Array.isArray(skills_data)) {
      skills = skills_data.map(item => {
        if (typeof item === 'string') {
          return item;
        } else if (item && item.skill) {
          return item.skill;
        }
        return '';
      }).filter(s => s);
    }
    
    let html = `
      <div class="profile-container">
        <div class="profile-header">
          ${avatar ? `
            <div class="profile-avatar">
              <img src="${avatar}" alt="${name || 'Avatar'}">
            </div>
          ` : ''}
          <div class="profile-info">
            <h1 class="profile-name">${name || 'Your Name'}</h1>
            ${title ? `<p class="profile-title">${title}</p>` : ''}
            ${location ? `<p class="profile-location">📍 ${location}</p>` : ''}
          </div>
        </div>
        
        ${bio ? `
          <div class="profile-bio">
            <p>${bio.replace(/\n/g, '<br>')}</p>
          </div>
        ` : ''}
        
        <div class="profile-social">
    `;
    
    // 添加社交链接
    const socialLinks = [];
    if (email) socialLinks.push({ platform: 'email', url: `mailto:${email}`, label: 'Email' });
    if (github) socialLinks.push({ platform: 'github', url: `https://github.com/${github}`, label: 'GitHub' });
    if (twitter) socialLinks.push({ platform: 'twitter', url: `https://twitter.com/${twitter}`, label: 'Twitter' });
    if (website) socialLinks.push({ platform: 'website', url: website, label: 'Website' });
    if (linkedin) socialLinks.push({ platform: 'linkedin', url: `https://linkedin.com/in/${linkedin}`, label: 'LinkedIn' });
    
    socialLinks.forEach(link => {
      html += `
        <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="social-link">
          <span class="social-icon">${getSocialIcon(link.platform)}</span>
          <span class="social-label">${link.label}</span>
        </a>
      `;
    });
    
    html += '</div>';
    
    // 添加技能标签
    if (show_skills && skills.length > 0) {
      html += `
        <div class="profile-skills">
          <h2 class="skills-title">技能</h2>
          <div class="skills-tags">
      `;
      
      skills.forEach(skill => {
        html += `<span class="skill-tag">${skill}</span>`;
      });
      
      html += `
          </div>
        </div>
      `;
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
      const targetSlug = settings.target_slug || 'about';
      const currentSlug = getCurrentSlug();
      
      // 检查是否匹配目标页面
      if (currentSlug === targetSlug) {
        // 等待页面内容加载
        setTimeout(() => {
          const contentElement = document.querySelector('.page-content, .prose, article, main');
          if (contentElement) {
            // 清空并替换页面内容
            while (contentElement.firstChild) {
              contentElement.removeChild(contentElement.firstChild);
            }
            const wrapper = document.createElement('div');
            wrapper.innerHTML = renderProfile(settings);
            contentElement.appendChild(wrapper);
          }
        }, 100);
      }
    } catch (error) {
      console.error('[Profile Plugin] Error:', error);
    }
  }
  
  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
