import json
from datetime import datetime, timezone

import requests

JSON_PATH = "_data/links.json"
TIMEOUT = 5


def check_url(url):
    try:
        response = requests.get(url, timeout=TIMEOUT, allow_redirects=True)
        return "up" if 200 <= response.status_code < 400 else "down"
    except requests.RequestException:
        return "down"


def main():
    with open(JSON_PATH, "r", encoding="utf-8") as file:
        data = json.load(file)

    changed = False
    now = datetime.now(timezone.utc).isoformat()
    for link in data.get("links", []):
        new_status = check_url(link.get("url", ""))
        if link.get("status") != new_status:
            link["status"] = new_status
            changed = True
        link["lastChecked"] = now

    if changed:
        with open(JSON_PATH, "w", encoding="utf-8") as file:
            json.dump(data, file, indent=2, ensure_ascii=False)
        print("Updated statuses.")
    else:
        print("No status changes.")


if __name__ == "__main__":
    main()
