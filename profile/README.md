# 个人主页插件

在自定义页面展示个人信息、社交链接和技能标签，打造专属的个人主页。

## 功能特性

- ✅ 个人信息展示（头像、昵称、职位、简介）
- ✅ 社交链接（Email、GitHub、Twitter、Website、LinkedIn）
- ✅ 技能标签展示
- ✅ 响应式设计
- ✅ 暗色模式支持
- ✅ 精美的卡片样式

## 使用方法

### 1. 安装插件

将插件文件夹放到 `plugins/` 目录下，重启 Noteva 或调用热重载 API。

### 2. 创建个人主页

在管理后台创建一个自定义页面：
- 标题：关于我（随意）
- Slug：`about`（或其他自定义）
- 内容：随意填写（会被插件替换）

### 3. 配置插件

进入 **管理后台 → 插件 → 个人主页 → 设置**：

#### 基本设置
- **目标页面 Slug**：填写刚才创建的页面 slug（如 `about`）

#### 个人信息
- **头像 URL**：头像图片的 URL 地址
- **昵称**：显示的昵称
- **职位/标签**：职位、身份或标签（如 "Full Stack Developer"）
- **个人简介**：个人简介，支持多行文本
- **所在地**：所在城市或地区（可选）

#### 社交链接
- **邮箱**：联系邮箱
- **GitHub**：GitHub 用户名（不含 @）
- **Twitter**：Twitter 用户名（不含 @）
- **个人网站**：个人网站完整 URL
- **LinkedIn**：LinkedIn 用户名

#### 技能标签
编辑 JSON 格式的技能列表：
```json
[
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "Rust"
]
```

- **显示技能标签**：是否显示技能标签区域

### 4. 启用插件

在插件管理页面启用"个人主页"插件。

### 5. 访问页面

访问 `/about`（或你设置的 slug）即可看到个人主页。

## 示例配置

### 个人信息
```
头像 URL: https://avatars.githubusercontent.com/u/xxxxx
昵称: 张三
职位/标签: Full Stack Developer
个人简介: 热爱编程，专注于 Web 开发和开源项目。
喜欢探索新技术，分享技术心得。
所在地: 北京
```

### 社交链接
```
邮箱: hello@example.com
GitHub: zhangsan
Twitter: zhangsan
个人网站: https://zhangsan.dev
LinkedIn: zhangsan
```

### 技能标签
```json
[
  "JavaScript",
  "TypeScript",
  "React",
  "Vue.js",
  "Node.js",
  "Python",
  "Rust",
  "Docker",
  "Kubernetes"
]
```

## 自定义样式

如果需要自定义样式，可以编辑 `frontend.css` 文件，或在主题中覆盖以下 CSS 类：

- `.profile-container` - 主容器
- `.profile-header` - 头部区域
- `.profile-avatar` - 头像
- `.profile-bio` - 个人简介
- `.social-link` - 社交链接
- `.skill-tag` - 技能标签

## 未来计划

- v0.1.1：支持更多社交平台
- v0.1.2：可视化编辑界面
- v0.1.3：支持时间线展示（工作/教育经历）
- v0.1.4：支持统计数据（文章数、评论数等）

## 许可证

MIT License
