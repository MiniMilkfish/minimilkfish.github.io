import { escapeHtml } from "./utils.js";

const DEFAULT_ACCENTS = [
  { accent: "#38bdf8", accentDark: "#0f766e" },
  { accent: "#fb7185", accentDark: "#be123c" },
  { accent: "#4ade80", accentDark: "#15803d" },
  { accent: "#f59e0b", accentDark: "#b45309" },
  { accent: "#a78bfa", accentDark: "#6d28d9" },
  { accent: "#22d3ee", accentDark: "#155e75" }
];

const foodState = {
  root: null,
  categories: [],
  categoryIndex: 0,
  activeIndex: 0,
  drag: null
};

function wrapIndex(index, length) {
  if (!length) return 0;
  return ((index % length) + length) % length;
}

function normalizeItem(item, category, itemIndex) {
  if (typeof item === "string") {
    return {
      name: item,
      note: "",
      tags: [category.name, `第 ${itemIndex + 1} 项`]
    };
  }

  return {
    name: item?.name || `菜品 ${itemIndex + 1}`,
    note: item?.note || "",
    tags: Array.isArray(item?.tags) && item.tags.length ? item.tags : [category.name]
  };
}

function normalizeCategories(foodData = {}) {
  return (foodData.categories || [])
    .map((category, categoryIndex) => {
      const fallback = DEFAULT_ACCENTS[categoryIndex % DEFAULT_ACCENTS.length];
      const items = (category.items || [])
        .map((item, itemIndex) => normalizeItem(item, category, itemIndex))
        .filter((item) => item.name);

      return {
        name: category.name || `分类 ${categoryIndex + 1}`,
        description: category.description || "今天可以从这里挑一个。",
        accent: category.accent || fallback.accent,
        accentDark: category.accentDark || fallback.accentDark,
        items
      };
    })
    .filter((category) => category.items.length > 0);
}

function getCurrentCategory() {
  return foodState.categories[foodState.categoryIndex] || null;
}

function getCurrentItems() {
  return getCurrentCategory()?.items || [];
}

function getVisibleIndices(items) {
  const count = Math.min(4, items.length);
  return Array.from({ length: count }, (_, offset) =>
    wrapIndex(foodState.activeIndex + offset, items.length)
  );
}

function buildCardStyle(category, stackIndex) {
  const translateY = stackIndex * 18;
  const translateZ = stackIndex * -40;
  const scale = 1 - stackIndex * 0.05;
  const rotate = stackIndex * -3;
  const opacity = Math.max(0.24, 1 - stackIndex * 0.18);

  return [
    `--food-accent:${category.accent}`,
    `--food-accent-dark:${category.accentDark}`,
    `z-index:${100 - stackIndex}`,
    `opacity:${opacity}`,
    `transform:translate3d(0, ${translateY}px, ${translateZ}px) rotate(${rotate}deg) scale(${scale})`
  ].join(";");
}

function renderCategoryButtons(root) {
  const categoryList = root.querySelector("#food-category-list");
  if (!categoryList) return;

  categoryList.innerHTML = foodState.categories
    .map((category, index) => {
      const activeClass = index === foodState.categoryIndex ? "active" : "";
      return `<button
        type="button"
        class="food-category-btn ${activeClass}"
        data-food-category="${index}"
        aria-pressed="${index === foodState.categoryIndex ? "true" : "false"}"
      >${escapeHtml(category.name)}</button>`;
    })
    .join("");
}

function renderFoodList(root, category, items) {
  const titleEl = root.querySelector("#food-list-title");
  const descEl = root.querySelector("#food-list-desc");
  const countEl = root.querySelector("#food-list-count");
  const listEl = root.querySelector("#food-list");

  if (!titleEl || !descEl || !countEl || !listEl) return;

  titleEl.textContent = category?.name || "食物列表";
  descEl.textContent = category?.description || "点击可跳到对应卡片";
  countEl.textContent = `共 ${items.length} 项`;

  if (!items.length) {
    listEl.innerHTML = `<div class="food-empty">当前分类还没有食物数据。</div>`;
    return;
  }

  listEl.innerHTML = items
    .map((item, index) => {
      const activeClass = index === foodState.activeIndex ? "active" : "";
      const note = item.note || category.description || "";
      return `<button
        type="button"
        class="food-list-item ${activeClass}"
        data-food-index="${index}"
      >
        <div class="food-list-name">${escapeHtml(item.name)}</div>
        <div class="food-list-note">${escapeHtml(note)}</div>
      </button>`;
    })
    .join("");
}

function renderStack(root, category, items) {
  const stage = root.querySelector("#food-stack-stage");
  const meta = root.querySelector("#food-stack-meta");
  if (!stage || !meta) return;

  if (!items.length) {
    stage.innerHTML = `<div class="food-empty">当前分类还没有食物数据。</div>`;
    meta.textContent = "等待配置食物数据";
    return;
  }

  const visibleIndices = getVisibleIndices(items);

  stage.innerHTML = [...visibleIndices]
    .reverse()
    .map((itemIndex, reverseIndex) => {
      const stackIndex = visibleIndices.length - reverseIndex - 1;
      const item = items[itemIndex];
      const isTop = stackIndex === 0;
      const tags = (item.tags || []).slice(0, 3);
      const tagsHtml = tags.length
        ? `<div class="food-card-tags">${tags
            .map((tag) => `<span class="food-card-tag">${escapeHtml(tag)}</span>`)
            .join("")}</div>`
        : "";

      return `<article
        class="food-stack-card ${isTop ? "is-top" : ""}"
        data-food-card-index="${itemIndex}"
        style="${buildCardStyle(category, stackIndex)}"
        aria-hidden="${isTop ? "false" : "true"}"
      >
        <div class="food-card-top">
          <div class="food-card-kicker">${escapeHtml(category.name)}</div>
          <h3 class="food-card-name">${escapeHtml(item.name)}</h3>
          <p class="food-card-note">${escapeHtml(item.note || category.description || "今天就吃这个。")}</p>
          ${tagsHtml}
        </div>
        <div class="food-card-bottom">
          <div class="food-card-index">${itemIndex + 1} / ${items.length}</div>
          <div class="food-card-hint">左右滑动切换，或点击下方列表定位</div>
        </div>
      </article>`;
    })
    .join("");

  meta.textContent = `当前分类：${category.name} · 共 ${items.length} 项`;
}

function render(root) {
  if (!root) return;

  const category = getCurrentCategory();
  const items = getCurrentItems();

  renderCategoryButtons(root);
  renderFoodList(root, category, items);
  renderStack(root, category, items);
}

function moveActive(delta) {
  const items = getCurrentItems();
  if (!items.length) return;
  foodState.activeIndex = wrapIndex(foodState.activeIndex + delta, items.length);
  render(foodState.root);
}

function setCategory(index) {
  if (!foodState.categories.length) return;
  foodState.categoryIndex = wrapIndex(index, foodState.categories.length);
  foodState.activeIndex = 0;
  render(foodState.root);
}

function setActive(index) {
  const items = getCurrentItems();
  if (!items.length) return;
  foodState.activeIndex = wrapIndex(index, items.length);
  render(foodState.root);
}

function randomPick() {
  const items = getCurrentItems();
  if (items.length <= 1) return;

  let next = foodState.activeIndex;
  while (next === foodState.activeIndex) {
    next = Math.floor(Math.random() * items.length);
  }

  foodState.activeIndex = next;
  render(foodState.root);
}

function resetFollowers(stage) {
  const cards = Array.from(stage.querySelectorAll(".food-stack-card"));
  cards.forEach((card, index) => {
    if (card.classList.contains("is-top")) return;
    const stackIndex = index;
    const translateY = stackIndex * 18;
    const translateZ = stackIndex * -40;
    const scale = 1 - stackIndex * 0.05;
    const rotate = stackIndex * -3;
    card.style.transform = `translate3d(0, ${translateY}px, ${translateZ}px) rotate(${rotate}deg) scale(${scale})`;
    card.style.opacity = String(Math.max(0.24, 1 - stackIndex * 0.18));
  });
}

function handleRootClick(event) {
  const categoryBtn = event.target.closest("[data-food-category]");
  if (categoryBtn) {
    setCategory(Number(categoryBtn.dataset.foodCategory));
    return;
  }

  const listBtn = event.target.closest("[data-food-index]");
  if (listBtn) {
    setActive(Number(listBtn.dataset.foodIndex));
    return;
  }

  const actionBtn = event.target.closest("[data-food-action]");
  if (!actionBtn) return;

  const action = actionBtn.dataset.foodAction;
  if (action === "prev") moveActive(-1);
  if (action === "next") moveActive(1);
  if (action === "random") randomPick();
}

function handlePointerDown(event) {
  const card = event.target.closest(".food-stack-card.is-top");
  if (!card) return;
  if (event.pointerType === "mouse" && event.button !== 0) return;

  foodState.drag = {
    pointerId: event.pointerId,
    card,
    stage: card.parentElement,
    startX: event.clientX,
    startY: event.clientY,
    dx: 0,
    dy: 0
  };

  card.classList.add("is-dragging");
  if (typeof card.setPointerCapture === "function") {
    card.setPointerCapture(event.pointerId);
  }
}

function handlePointerMove(event) {
  const drag = foodState.drag;
  if (!drag || drag.pointerId !== event.pointerId) return;

  drag.dx = event.clientX - drag.startX;
  drag.dy = event.clientY - drag.startY;

  const rotate = drag.dx * 0.08;
  const lift = Math.min(Math.abs(drag.dx) * 0.04, 18);
  const progress = Math.min(Math.abs(drag.dx) / 180, 1);

  drag.card.style.transform = `translate3d(${drag.dx}px, ${drag.dy - lift}px, 0) rotate(${rotate}deg)`;
  drag.card.style.opacity = String(Math.max(0.5, 1 - Math.abs(drag.dx) / 260));

  const followers = Array.from(drag.stage.querySelectorAll(".food-stack-card:not(.is-top)"));
  followers.forEach((card, index) => {
    const stackIndex = index + 1;
    const translateY = stackIndex * 18 - progress * 10;
    const translateX = progress * (index === 0 ? 8 : 4);
    const translateZ = stackIndex * -40;
    const scale = 1 - stackIndex * 0.05 + progress * 0.02;
    const rotateFollower = stackIndex * -3 + progress * 1.5;

    card.style.transform = `translate3d(${translateX}px, ${translateY}px, ${translateZ}px) rotate(${rotateFollower}deg) scale(${scale})`;
    card.style.opacity = String(Math.max(0.28, 1 - stackIndex * 0.16 + progress * 0.08));
  });
}

function clearDrag(pointerId) {
  const drag = foodState.drag;
  if (!drag) return null;

  if (
    typeof drag.card.releasePointerCapture === "function" &&
    drag.card.hasPointerCapture?.(pointerId)
  ) {
    drag.card.releasePointerCapture(pointerId);
  }

  drag.card.classList.remove("is-dragging");
  foodState.drag = null;
  return drag;
}

function handlePointerEnd(event) {
  const drag = foodState.drag;
  if (!drag || drag.pointerId !== event.pointerId) return;

  const released = clearDrag(event.pointerId);
  if (!released) return;

  const threshold = Math.min(140, window.innerWidth * 0.22);
  const direction = released.dx >= 0 ? 1 : -1;

  if (Math.abs(released.dx) >= threshold) {
    const exitX = direction * Math.max(window.innerWidth * 0.8, 320);
    released.card.style.transition = "transform .24s ease, opacity .24s ease";
    released.card.style.transform = `translate3d(${exitX}px, ${released.dy}px, 0) rotate(${direction * 22}deg)`;
    released.card.style.opacity = "0";
    released.card.addEventListener(
      "transitionend",
      () => {
        moveActive(direction > 0 ? 1 : -1);
      },
      { once: true }
    );
    return;
  }

  released.card.style.transition = "transform .24s ease, opacity .24s ease";
  released.card.style.transform = "translate3d(0, 0, 0) rotate(0deg)";
  released.card.style.opacity = "1";

  released.card.addEventListener(
    "transitionend",
    () => {
      if (released.stage) resetFollowers(released.stage);
      render(foodState.root);
    },
    { once: true }
  );
}

function bindEvents(root) {
  if (root.dataset.foodBound === "true") return;
  root.dataset.foodBound = "true";

  root.addEventListener("click", handleRootClick);
  root.addEventListener("pointerdown", handlePointerDown);
  root.addEventListener("pointermove", handlePointerMove);
  root.addEventListener("pointerup", handlePointerEnd);
  root.addEventListener("pointercancel", handlePointerEnd);
}

export function initFoodPicker(foodData) {
  const root = document.getElementById("food-picker");
  if (!root) return;

  const categories = normalizeCategories(foodData);
  foodState.root = root;
  foodState.categories = categories;
  foodState.categoryIndex = 0;
  foodState.activeIndex = 0;
  foodState.drag = null;

  bindEvents(root);
  render(root);
}