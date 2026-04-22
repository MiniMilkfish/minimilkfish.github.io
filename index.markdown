---
layout: default
title: 首页
description: ToolWall 导航站首页 — 常用链接导航 + 多引擎搜索
---

<section class="toolwall-home">
  <!-- Search Bar -->
  <div class="search-bar-wrap">
    <form id="search-form" class="search-bar" autocomplete="off">
      <span class="search-icon" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </span>
      <input id="search-input" type="text" placeholder="搜索书签或使用快捷键 /" aria-label="搜索关键词" />
      <div class="engine-switch">
        <button type="button" data-engine="bing" class="engine-btn active" aria-label="切换到 Bing">Bing</button>
        <button type="button" data-engine="google" class="engine-btn" aria-label="切换到 Google">Google</button>
        <button type="button" data-engine="duck" class="engine-btn" aria-label="切换到 DuckDuckGo">Duck</button>
      </div>
    </form>
    <!-- Bookmark search dropdown -->
    <div id="search-dropdown" class="search-dropdown"></div>
  </div>

  <!-- Date & Tagline -->
  <div class="date-tagline">
    <span id="current-date"></span>
    <span class="tagline-sep">|</span>
    <span class="tagline-text">记录你的灵感每一刻</span>
  </div>

  <!-- Category Filters -->
  <div id="category-list" class="category-list"></div>

  <!-- Link Cards Grid -->
  <div id="link-grid" class="link-grid"></div>
</section>
