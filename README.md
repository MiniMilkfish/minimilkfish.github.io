# ToolWall

> 个人极简导航站，集成常用链接、博客与音乐播放器

[![GitHub Stars](https://img.shields.io/github/stars/minimilkfish/minimilkfish.github.io.svg?style=social)](https://github.com/minimilkfish/minimilkfish.github.io)
[![GitHub License](https://img.shields.io/github/license/minimilkfish/minimilkfish.github.io)](LICENSE)

---

## 🌟 功能特性

- **极简导航**：常用链接分类整理，快速访问
- **个人博客**：基于 Jekyll 的静态博客系统
- **音乐播放器**：内置音乐播放器，支持歌词显示
- **响应式设计**：适配各种屏幕尺寸
- **主题切换**：支持明暗主题切换

---

## 📁 项目结构

```
.
├── _data/           # 数据文件（链接、音乐配置）
├── _drafts/         # 草稿文章
├── _includes/       # 可复用组件
├── _layouts/        # 页面布局模板
├── _posts/          # 博客文章
├── assets/          # 静态资源（CSS、JS、音乐文件）
├── blog/            # 博客首页
├── scripts/         # 辅助脚本
├── _config.yml      # Jekyll 配置
├── Gemfile          # Ruby 依赖
└── index.markdown   # 首页
```

---

## 🚀 快速开始

### 环境要求

- Ruby >= 2.6.6
- RubyGems >= 3.1.4
- Jekyll >= 4.1.1
- Bundler

### 安装依赖

```bash
# 安装 Bundler（如未安装）
gem install bundler

# 安装项目依赖
bundle install
```

### 本地开发

```bash
# 启动开发服务器
bundle exec jekyll serve

# 访问地址
# http://localhost:4000
```

### 构建生产版本

```bash
bundle exec jekyll build
```

---

## 📝 使用说明

### 发布博客文章

在 `_posts/` 目录下创建新文件，命名格式：
```
yyyy-mm-dd-title.md
```

文章头部需要包含 Front Matter：
```yaml
---
layout: post
title: "文章标题"
date: 2022-11-09 10:00:00
categories: [分类]
tags: [标签1, 标签2]
---
```

### 添加链接

编辑 `_data/links.json` 文件，按照现有格式添加链接分类和链接项。

### 添加音乐

1. 将音乐文件放入 `assets/music/` 目录
2. 将歌词文件（.lrc）放入 `assets/music/lyrics/` 目录
3. 在 `_data/music.json` 中添加音乐信息

---

## 📄 内容展示

- [Blog](https://minimilkfish.github.io/blog/) - 个人博客
- [Homepage](https://minimilkfish.github.io/) - 导航首页

--- 

## `Git Commit Message-Standard`

### git commit -m `'<type>(<scope>):<subject>'`

- `type` (必选，统一全部变成小写)
  - `feat/feature/add`：新功能
  - `fix/to`: 修复Bug
    - `fix`：产生Diff 并自动修复此问题（适合于一次提交直接修复问题）
    - `to`：只产生Diff 不自动修复此问题（适合于多次提交，最终修复问题提交时使用 `fix`）
  - `docs`：文档（documentation），比如README、CHANGELOG、CONTRIBUTE等
  - `style`：格式（不影响代码运行的变动）
  - `refactor`：重构（非新增功能或修改Bug的代码变动）
  - `perf`：优化相关，比如提升性能、体验
  - `test`：测试用例，包括单元测试、集成测试等
  - `chore/build`：构建过程或辅助工具（增加依赖库、工具等）的变动
  - `del`：移除文件
  - `revert`：回滚到上一个版本
  - `merge`：代码合并
  - `sync`：同步主线或分支的Bug
  
- `scope`（可选）：用于说明`commit` 影响的范围，如数据层、控制层、视图层等

- `subject`：用于本次提交的主题简短说明，可含主要模块的相关说明

---

## 🛠️ 技术栈

- **框架**: Jekyll 4.x
- **语言**: Ruby, HTML, CSS, JavaScript
- **构建工具**: Bundler
- **部署**: GitHub Pages

## 📋 环境要求

| 依赖 | 版本 |
|------|------|
| OS | Windows 11 / macOS / Linux |
| Ruby | >= 2.6.6 |
| RubyGems | >= 3.1.4 |
| Jekyll | >= 4.1.1 |
| Python | >= 3.7.8 (仅用于脚本) |
| NodeJS | >= 16.13.0 |

---

## 📜 许可证

MIT License - 详见 [LICENSE](LICENSE)

---

## 🤝 贡献

欢迎 Star 和 Fork！如有问题或建议，欢迎提交 Issue 或 PR。

---

> 本页面托管于 GitHub Pages
> 源码仓库：[minimilkfish.github.io](https://github.com/minimilkfish/minimilkfish.github.io)
