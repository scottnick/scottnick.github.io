import os
from datetime import datetime, timezone
from urllib.parse import quote
from xml.sax.saxutils import escape as xml_escape

BASE_URL = "https://scottnick.github.io"

# 不想收錄的資料夾
EXCLUDE_DIRS = {
    ".git", ".github", "vendor", "node_modules",
    "scripts",
}

# 不想收錄的檔案（可自行增減）
EXCLUDE_FILES = {
    "404.html",
    # 注意：index.html 不放進 sitemap（避免 /index.html 與 / 重複）
    "index.html",
}

# Sitemap 限制（依 Google 規範）
MAX_URLS_PER_SITEMAP = 50000

def to_posix(path: str) -> str:
    return path.replace("\\", "/")

def should_exclude_rel(rel_path: str) -> bool:
    parts = to_posix(rel_path).split("/")
    return any(p in EXCLUDE_DIRS for p in parts)

def to_url_path(rel_path: str) -> str:
    # URL encode 每一段路徑，避免中文/空白/特殊字元造成 sitemap 非法
    parts = to_posix(rel_path).split("/")
    return "/".join(quote(p) for p in parts)

def get_lastmod_utc(file_path: str) -> str:
    mtime = datetime.fromtimestamp(os.path.getmtime(file_path), tz=timezone.utc)
    return mtime.strftime("%Y-%m-%dT%H:%M:%SZ")

def write_sitemap(out_path: str, url_items: list[tuple[str, str]]) -> None:
    with open(out_path, "w", encoding="utf-8", newline="\n") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
        f.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
        for url, lastmod in url_items:
            f.write("  <url>\n")
            f.write(f"    <loc>{xml_escape(url)}</loc>\n")
            f.write(f"    <lastmod>{xml_escape(lastmod)}</lastmod>\n")
            f.write("  </url>\n")
        f.write("</urlset>\n")

def write_sitemap_index(out_path: str, sitemap_urls: list[tuple[str, str]]) -> None:
    # sitemap_urls: [(sitemap_url, lastmod), ...]
    with open(out_path, "w", encoding="utf-8", newline="\n") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
        f.write('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
        for sm_url, lastmod in sitemap_urls:
            f.write("  <sitemap>\n")
            f.write(f"    <loc>{xml_escape(sm_url)}</loc>\n")
            f.write(f"    <lastmod>{xml_escape(lastmod)}</lastmod>\n")
            f.write("  </sitemap>\n")
        f.write("</sitemapindex>\n")

def main():
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # scripts/ 的上一層

    urls: list[tuple[str, str]] = []
    seen = set()

    # 1) 一定收錄首頁 "/"
    index_path = os.path.join(repo_root, "index.html")
    if os.path.isfile(index_path):
        home_url = f"{BASE_URL}/"
        home_lastmod = get_lastmod_utc(index_path)
        urls.append((home_url, home_lastmod))
        seen.add(home_url)

    # 2) 掃描所有 html
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

            # 只允許一般 html（不做資料夾 index.html canonical，因為你站是靜態 .html 為主）
            url = f"{BASE_URL}/{url_path}"

            if url in seen:
                continue

            lastmod = get_lastmod_utc(full_path)
            urls.append((url, lastmod))
            seen.add(url)

    # 3) 排序穩定
    urls.sort(key=lambda x: x[0])

    # 4) 輸出：若超過上限就拆分 + sitemap_index.xml
    if len(urls) <= MAX_URLS_PER_SITEMAP:
        out_path = os.path.join(repo_root, "sitemap.xml")
        write_sitemap(out_path, urls)
        print(f"✅ Generated {out_path} with {len(urls)} URLs")
    else:
        # 產生多份 sitemap-n.xml
        sitemap_files = []
        for i in range(0, len(urls), MAX_URLS_PER_SITEMAP):
            chunk = urls[i:i + MAX_URLS_PER_SITEMAP]
            n = i // MAX_URLS_PER_SITEMAP + 1
            filename = f"sitemap-{n}.xml"
            out_path = os.path.join(repo_root, filename)
            write_sitemap(out_path, chunk)

            # sitemap 檔的 lastmod 用 chunk 最晚的 lastmod
            lastmod = max(item[1] for item in chunk)
            sitemap_files.append((f"{BASE_URL}/{filename}", lastmod))

        # sitemap index
        index_path_out = os.path.join(repo_root, "sitemap_index.xml")
        write_sitemap_index(index_path_out, sitemap_files)
        print(f"✅ Generated {index_path_out} with {len(sitemap_files)} sitemap parts; total URLs={len(urls)}")

if __name__ == "__main__":
    main()
