export function initBlogFilter() {
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
