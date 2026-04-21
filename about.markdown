---
layout: default
title: 关于
permalink: /about/
description: ToolWall 站点简介
---

<section class="info-card">
  <h1>关于 ToolWall</h1>
  <p>ToolWall 是一个面向个人使用的极简导航站，集成了链接状态展示、博客内容与悬浮音乐播放器。</p>
</section>

<section class="info-card">
  <h2>数据维护方式</h2>
  <ul>
    <li>导航链接使用 <code>_data/links.json</code> 维护</li>
    <li>音乐列表使用 <code>_data/music.json</code> 维护</li>
    <li>博客文章放在 <code>_posts</code> 目录</li>
  </ul>
</section>

<section class="info-card">
  <h2>部署说明</h2>
  <p>本项目可直接部署到 GitHub Pages，并通过 GitHub Actions 定期更新链接状态。</p>
  <p>如果你想扩展功能，建议优先在 <code>assets/js/main.js</code> 与 <code>assets/css/main.css</code> 中维护前端行为与样式。</p>
</section>
