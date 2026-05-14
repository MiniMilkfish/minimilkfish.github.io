import { initTheme } from "./theme.js";
import { initSearch, initLinkFilters } from "./links.js";
import { initBlogFilter } from "./blog.js";
import { initFoodPicker } from "./food.js";
import { initMusicPlayer } from "./player.js";
import { initSpaNavigation, updateActiveNav } from "./spa.js";

const linksData = window.linksData || { categories: [], links: [] };
const musicData = window.musicData || { songs: [] };
const foodData = window.foodData || { categories: [] };

function initPageFeatures() {
  initSearch();
  initLinkFilters(linksData);
  initBlogFilter();
  initFoodPicker(foodData);
  updateActiveNav();
}

initPageFeatures();
initTheme();
initMusicPlayer(musicData);
initSpaNavigation(initPageFeatures);
