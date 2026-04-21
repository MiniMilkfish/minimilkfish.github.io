(function () {
  const state = {
    engine: "bing",
    category: "全部",
    filter: ""
  };

  const linksData = window.linksData || { categories: [], links: [] };
  const musicData = window.musicData || { songs: [] };
  const THEME_KEY = "toolwall-theme";

  function applyTheme(theme) {
    const safeTheme = theme === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", safeTheme);
    const toggle = document.getElementById("theme-toggle");
    if (toggle) {
      toggle.textContent = safeTheme === "dark" ? "明色" : "暗色";
      toggle.setAttribute("aria-label", safeTheme === "dark" ? "切换到明亮主题" : "切换到暗色主题");
    }
  }

  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || "light";
    applyTheme(savedTheme);
    const toggle = document.getElementById("theme-toggle");
    if (!toggle) return;
    toggle.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_KEY, nextTheme);
      applyTheme(nextTheme);
    });
  }

  function escapeHtml(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function getSearchUrl(engine, keyword) {
    const encoded = encodeURIComponent(keyword.trim());
    if (engine === "google") return `https://www.google.com/search?q=${encoded}`;
    return `https://www.bing.com/search?q=${encoded}`;
  }

  function renderLinkSection() {
    const categoryList = document.getElementById("category-list");
    const linkList = document.getElementById("link-list");
    if (!categoryList || !linkList) return;

    const categories = ["全部", ...(linksData.categories || [])];
    categoryList.innerHTML = categories
      .map((category) => {
        const activeClass = state.category === category ? "active" : "";
        return `<button type="button" class="category-btn ${activeClass}" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`;
      })
      .join("");

    let visibleLinks = linksData.links || [];
    if (state.category !== "全部") {
      visibleLinks = visibleLinks.filter((item) => item.category === state.category);
    }
    if (state.filter) {
      visibleLinks = visibleLinks.filter((item) =>
        item.name.toLowerCase().includes(state.filter.toLowerCase())
      );
    }

    linkList.innerHTML = visibleLinks
      .map((item) => {
        const statusClass = item.status === "up" ? "status-up" : "status-down";
        const statusText = item.status === "up" ? "可访问" : "不可访问";
        const lastCheckedText = item.lastChecked
          ? new Date(item.lastChecked).toLocaleString()
          : "未检测";
        return `
          <li class="link-item">
            <div class="link-row">
              <span class="status-dot ${statusClass}" aria-hidden="true"></span>
              <span class="sr-status">${statusText}</span>
              <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">
                ${escapeHtml(item.name)}
              </a>
            </div>
            <small class="link-last-checked">最后检查：${escapeHtml(lastCheckedText)}</small>
          </li>
        `;
      })
      .join("");
  }

  function updateActiveNav() {
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach((link) => {
      const href = new URL(link.href, window.location.origin).pathname.replace(/\/+$/, "") || "/";
      const isActive = path === href;
      link.classList.toggle("active", isActive);
      link.setAttribute("aria-current", isActive ? "page" : "false");
    });
  }

  function initSearch() {
    const searchForm = document.getElementById("search-form");
    const searchInput = document.getElementById("search-input");
    const engineButtons = document.querySelectorAll(".engine-btn");
    if (!searchForm || !searchInput) return;

    engineButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        state.engine = btn.dataset.engine || "bing";
        engineButtons.forEach((item) => item.classList.remove("active"));
        btn.classList.add("active");
      });
    });

    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const keyword = searchInput.value.trim();
      if (!keyword) return;
      window.open(getSearchUrl(state.engine, keyword), "_blank", "noopener,noreferrer");
    });
  }

  function initLinkFilters() {
    const categoryList = document.getElementById("category-list");
    const filterInput = document.getElementById("filter-input");
    if (!categoryList || !filterInput) return;

    categoryList.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const category = target.dataset.category;
      if (!category) return;
      state.category = category;
      renderLinkSection();
    });

    filterInput.addEventListener("input", () => {
      state.filter = filterInput.value;
      renderLinkSection();
    });

    renderLinkSection();
  }

  function initBlogFilter() {
    const filterInput = document.getElementById("blog-filter-input");
    if (!filterInput) return;
    const blogItems = Array.from(document.querySelectorAll(".blog-item"));
    filterInput.addEventListener("input", () => {
      const keyword = filterInput.value.trim().toLowerCase();
      blogItems.forEach((item) => {
        const title = item.dataset.title || "";
        const tags = item.dataset.tags || "";
        const visible = !keyword || title.includes(keyword) || tags.includes(keyword);
        item.style.display = visible ? "block" : "none";
      });
    });
  }

  function initMusicPlayer() {
    const player = document.getElementById("music-player");
    const audio = document.getElementById("audio-el");
    const songList = document.getElementById("song-list");
    const playToggle = document.getElementById("play-toggle");
    const prevSong = document.getElementById("prev-song");
    const nextSong = document.getElementById("next-song");
    const playModeToggle = document.getElementById("play-mode-toggle");
    const muteToggle = document.getElementById("mute-toggle");
    const volumeInput = document.getElementById("volume-input");
    const progressInput = document.getElementById("progress-input");
    const togglePlayer = document.getElementById("toggle-player");
    const songName = document.getElementById("song-name");
    const songArtist = document.getElementById("song-artist");
    const songCover = document.getElementById("song-cover");
    const lyricsPanel = document.getElementById("lyrics-panel");
    const currentTimeEl = document.getElementById("current-time");
    const totalTimeEl = document.getElementById("total-time");

    if (!player || !audio || !songList) return;

    const songs = musicData.songs || [];
    let currentIndex = 0;
    let hasUserInteracted = false;
    let currentLyrics = [];
    const playModes = ["list", "single", "random"];
    let playMode = "list";

    function nextPlayMode(currentMode) {
      const idx = playModes.indexOf(currentMode);
      return playModes[(idx + 1) % playModes.length];
    }

    function updatePlayModeButton() {
      if (!playModeToggle) return;
      if (playMode === "single") {
        playModeToggle.textContent = "🔂";
        playModeToggle.setAttribute("aria-label", "当前单曲循环，点击切换模式");
      } else if (playMode === "random") {
        playModeToggle.textContent = "🔀";
        playModeToggle.setAttribute("aria-label", "当前随机播放，点击切换模式");
      } else {
        playModeToggle.textContent = "🔁";
        playModeToggle.setAttribute("aria-label", "当前列表循环，点击切换模式");
      }
    }

    function formatTime(seconds) {
      if (!Number.isFinite(seconds)) return "00:00";
      const mm = Math.floor(seconds / 60);
      const ss = Math.floor(seconds % 60);
      return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
    }

    function parseLrc(content) {
      const lines = content.split(/\r?\n/);
      const result = [];
      for (const line of lines) {
        const match = line.match(/\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\](.*)/);
        if (!match) continue;
        const minute = Number(match[1]);
        const second = Number(match[2]);
        const ms = Number((match[3] || "0").padEnd(3, "0"));
        result.push({
          time: minute * 60 + second + ms / 1000,
          text: (match[4] || "").trim() || "..."
        });
      }
      return result.sort((a, b) => a.time - b.time);
    }

    function renderLyrics(lyrics) {
      if (!lyricsPanel) return;
      if (!lyrics.length) {
        lyricsPanel.innerHTML = '<p class="lyrics-line active">暂无歌词</p>';
        return;
      }
      lyricsPanel.innerHTML = lyrics
        .map((item, idx) => `<p class="lyrics-line" data-idx="${idx}">${escapeHtml(item.text)}</p>`)
        .join("");
    }

    async function loadLyrics(song) {
      if (!song.lyrics) {
        currentLyrics = [];
        renderLyrics(currentLyrics);
        return;
      }
      try {
        const res = await fetch(song.lyrics, { credentials: "same-origin" });
        if (!res.ok) throw new Error("lyrics not found");
        const text = await res.text();
        currentLyrics = parseLrc(text);
      } catch (error) {
        currentLyrics = [];
      }
      renderLyrics(currentLyrics);
    }

    function syncLyricsByTime(currentTime) {
      if (!lyricsPanel || !currentLyrics.length) return;
      let activeIndex = 0;
      for (let i = 0; i < currentLyrics.length; i += 1) {
        if (currentTime >= currentLyrics[i].time) activeIndex = i;
      }
      const lines = lyricsPanel.querySelectorAll(".lyrics-line");
      lines.forEach((line, idx) => {
        line.classList.toggle("active", idx === activeIndex);
      });
      const activeLine = lyricsPanel.querySelector(".lyrics-line.active");
      activeLine?.scrollIntoView({ block: "nearest" });
    }

    function renderSongs() {
      songList.innerHTML = songs
        .map((song, index) => {
          const activeClass = index === currentIndex ? "active" : "";
          return `<li class="song-item ${activeClass}" data-index="${index}">${escapeHtml(song.name)} - ${escapeHtml(song.artist)}</li>`;
        })
        .join("");
    }

    async function loadSong(index) {
      if (!songs[index]) return;
      currentIndex = index;
      const song = songs[currentIndex];
      audio.src = song.url;
      songName.textContent = song.name;
      songArtist.textContent = song.artist;
      if (songCover) {
        songCover.src = song.cover || "";
      }
      currentTimeEl.textContent = "00:00";
      totalTimeEl.textContent = "00:00";
      await loadLyrics(song);
      renderSongs();
    }

    function tryAutoPlayMuted() {
      audio.muted = true;
      audio.play().catch(() => {
        // 中文注释：浏览器阻止自动播放时，等待首次用户交互后再播放。
      });
    }

    if (songs.length > 0) {
      loadSong(0);
      tryAutoPlayMuted();
    }
    updatePlayModeButton();

    songList.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const index = Number(target.dataset.index);
      if (Number.isNaN(index)) return;
      loadSong(index);
      audio.play().catch(() => {});
    });

    playToggle?.addEventListener("click", () => {
      if (audio.paused) {
        audio.play().catch(() => {});
      } else {
        audio.pause();
      }
    });

    prevSong?.addEventListener("click", () => {
      if (!songs.length) return;
      const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
      loadSong(prevIndex);
      audio.play().catch(() => {});
    });

    nextSong?.addEventListener("click", () => {
      if (!songs.length) return;
      const nextIndex = playMode === "random"
        ? Math.floor(Math.random() * songs.length)
        : (currentIndex + 1) % songs.length;
      loadSong(nextIndex);
      audio.play().catch(() => {});
    });

    playModeToggle?.addEventListener("click", () => {
      playMode = nextPlayMode(playMode);
      updatePlayModeButton();
    });

    muteToggle?.addEventListener("click", () => {
      audio.muted = !audio.muted;
      muteToggle.textContent = audio.muted ? "🔇" : "🔊";
    });

    volumeInput?.addEventListener("input", () => {
      audio.volume = Number(volumeInput.value);
    });

    audio.addEventListener("timeupdate", () => {
      if (!audio.duration) return;
      progressInput.value = String((audio.currentTime / audio.duration) * 100);
      currentTimeEl.textContent = formatTime(audio.currentTime);
      totalTimeEl.textContent = formatTime(audio.duration);
      syncLyricsByTime(audio.currentTime);
    });

    audio.addEventListener("play", () => {
      player.classList.add("playing");
    });

    audio.addEventListener("pause", () => {
      player.classList.remove("playing");
    });

    progressInput?.addEventListener("input", () => {
      if (!audio.duration) return;
      audio.currentTime = (Number(progressInput.value) / 100) * audio.duration;
    });

    audio.addEventListener("ended", () => {
      if (!songs.length) return;
      if (playMode === "single") {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      }
      const nextIndex = playMode === "random"
        ? Math.floor(Math.random() * songs.length)
        : (currentIndex + 1) % songs.length;
      loadSong(nextIndex);
      audio.play().catch(() => {});
    });

    togglePlayer?.addEventListener("click", () => {
      player.classList.toggle("player-minimized");
      player.classList.toggle("player-maximized");
      togglePlayer.textContent = player.classList.contains("player-minimized") ? "＋" : "－";
    });

    document.addEventListener(
      "click",
      () => {
        if (hasUserInteracted) return;
        hasUserInteracted = true;
        audio.muted = false;
      },
      { once: true }
    );
  }

  function shouldInterceptLink(link) {
    if (!link) return false;
    const href = link.getAttribute("href") || "";
    if (!href || href.startsWith("#")) return false;
    if (link.target === "_blank") return false;
    if (link.hasAttribute("download")) return false;
    if (link.origin !== window.location.origin) return false;
    return true;
  }

  async function navigateWithoutReload(url) {
    try {
      const response = await fetch(url, { credentials: "same-origin" });
      if (!response.ok) throw new Error("Request failed");
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const newMain = doc.querySelector("#main-content");
      if (!newMain) throw new Error("Main area not found");

      const currentMain = document.querySelector("#main-content");
      if (!currentMain) throw new Error("Current main area missing");
      currentMain.innerHTML = newMain.innerHTML;
      document.title = doc.title;
      window.history.pushState({}, "", url);
      initPageFeatures();
      updateActiveNav();
    } catch (error) {
      window.location.href = url;
    }
  }

  function initSpaNavigation() {
    document.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest("a");
      if (!(link instanceof HTMLAnchorElement)) return;
      if (!shouldInterceptLink(link)) return;
      event.preventDefault();
      navigateWithoutReload(link.href);
    });

    window.addEventListener("popstate", () => {
      navigateWithoutReload(window.location.href);
    });
  }

  function initPageFeatures() {
    initSearch();
    initLinkFilters();
    initBlogFilter();
    updateActiveNav();
  }

  initPageFeatures();
  initTheme();
  initMusicPlayer();
  initSpaNavigation();
})();
