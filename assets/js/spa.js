function shouldInterceptLink(link) {
  if (!link) return false;
  const href = link.getAttribute("href") || "";
  if (!href || href.startsWith("#")) return false;
  if (link.target === "_blank") return false;
  if (link.hasAttribute("download")) return false;
  if (link.origin !== window.location.origin) return false;
  return true;
}

export function updateActiveNav() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach((link) => {
    const href = new URL(link.href, window.location.origin).pathname.replace(/\/+$/, "") || "/";
    const isActive = path === href;
    link.classList.toggle("active", isActive);
    link.setAttribute("aria-current", isActive ? "page" : "false");
  });
}

export async function navigateWithoutReload(url, onPageReinit, replaceHistory = false) {
  try {
    const response = await fetch(url, { credentials: "same-origin" });
    if (!response.ok) throw new Error("Request failed");
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const newMain = doc.querySelector("#main-content");
    if (!newMain) throw new Error("Main area not found");

    const currentMain = document.querySelector("#main-content");
    if (!currentMain) throw new Error("Current main area missing");
    currentMain.innerHTML = newMain.innerHTML;
    document.title = doc.title;
    if (replaceHistory) {
      window.history.replaceState({}, "", url);
    } else {
      window.history.pushState({}, "", url);
    }
    onPageReinit();
    updateActiveNav();
  } catch (error) {
    window.location.href = url;
  }
}

export function initSpaNavigation(onPageReinit) {
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest("a");
    if (!(link instanceof HTMLAnchorElement)) return;
    if (!shouldInterceptLink(link)) return;
    event.preventDefault();
    navigateWithoutReload(link.href, onPageReinit, false);
  });

  window.addEventListener("popstate", () => {
    navigateWithoutReload(window.location.href, onPageReinit, true);
  });
}
