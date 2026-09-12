#!/usr/bin/env python3
from __future__ import annotations

import subprocess
from datetime import date
from pathlib import Path
from urllib.parse import quote
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://jingsuanliangzi.com"
EXCLUDED_DIRS = {"assets", "customer-portal", "admin", "private", ".github", "scripts", ".git"}
EXCLUDED_FILES = {"404.html"}


def is_public_html(path: Path) -> bool:
    rel = path.relative_to(ROOT)
    if path.name in EXCLUDED_FILES:
        return False
    if any(part in EXCLUDED_DIRS or part.startswith("_") for part in rel.parts[:-1]):
        return False
    return path.suffix.lower() in {".html", ".htm"}


def url_for(path: Path) -> str:
    rel = path.relative_to(ROOT).as_posix()
    if rel == "index.html":
        return BASE + "/"
    if rel.endswith("/index.html"):
        rel = rel[:-10]
    return BASE + "/" + quote(rel, safe="/-._~")


def lastmod_for(path: Path) -> str:
    rel = path.relative_to(ROOT).as_posix()
    try:
        value = subprocess.check_output(
            ["git", "log", "-1", "--format=%cs", "--", rel],
            cwd=ROOT,
            text=True,
            stderr=subprocess.DEVNULL,
        ).strip()
        if value:
            return value
    except Exception:
        pass
    try:
        return date.fromtimestamp(path.stat().st_mtime).isoformat()
    except Exception:
        return date.today().isoformat()


def main() -> None:
    pages = sorted((p for p in ROOT.rglob("*.htm*") if is_public_html(p)), key=url_for)

    ET.register_namespace("", "http://www.sitemaps.org/schemas/sitemap/0.9")
    ns = "http://www.sitemaps.org/schemas/sitemap/0.9"
    urlset = ET.Element(f"{{{ns}}}urlset")

    for page in pages:
        node = ET.SubElement(urlset, f"{{{ns}}}url")
        ET.SubElement(node, f"{{{ns}}}loc").text = url_for(page)
        ET.SubElement(node, f"{{{ns}}}lastmod").text = lastmod_for(page)

    tree = ET.ElementTree(urlset)
    ET.indent(tree, space="  ")
    target = ROOT / "sitemap.xml"
    tree.write(target, encoding="utf-8", xml_declaration=True)
    print(f"Generated {target} with {len(pages)} public HTML URLs")


if __name__ == "__main__":
    main()
