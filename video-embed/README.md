# Video Embed Plugin

自动识别并嵌入 YouTube、Bilibili、Twitter/X 等平台的视频，无需跳转即可在文章页面直接播放。

## 功能特性

- ✅ **自动识别**：自动检测文章中的视频链接
- ✅ **多平台支持**：YouTube、Bilibili、Twitter/X
- ✅ **无需跳转**：视频直接在文章页面播放
- ✅ **响应式设计**：自动适配手机、平板、电脑
- ✅ **可配置**：丰富的设置选项
- ✅ **延迟加载**：优化页面性能
- ✅ **暗色模式**：支持暗色主题

## 使用方法

### 1. 安装插件

将 `video-embed` 文件夹放到 `plugins/` 目录下：

```
plugins/
└── video-embed/
    ├── plugin.json
    ├── settings.json
    ├── frontend.js
    ├── frontend.css
    └── README.md
```

### 2. 启用插件

在管理后台的「插件管理」页面启用「视频嵌入」插件。

### 3. 在文章中使用

在文章编辑器中，直接粘贴视频链接即可：

```markdown
# 我的视频分享

今天看到一个很棒的 YouTube 视频：
https://www.youtube.com/watch?v=dQw4w9WgXcQ

这个 B 站教程也不错：
https://www.bilibili.com/video/BV1xx411c7mD

Twitter 上的这个片段很有意思：
https://twitter.com/user/status/123456789
```

发布后，这些链接会自动转换为嵌入式播放器！

## 支持的平台

### YouTube

支持的链接格式：
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`

### Bilibili

支持的链接格式：
- `https://www.bilibili.com/video/BV1xx411c7mD`
- `https://www.bilibili.com/video/av12345678`

### Twitter/X

支持的链接格式：
- `https://twitter.com/username/status/123456789`
- `https://x.com/username/status/123456789`

**注意**：Twitter 视频使用 [vxTwitter API](https://github.com/dylanpdx/BetterTwitFix) 获取视频直链，无需 API 认证。

## 配置选项

### 支持的平台

- **启用 YouTube**：是否自动嵌入 YouTube 视频
- **启用 Bilibili**：是否自动嵌入 Bilibili 视频
- **启用 Twitter/X**：是否自动嵌入 Twitter/X 视频

### 显示设置

- **视频宽度**：播放器宽度（100%、80%、60%）
- **视频高度**：播放器高度（像素）
- **圆角大小**：播放器圆角（像素）
- **显示平台标识**：是否显示平台徽章

### 高级设置

- **自动替换链接**：是否自动将链接替换为播放器
- **保留原始链接**：是否在播放器下方显示原始链接
- **延迟加载**：是否使用延迟加载优化性能

## 技术细节

### YouTube & Bilibili

使用官方 iframe embed API，视频完全在你的网站内播放。

### Twitter/X

使用 [vxTwitter API](https://api.vxtwitter.com) 获取视频信息：
- 无需 API 认证
- 完全免费
- 返回视频直链
- 使用 HTML5 video 标签播放

## 常见问题

### Q: 视频无法播放？

A: 请检查：
1. 插件是否已启用
2. 对应平台是否已在设置中启用
3. 视频链接格式是否正确
4. 网络连接是否正常

### Q: Twitter 视频加载失败？

A: Twitter 视频依赖 vxTwitter API，可能的原因：
1. 推文不包含视频（只有图片或文字）
2. 推文已被删除或设为私密
3. API 暂时不可用

### Q: 如何禁用某个平台？

A: 在插件设置中，关闭对应平台的开关即可。

### Q: 视频播放器太大/太小？

A: 在插件设置的「显示设置」中调整视频宽度和高度。

## 更新日志

### v1.0.0 (2026-02-04)

- 🎉 首次发布
- ✅ 支持 YouTube、Bilibili、Twitter/X
- ✅ 响应式设计
- ✅ 丰富的配置选项
- ✅ 暗色模式支持

## 许可证

MIT License

## 致谢

- [vxTwitter](https://github.com/dylanpdx/BetterTwitFix) - Twitter 视频解析服务
- YouTube & Bilibili - 官方 embed API

## 反馈与建议

如有问题或建议，欢迎在 [GitHub Issues](https://github.com/noteva26/noteva-plugins/issues) 提出。
