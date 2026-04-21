import { escapeHtml, formatTime } from "./utils.js";

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

export function initMusicPlayer(musicData) {
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

  function getNextIndex() {
    if (!songs.length) return 0;
    if (playMode === "random") return Math.floor(Math.random() * songs.length);
    return (currentIndex + 1) % songs.length;
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
    const nextIndex = getNextIndex();
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
    const nextIndex = getNextIndex();
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
