import { escapeHtml } from "./utils.js";

const state = {
  engine: "bing",
  category: "全部",
  filter: ""
};

function getSearchUrl(engine, keyword) {
  const encoded = encodeURIComponent(keyword.trim());
  if (engine === "google") return `https://www.google.com/search?q=${encoded}`;
  return `https://www.bing.com/search?q=${encoded}`;
}

function renderLinkSection(linksData) {
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

export function initSearch() {
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

export function initLinkFilters(linksData) {
  const categoryList = document.getElementById("category-list");
  const filterInput = document.getElementById("filter-input");
  if (!categoryList || !filterInput) return;

  categoryList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const category = target.dataset.category;
    if (!category) return;
    state.category = category;
    renderLinkSection(linksData);
  });

  filterInput.addEventListener("input", () => {
    state.filter = filterInput.value;
    renderLinkSection(linksData);
  });

  renderLinkSection(linksData);
}
