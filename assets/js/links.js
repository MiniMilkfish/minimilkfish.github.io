import { escapeHtml } from "./utils.js";

const FAVICON_API = "https://www.google.com/s2/favicons?domain={domain}&sz=64";
const state = { engine: "bing", category: "全部", filter: "" };

function getDomain(url) {
  try { return new URL(url).hostname; } catch { return ""; }
}

function getFaviconUrl(link) {
  if (link.icon) return link.icon;
  const domain = getDomain(link.url);
  return domain ? FAVICON_API.replace("{domain}", domain) : "";
}

function getSearchUrl(engine, keyword) {
  const q = encodeURIComponent(keyword.trim());
  if (engine === "google") return `https://www.google.com/search?q=${q}`;
  if (engine === "duck") return `https://duckduckgo.com/?q=${q}`;
  return `https://www.bing.com/search?q=${q}`;
}

function renderCards(linksData) {
  const grid = document.getElementById("link-grid");
  const categoryList = document.getElementById("category-list");
  if (!grid || !categoryList) return;

  const categories = ["全部", ...(linksData.categories || [])];
  categoryList.innerHTML = categories
    .map(c => `<button type="button" class="category-btn ${state.category === c ? "active" : ""}" data-category="${escapeHtml(c)}">${escapeHtml(c)}</button>`)
    .join("");

  let links = linksData.links || [];
  if (state.category !== "全部") links = links.filter(l => l.category === state.category);
  if (state.filter) links = links.filter(l => l.name.toLowerCase().includes(state.filter.toLowerCase()));

  grid.innerHTML = links.map(l => {
    const isUp = l.status === "up";
    const statusCls = isUp ? "up" : "down";
    const statusLabel = isUp ? "ONLINE" : "OFFLINE";
    const dotCls = isUp ? "status-up" : "status-down";
    const favicon = getFaviconUrl(l);
    const iconHtml = favicon
      ? `<img class="link-card-icon" src="${escapeHtml(favicon)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/><span class="link-card-icon-placeholder" style="display:none">${escapeHtml(l.name.charAt(0))}</span>`
      : `<span class="link-card-icon-placeholder">${escapeHtml(l.name.charAt(0))}</span>`;
    return `<a class="link-card" href="${escapeHtml(l.url)}" target="_blank" rel="noopener noreferrer">
      <div class="link-card-header">
        ${iconHtml}
        <span class="link-card-status ${statusCls}"><span class="status-dot ${dotCls}"></span>${statusLabel}</span>
      </div>
      <div class="link-card-name">${escapeHtml(l.name)}</div>
      <div class="link-card-desc">${escapeHtml(l.description || "")}</div>
    </a>`;
  }).join("");
}

function renderDropdown(linksData, query) {
  const dd = document.getElementById("search-dropdown");
  if (!dd) return;
  if (!query) { dd.classList.remove("visible"); dd.innerHTML = ""; return; }
  const matches = (linksData.links || []).filter(l => l.name.toLowerCase().includes(query.toLowerCase())).slice(0, 6);
  if (!matches.length) { dd.classList.remove("visible"); dd.innerHTML = ""; return; }
  dd.innerHTML = matches.map(l => {
    const favicon = getFaviconUrl(l);
    return `<div class="search-dropdown-item" data-url="${escapeHtml(l.url)}">
      <img src="${escapeHtml(favicon)}" alt="" onerror="this.style.display='none'"/>
      <span class="sdi-name">${escapeHtml(l.name)}</span>
      <span class="sdi-desc">${escapeHtml(l.description || "")}</span>
    </div>`;
  }).join("");
  dd.classList.add("visible");
}

export function initSearch() {
  const form = document.getElementById("search-form");
  const input = document.getElementById("search-input");
  const dd = document.getElementById("search-dropdown");
  const engineBtns = document.querySelectorAll(".engine-btn");
  if (!form || !input) return;

  engineBtns.forEach(btn => btn.addEventListener("click", () => {
    state.engine = btn.dataset.engine || "bing";
    engineBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  }));

  form.addEventListener("submit", e => {
    e.preventDefault();
    const kw = input.value.trim();
    if (!kw) return;
    if (dd) dd.classList.remove("visible");
    window.open(getSearchUrl(state.engine, kw), "_blank", "noopener,noreferrer");
  });

  const linksData = window.linksData || { categories: [], links: [] };
  input.addEventListener("input", () => renderDropdown(linksData, input.value.trim()));
  input.addEventListener("focus", () => { if (input.value.trim()) renderDropdown(linksData, input.value.trim()); });
  document.addEventListener("click", e => { if (dd && !form.contains(e.target) && !dd.contains(e.target)) dd.classList.remove("visible"); });
  if (dd) dd.addEventListener("click", e => {
    const item = e.target.closest(".search-dropdown-item");
    if (item?.dataset.url) { window.open(item.dataset.url, "_blank", "noopener,noreferrer"); dd.classList.remove("visible"); }
  });

  // Keyboard shortcut: press "/" to focus search
  document.addEventListener("keydown", e => {
    if (e.key === "/" && document.activeElement !== input && !["INPUT","TEXTAREA"].includes(document.activeElement?.tagName)) {
      e.preventDefault(); input.focus();
    }
  });
}

export function initLinkFilters(linksData) {
  const categoryList = document.getElementById("category-list");
  if (!categoryList) return;

  categoryList.addEventListener("click", e => {
    const cat = e.target.dataset?.category;
    if (!cat) return;
    state.category = cat;
    renderCards(linksData);
  });

  renderCards(linksData);

  // Set current date
  const dateEl = document.getElementById("current-date");
  if (dateEl) {
    const now = new Date();
    dateEl.textContent = `当前日期: ${now.getFullYear()}年${String(now.getMonth()+1).padStart(2,"0")}月${String(now.getDate()).padStart(2,"0")}日`;
  }
}
