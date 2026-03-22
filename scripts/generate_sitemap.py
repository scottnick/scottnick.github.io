import os
from datetime import datetime, timezone
from urllib.parse import quote
from xml.sax.saxutils import escape as xml_escape

BASE_URL = "https://scottnick.github.io"

# 不想收錄的資料夾
EXCLUDE_DIRS = {
    ".git",
    ".github",
    "vendor",
    "node_modules",
    "scripts",
}

# 不想收錄的檔案
# 注意：index.html 不直接收，改由首頁 "/" 代表，避免 /index.html 與 / 重複
EXCLUDE_FILES = {
    "404.html",
    "index.html",
}

# 單一 sitemap 上限（Google 標準）
MAX_URLS_PER_SITEMAP = 50000


def to_posix(path: str) -> str:
    return path.replace("\\", "/")


def should_exclude_rel(rel_path: str) -> bool:
    parts = to_posix(rel_path).split("/")
    return any(p in EXCLUDE_DIRS for p in parts)


def to_url_path(rel_path: str) -> str:
    # 逐段 URL encode，避免空白、中文、特殊符號造成 sitemap 問題
    parts = to_posix(rel_path).split("/")
    return "/".join(quote(p) for p in parts)


def get_lastmod_utc(file_path: str) -> str:
    # 使用 RFC3339 / W3C Datetime 可接受格式
    mtime = datetime.fromtimestamp(os.path.getmtime(file_path), tz=timezone.utc)
    return mtime.strftime("%Y-%m-%dT%H:%M:%SZ")


def write_sitemap(out_path: str, url_items: list[tuple[str, str]]) -> None:
    with open(out_path, "w", encoding="utf-8", newline="\n") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
        f.write(
            '<urlset '
            'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
            'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" '
            'xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 '
            'http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n'
        )
        for url, lastmod in url_items:
            f.write("  <url>\n")
            f.write(f"    <loc>{xml_escape(url)}</loc>\n")
            f.write(f"    <lastmod>{xml_escape(lastmod)}</lastmod>\n")
            f.write("  </url>\n")
        f.write("</urlset>\n")


def write_sitemap_index(out_path: str, sitemap_urls: list[tuple[str, str]]) -> None:
    with open(out_path, "w", encoding="utf-8", newline="\n") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
        f.write(
            '<sitemapindex '
            'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
            'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" '
            'xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 '
            'http://www.sitemaps.org/schemas/sitemap/0.9/siteindex.xsd">\n'
        )
        for sm_url, lastmod in sitemap_urls:
            f.write("  <sitemap>\n")
            f.write(f"    <loc>{xml_escape(sm_url)}</loc>\n")
            f.write(f"    <lastmod>{xml_escape(lastmod)}</lastmod>\n")
            f.write("  </sitemap>\n")
        f.write("</sitemapindex>\n")


def collect_html_urls(repo_root: str) -> list[tuple[str, str]]:
    urls: list[tuple[str, str]] = []
    seen: set[str] = set()

    # 1) 首頁固定收錄為 "/"
    index_path = os.path.join(repo_root, "index.html")
    if os.path.isfile(index_path):
        home_url = f"{BASE_URL}/"
        home_lastmod = get_lastmod_utc(index_path)
        urls.append((home_url, home_lastmod))
        seen.add(home_url)

    # 2) 掃描所有 html，全部收錄（除了明確排除者）
    for root, dirs, files in os.walk(repo_root):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

        for fn in files:
            if not fn.lower().endswith(".html"):
                continue
            if fn in EXCLUDE_FILES:
                continue

            full_path = os.path.join(root, fn)
            if not os.path.isfile(full_path):
                continue

            rel_path = to_posix(os.path.relpath(full_path, repo_root))
            if should_exclude_rel(rel_path):
                continue

            url_path = to_url_path(rel_path)
            url = f"{BASE_URL}/{url_path}"

            if url in seen:
                continue

            lastmod = get_lastmod_utc(full_path)
            urls.append((url, lastmod))
            seen.add(url)

    # 3) 穩定排序
    urls.sort(key=lambda x: x[0])
    return urls


def main():
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    urls = collect_html_urls(repo_root)

    if len(urls) <= MAX_URLS_PER_SITEMAP:
        out_path = os.path.join(repo_root, "sitemap.xml")
        write_sitemap(out_path, urls)
        print(f"✅ Generated {out_path} with {len(urls)} URLs")
    else:
        sitemap_files: list[tuple[str, str]] = []

        for i in range(0, len(urls), MAX_URLS_PER_SITEMAP):
            chunk = urls[i:i + MAX_URLS_PER_SITEMAP]
            n = i // MAX_URLS_PER_SITEMAP + 1
            filename = f"sitemap-{n}.xml"
            out_path = os.path.join(repo_root, filename)
            write_sitemap(out_path, chunk)

            chunk_lastmod = max(item[1] for item in chunk)
            sitemap_files.append((f"{BASE_URL}/{filename}", chunk_lastmod))

        index_out_path = os.path.join(repo_root, "sitemap_index.xml")
        write_sitemap_index(index_out_path, sitemap_files)
        print(
            f"✅ Generated {index_out_path} with {len(sitemap_files)} sitemap parts; "
            f"total URLs={len(urls)}"
        )


if __name__ == "__main__":
    main()
