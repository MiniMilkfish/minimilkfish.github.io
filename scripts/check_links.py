import json
from datetime import datetime, timezone
from urllib.parse import urlparse

import requests

JSON_PATH = "_data/links.json"
TIMEOUT = 5
FAVICON_API = "https://www.google.com/s2/favicons?domain={domain}&sz=64"


def check_url(url):
    try:
        response = requests.get(url, timeout=TIMEOUT, allow_redirects=True)
        return "up" if 200 <= response.status_code < 400 else "down"
    except requests.RequestException:
        return "down"


def get_favicon_url(url):
    """Get favicon URL for a given site URL using Google's favicon service."""
    try:
        domain = urlparse(url).hostname
        if not domain:
            return ""
        return FAVICON_API.format(domain=domain)
    except Exception:
        return ""


def main():
    with open(JSON_PATH, "r", encoding="utf-8") as file:
        data = json.load(file)

    changed = False
    now = datetime.now(timezone.utc).isoformat()
    for link in data.get("links", []):
        url = link.get("url", "")

        # Check status
        new_status = check_url(url)
        if link.get("status") != new_status:
            link["status"] = new_status
            changed = True
        link["lastChecked"] = now

        # Update favicon icon if empty or missing
        if not link.get("icon"):
            new_icon = get_favicon_url(url)
            if new_icon:
                link["icon"] = new_icon
                changed = True

    if changed:
        with open(JSON_PATH, "w", encoding="utf-8") as file:
            json.dump(data, file, indent=2, ensure_ascii=False)
        print("Updated statuses and/or icons.")
    else:
        print("No changes.")


if __name__ == "__main__":
    main()
