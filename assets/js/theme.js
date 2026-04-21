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

export function initTheme() {
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
