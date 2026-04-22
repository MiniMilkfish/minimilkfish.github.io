export function initBlogFilter() {
  const filterInput = document.getElementById("blog-filter-input");
  if (!filterInput) return;
  const blogCards = Array.from(document.querySelectorAll(".blog-card"));
  filterInput.addEventListener("input", () => {
    const keyword = filterInput.value.trim().toLowerCase();
    blogCards.forEach((card) => {
      const title = card.dataset.title || "";
      const tags = card.dataset.tags || "";
      const visible = !keyword || title.includes(keyword) || tags.includes(keyword);
      card.style.display = visible ? "flex" : "none";
    });
  });
}
