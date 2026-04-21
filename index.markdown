---
layout: default
title: 首页
description: ToolWall 导航站首页
---

<section class="toolwall-home">
  <h1>ToolWall</h1>
  <p class="intro">常用链接导航 + 多引擎搜索 + 博客阅读。</p>

  <section class="search-panel">
    <div class="engine-switch">
      <button type="button" data-engine="bing" class="engine-btn active" aria-label="切换到 Bing">Bing</button>
      <button type="button" data-engine="google" class="engine-btn" aria-label="切换到 Google">Google</button>
    </div>
    <form id="search-form" class="search-form">
      <input id="search-input" type="text" placeholder="输入关键词后回车搜索" aria-label="搜索关键词" />
      <button type="submit" aria-label="执行搜索">搜索</button>
    </form>
  </section>

  <section class="links-panel">
    <div id="category-list" class="category-list"></div>
    <input id="filter-input" type="text" placeholder="按网站名称过滤" aria-label="按网站名称过滤" />
    <ul id="link-list" class="link-list"></ul>
  </section>
</section>
