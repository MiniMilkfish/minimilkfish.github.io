import { initTheme } from "./theme.js";
import { initSearch, initLinkFilters } from "./links.js";
import { initBlogFilter } from "./blog.js";
import { initMusicPlayer } from "./player.js";
import { initSpaNavigation, updateActiveNav } from "./spa.js";

const linksData = window.linksData || { categories: [], links: [] };
const musicData = window.musicData || { songs: [] };

function initPageFeatures() {
  initSearch();
  initLinkFilters(linksData);
  initBlogFilter();
  updateActiveNav();
}

initPageFeatures();
initTheme();
initMusicPlayer(musicData);
initSpaNavigation(initPageFeatures);
