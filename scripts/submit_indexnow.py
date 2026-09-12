#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
HOST = "jingsuanliangzi.com"
BASE = f"https://{HOST}"
KEY = "f1dd121e46623df934b3b7cc91fead54"
KEY_LOCATION = f"{BASE}/{KEY}.txt"
ENDPOINT = "https://api.indexnow.org/indexnow"
EXCLUDED_DIRS = {"assets", "customer-portal", "admin", "private", ".github", "scripts", ".git"}
EXCLUDED_FILES = {"404.html"}


def path_to_url(raw: str) -> str | None:
    path = Path(raw)
    if path.suffix.lower() not in {".html", ".htm"}:
        return None
    if path.name in EXCLUDED_FILES:
        return None
    if any(part in EXCLUDED_DIRS or part.startswith("_") for part in path.parts[:-1]):
        return None
    rel = path.as_posix()
    if rel == "index.html":
        return BASE + "/"
    if rel.endswith("/index.html"):
        rel = rel[:-10]
    return BASE + "/" + quote(rel, safe="/-._~")


def all_sitemap_urls() -> list[str]:
    sm = ROOT / "sitemap.xml"
    if not sm.exists():
        return [BASE + "/"]
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    tree = ET.parse(sm)
    return [n.text.strip() for n in tree.findall("sm:url/sm:loc", ns) if n.text]


def changed_urls() -> list[str]:
    before = os.environ.get("BEFORE_SHA", "").strip()
    after = os.environ.get("AFTER_SHA", "").strip()
    zero = "0" * 40
    if not before or before == zero or not after:
        return all_sitemap_urls()

    try:
        diff = subprocess.check_output(
            ["git", "diff", "--name-status", "-M", before, after],
            cwd=ROOT,
            text=True,
            stderr=subprocess.STDOUT,
        )
    except subprocess.CalledProcessError as exc:
        print("Could not calculate git diff; submitting sitemap URLs instead.")
        print(exc.output)
        return all_sitemap_urls()

    urls: set[str] = set()
    for line in diff.splitlines():
        if not line.strip():
            continue
        parts = line.split("\t")
        status = parts[0]
        if status.startswith("R") and len(parts) >= 3:
            for raw in (parts[1], parts[2]):
                u = path_to_url(raw)
                if u:
                    urls.add(u)
        elif len(parts) >= 2:
            u = path_to_url(parts[1])
            if u:
                urls.add(u)
    return sorted(urls)


def submit(urls: list[str]) -> int:
    if not urls:
        print("No public HTML URL changed; IndexNow submission skipped.")
        return 0

    payload = {
        "host": HOST,
        "key": KEY,
        "keyLocation": KEY_LOCATION,
        "urlList": urls[:10000],
    }
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = Request(
        ENDPOINT,
        data=data,
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "User-Agent": "JingsuanQuantum-IndexNow/1.0",
        },
        method="POST",
    )
    try:
        with urlopen(req, timeout=30) as resp:
            code = resp.getcode()
            body = resp.read().decode("utf-8", errors="replace")
        print(f"IndexNow HTTP {code}; submitted {len(urls)} URL(s).")
        if body:
            print(body[:1000])
        return 0 if code in (200, 202) else 1
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        print(f"IndexNow HTTP {exc.code}: {body[:1000]}")
        return 1
    except URLError as exc:
        print(f"IndexNow network error: {exc}")
        return 1


def main() -> None:
    urls = changed_urls()
    print("URLs selected for IndexNow:")
    for u in urls:
        print(" -", u)
    sys.exit(submit(urls))


if __name__ == "__main__":
    main()
