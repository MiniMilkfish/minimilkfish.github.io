import { escapeHtml, formatTime } from "./utils.js";

/* ============================================
   LRC Parser
   ============================================ */
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

/* ============================================
   localStorage Keys
   ============================================ */
const STORAGE_KEY = "toolwall-player-state";

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 静默失败
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/* ============================================
   SVG Icons
   ============================================ */
const ICON_PLAY = `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>`;
const ICON_PAUSE = `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="3" width="4" height="18"/><rect x="15" y="3" width="4" height="18"/></svg>`;
const ICON_PLAY_MINI = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>`;
const ICON_PAUSE_MINI = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="3" width="4" height="18"/><rect x="15" y="3" width="4" height="18"/></svg>`;

/* ============================================
   Main Player Init
   ============================================ */
export function initMusicPlayer(musicData) {
  /* ---- DOM refs ---- */
  const audio = document.getElementById("audio-el");
  const miniEl = document.getElementById("player-mini");
  const expandedEl = document.getElementById("player-expanded");

  if (!audio || !miniEl || !expandedEl) return;

  // Mini mode elements
  const miniCover = document.getElementById("mini-cover");
  const miniSongName = document.getElementById("mini-song-name");
  const miniSongArtist = document.getElementById("mini-song-artist");
  const miniPlayToggle = document.getElementById("mini-play-toggle");
  const miniExpandBtn = document.getElementById("mini-expand-btn");
  const miniProgressFill = document.getElementById("mini-progress-fill");
  const audioVisualizer = document.getElementById("audio-visualizer");

  // Expanded mode elements
  const expandedBg = document.getElementById("expanded-bg");
  const expandedCover = document.getElementById("expanded-cover");
  const expandedSongName = document.getElementById("expanded-song-name");
  const expandedSongArtist = document.getElementById("expanded-song-artist");
  const expandedLyrics = document.getElementById("expanded-lyrics");
  const expandedCollapse = document.getElementById("expanded-collapse");
  const progressTrack = document.getElementById("progress-track");
  const progressFill = document.getElementById("progress-fill");
  const currentTimeEl = document.getElementById("current-time");
  const totalTimeEl = document.getElementById("total-time");
  const playToggle = document.getElementById("play-toggle");
  const prevSong = document.getElementById("prev-song");
  const nextSong = document.getElementById("next-song");
  const playModeToggle = document.getElementById("play-mode-toggle");
  const muteToggle = document.getElementById("mute-toggle");
  const volumeInput = document.getElementById("volume-input");
  const volumeDown = document.getElementById("volume-down");
  const volumeUp = document.getElementById("volume-up");
  const playlistToggle = document.getElementById("playlist-toggle");
  const playlistPanel = document.getElementById("expanded-playlist");

  /* ---- State ---- */
  const songs = musicData.songs || [];
  let currentIndex = 0;
  let currentLyrics = [];
  let hasUserInteracted = false;
  let isPlaylistOpen = false;
  let lastSaveTime = 0;

  const playModes = ["list", "single", "random"];
  const playModeIcons = { list: "🔁", single: "🔂", random: "🔀" };
  const playModeLabels = { list: "列表循环", single: "单曲循环", random: "随机播放" };
  let playMode = "list";

  /* ---- Restore State ---- */
  const saved = loadState();
  if (saved) {
    if (saved.currentIndex != null && saved.currentIndex < songs.length) {
      currentIndex = saved.currentIndex;
    }
    if (saved.volume != null) {
      audio.volume = saved.volume;
      if (volumeInput) volumeInput.value = String(saved.volume);
    }
    if (saved.muted != null) {
      audio.muted = saved.muted;
    }
    if (saved.playMode && playModes.includes(saved.playMode)) {
      playMode = saved.playMode;
    }
  }

  /* ---- Helper: Persist state ---- */
  function persistState() {
    saveState({
      currentIndex,
      currentTime: audio.currentTime || 0,
      volume: audio.volume,
      muted: audio.muted,
      playMode,
    });
  }

  /* ---- Mode switching ---- */
  function showExpanded() {
    expandedEl.classList.remove("hidden");
    miniEl.classList.add("hidden");
    document.body.style.overflow = "hidden";
  }

  function showMini() {
    expandedEl.classList.add("hidden");
    miniEl.classList.remove("hidden");
    document.body.style.overflow = "";
  }

  /* ---- Play mode ---- */
  function nextPlayMode() {
    const idx = playModes.indexOf(playMode);
    playMode = playModes[(idx + 1) % playModes.length];
    updatePlayModeUI();
    persistState();
  }

  function updatePlayModeUI() {
    if (!playModeToggle) return;
    playModeToggle.textContent = playModeIcons[playMode];
    playModeToggle.setAttribute("aria-label", `当前${playModeLabels[playMode]}，点击切换模式`);
    playModeToggle.classList.toggle("active-mode", playMode !== "list");
  }

  /* ---- Update all song info UI ---- */
  function updateSongUI(song) {
    const coverUrl = song.cover || "";
    const defaultCover = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23374151'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='central' text-anchor='middle' font-size='48' fill='%236b7280'%3E♫%3C/text%3E%3C/svg%3E";

    // Mini mode
    if (miniCover) miniCover.src = coverUrl || defaultCover;
    if (miniSongName) miniSongName.textContent = song.name;
    if (miniSongArtist) miniSongArtist.textContent = song.artist;

    // Expanded mode
    if (expandedCover) expandedCover.src = coverUrl || defaultCover;
    if (expandedSongName) expandedSongName.textContent = song.name;
    if (expandedSongArtist) expandedSongArtist.textContent = song.artist;
    if (expandedBg) {
      expandedBg.style.backgroundImage = coverUrl ? `url('${coverUrl}')` : "none";
    }
  }

  /* ---- Update play/pause button icons ---- */
  function updatePlayPauseUI(isPlaying) {
    if (miniPlayToggle) miniPlayToggle.innerHTML = isPlaying ? ICON_PAUSE_MINI : ICON_PLAY_MINI;
    if (playToggle) playToggle.innerHTML = isPlaying ? ICON_PAUSE : ICON_PLAY;

    // Visualizer
    if (audioVisualizer) {
      audioVisualizer.classList.toggle("active", isPlaying);
    }

    // Cover spin
    if (expandedCover) {
      expandedCover.classList.toggle("spinning", isPlaying);
    }
  }

  /* ---- Mute UI ---- */
  function updateMuteUI() {
    if (muteToggle) {
      muteToggle.textContent = audio.muted ? "🔇" : "🔊";
    }
  }

  /* ---- Lyrics ---- */
  function renderLyrics(lyrics) {
    if (!expandedLyrics) return;
    if (!lyrics.length) {
      expandedLyrics.innerHTML = '<p class="lyrics-empty">暂无歌词</p>';
      return;
    }
    expandedLyrics.innerHTML = lyrics
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
    } catch {
      currentLyrics = [];
    }
    renderLyrics(currentLyrics);
  }

  function syncLyricsByTime(currentTime) {
    if (!expandedLyrics || !currentLyrics.length) return;
    let activeIndex = 0;
    for (let i = 0; i < currentLyrics.length; i += 1) {
      if (currentTime >= currentLyrics[i].time) activeIndex = i;
    }
    const lines = expandedLyrics.querySelectorAll(".lyrics-line");
    lines.forEach((line, idx) => {
      const isActive = idx === activeIndex;
      if (line.classList.contains("active") !== isActive) {
        line.classList.toggle("active", isActive);
        if (isActive) {
          line.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    });
  }

  /* ---- Playlist ---- */
  function renderPlaylist() {
    if (!playlistPanel) return;
    playlistPanel.innerHTML = songs
      .map((song, index) => {
        const isActive = index === currentIndex;
        return `
          <div class="playlist-item${isActive ? " active" : ""}" data-index="${index}">
            <span class="playlist-item-index">${isActive ? "♫" : index + 1}</span>
            <div class="playlist-item-info">
              <div class="playlist-item-name">${escapeHtml(song.name)}</div>
              <div class="playlist-item-artist">${escapeHtml(song.artist)}</div>
            </div>
            ${isActive ? '<span class="playlist-item-status">播放中</span>' : ""}
          </div>`;
      })
      .join("");

    // Auto scroll to active
    requestAnimationFrame(() => {
      const activeItem = playlistPanel.querySelector(".playlist-item.active");
      if (activeItem) {
        activeItem.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    });
  }

  /* ---- Load song ---- */
  async function loadSong(index) {
    if (!songs[index]) return;
    currentIndex = index;
    const song = songs[currentIndex];
    audio.src = song.url;
    updateSongUI(song);
    if (currentTimeEl) currentTimeEl.textContent = "00:00";
    if (totalTimeEl) totalTimeEl.textContent = "00:00";
    if (progressFill) progressFill.style.width = "0%";
    if (miniProgressFill) miniProgressFill.style.width = "0%";
    await loadLyrics(song);
    renderPlaylist();
    persistState();
  }

  function getNextIndex() {
    if (!songs.length) return 0;
    if (playMode === "random") return Math.floor(Math.random() * songs.length);
    return (currentIndex + 1) % songs.length;
  }

  /* ---- Auto play muted ---- */
  function tryAutoPlayMuted() {
    audio.muted = true;
    updateMuteUI();
    audio.play().catch(() => {
      // 浏览器阻止自动播放，等待用户交互
    });
  }

  /* ---- Progress bar drag ---- */
  let isDragging = false;

  function handleProgressInteraction(event) {
    if (!audio.duration || !progressTrack) return;
    const rect = progressTrack.getBoundingClientRect();
    const x = (event.clientX || event.touches?.[0]?.clientX || 0) - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    audio.currentTime = ratio * audio.duration;
  }

  if (progressTrack) {
    progressTrack.addEventListener("mousedown", (e) => {
      isDragging = true;
      handleProgressInteraction(e);
    });

    progressTrack.addEventListener("touchstart", (e) => {
      isDragging = true;
      handleProgressInteraction(e);
    }, { passive: true });

    document.addEventListener("mousemove", (e) => {
      if (isDragging) handleProgressInteraction(e);
    });

    document.addEventListener("touchmove", (e) => {
      if (isDragging) handleProgressInteraction(e);
    }, { passive: true });

    document.addEventListener("mouseup", () => { isDragging = false; });
    document.addEventListener("touchend", () => { isDragging = false; });
  }

  /* ============================================
     Event Bindings
     ============================================ */

  // -- Mini mode: Play/Pause --
  miniPlayToggle?.addEventListener("click", () => {
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  });

  // -- Mini mode: Expand --
  miniExpandBtn?.addEventListener("click", () => {
    showExpanded();
  });

  // -- Expanded mode: Collapse --
  expandedCollapse?.addEventListener("click", () => {
    showMini();
  });

  // -- Click overlay to collapse --
  expandedEl?.addEventListener("click", (e) => {
    if (e.target === expandedEl || e.target.classList.contains("expanded-overlay")) {
      showMini();
    }
  });

  // -- Expanded: Play/Pause --
  playToggle?.addEventListener("click", () => {
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  });

  // -- Prev / Next --
  prevSong?.addEventListener("click", () => {
    if (!songs.length) return;
    const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
    loadSong(prevIndex);
    audio.play().catch(() => {});
  });

  nextSong?.addEventListener("click", () => {
    if (!songs.length) return;
    const nextIndex = getNextIndex();
    loadSong(nextIndex);
    audio.play().catch(() => {});
  });

  // -- Play mode --
  playModeToggle?.addEventListener("click", () => {
    nextPlayMode();
  });

  // -- Mute --
  muteToggle?.addEventListener("click", () => {
    audio.muted = !audio.muted;
    updateMuteUI();
    persistState();
  });

  // -- Volume slider --
  volumeInput?.addEventListener("input", () => {
    audio.volume = Number(volumeInput.value);
    audio.muted = false;
    updateMuteUI();
    persistState();
  });

  // -- Volume +/- buttons --
  volumeDown?.addEventListener("click", () => {
    audio.volume = Math.max(0, audio.volume - 0.1);
    if (volumeInput) volumeInput.value = String(audio.volume);
    persistState();
  });

  volumeUp?.addEventListener("click", () => {
    audio.volume = Math.min(1, audio.volume + 0.1);
    if (volumeInput) volumeInput.value = String(audio.volume);
    persistState();
  });

  // -- Playlist toggle --
  playlistToggle?.addEventListener("click", () => {
    isPlaylistOpen = !isPlaylistOpen;
    playlistPanel?.classList.toggle("open", isPlaylistOpen);
    if (playlistToggle) {
      playlistToggle.textContent = isPlaylistOpen ? "播放列表 ▾" : "播放列表 ▴";
    }
  });

  // -- Playlist item click --
  playlistPanel?.addEventListener("click", (e) => {
    const target = e.target instanceof Element ? e.target.closest(".playlist-item") : null;
    if (!target) return;
    const index = Number(target.dataset.index);
    if (Number.isNaN(index)) return;
    loadSong(index);
    audio.play().catch(() => {});
  });

  /* ---- Audio events ---- */
  audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;
    const percent = (audio.currentTime / audio.duration) * 100;

    // Update progress bars
    if (progressFill && !isDragging) progressFill.style.width = `${percent}%`;
    if (miniProgressFill) miniProgressFill.style.width = `${percent}%`;

    // Update time display
    if (currentTimeEl) currentTimeEl.textContent = formatTime(audio.currentTime);
    if (totalTimeEl) totalTimeEl.textContent = formatTime(audio.duration);

    // Sync lyrics
    syncLyricsByTime(audio.currentTime);

    // Throttled state save (every 2 seconds)
    const now = Date.now();
    if (now - lastSaveTime > 2000) {
      lastSaveTime = now;
      persistState();
    }
  });

  audio.addEventListener("play", () => {
    updatePlayPauseUI(true);
  });

  audio.addEventListener("pause", () => {
    updatePlayPauseUI(false);
  });

  audio.addEventListener("ended", () => {
    if (!songs.length) return;
    if (playMode === "single") {
      audio.currentTime = 0;
      audio.play().catch(() => {});
      return;
    }
    const nextIndex = getNextIndex();
    loadSong(nextIndex);
    audio.play().catch(() => {});
  });

  /* ---- First user interaction: unmute ---- */
  document.addEventListener(
    "click",
    () => {
      if (hasUserInteracted) return;
      hasUserInteracted = true;
      if (audio.muted) {
        audio.muted = false;
        updateMuteUI();
      }
    },
    { once: true }
  );

  /* ---- Keyboard shortcuts ---- */
  document.addEventListener("keydown", (e) => {
    // Don't capture when user is typing in input/textarea
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    switch (e.code) {
      case "Space":
        e.preventDefault();
        if (audio.paused) {
          audio.play().catch(() => {});
        } else {
          audio.pause();
        }
        break;
      case "ArrowLeft":
        if (audio.duration) audio.currentTime = Math.max(0, audio.currentTime - 5);
        break;
      case "ArrowRight":
        if (audio.duration) audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
        break;
      case "Escape":
        if (!expandedEl.classList.contains("hidden")) {
          showMini();
        }
        break;
    }
  });

  /* ---- Initialize ---- */
  updatePlayModeUI();
  updateMuteUI();
  updatePlayPauseUI(false);

  if (songs.length > 0) {
    loadSong(currentIndex);

    // Restore playback position
    if (saved?.currentTime) {
      audio.addEventListener("loadedmetadata", () => {
        if (saved.currentTime < audio.duration) {
          audio.currentTime = saved.currentTime;
        }
      }, { once: true });
    }

    tryAutoPlayMuted();
  }
}
