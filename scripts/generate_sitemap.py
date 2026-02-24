import os
from datetime import datetime, timezone
from urllib.parse import quote
from xml.sax.saxutils import escape as xml_escape

BASE_URL = "https://scottnick.github.io"

# 不想收錄的資料夾
EXCLUDE_DIRS = {
    ".git", ".github", "vendor", "node_modules",
    # 保險：這些不是要讓搜尋引擎收錄的網站頁面
    "scripts",
}

# 不想收錄的檔案（可自行增減）
EXCLUDE_FILES = {
    "404.html",
    "index.html",  # 你會用 "/" 代表首頁，保留避免重複即可
}

def should_exclude(rel_path: str) -> bool:
    parts = rel_path.replace("\\", "/").split("/")
    return any(p in EXCLUDE_DIRS for p in parts)

def to_url_path(rel_path: str) -> str:
    # URL encode 每一段路徑，避免中文/空白/特殊字元造成 sitemap 非法
    parts = rel_path.replace("\\", "/").split("/")
    parts = [quote(p) for p in parts]
    return "/".join(parts)

def get_lastmod_utc(file_path: str) -> str:
    mtime = datetime.fromtimestamp(os.path.getmtime(file_path), tz=timezone.utc)
    return mtime.strftime("%Y-%m-%dT%H:%M:%SZ")

def main():
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # scripts/ 的上一層
    urls = []

    for root, dirs, files in os.walk(repo_root):
        # 排除資料夾
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

        for fn in files:
            if not fn.lower().endswith(".html"):
                continue
            if fn in EXCLUDE_FILES:
                continue

            full_path = os.path.join(root, fn)
            rel_path = os.path.relpath(full_path, repo_root).replace("\\", "/")

            if should_exclude(rel_path):
                continue

            url_path = to_url_path(rel_path)

            # canonical 規則：
            # 1) 根目錄 index.html -> /
            # 2) 任意資料夾的 xxx/index.html -> /xxx/
            # 3) 其他 html -> /path/file.html
            if url_path == "index.html":
                url = f"{BASE_URL}/"
            elif url_path.endswith("/index.html"):
                url = f"{BASE_URL}/{url_path[:-len('index.html')]}"  # 保留結尾 /
            else:
                url = f"{BASE_URL}/{url_path}"

            lastmod = get_lastmod_utc(full_path)
            urls.append((url, lastmod))

    # 排序，讓 diff 穩定
    urls.sort(key=lambda x: x[0])

    out_path = os.path.join(repo_root, "sitemap.xml")
    with open(out_path, "w", encoding="utf-8", newline="\n") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
        f.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
        for url, lastmod in urls:
            # XML 必須 escape（理論上 URL 不太會有 & < >，但保險做）
            f.write("  <url>\n")
            f.write(f"    <loc>{xml_escape(url)}</loc>\n")
            f.write(f"    <lastmod>{xml_escape(lastmod)}</lastmod>\n")
            f.write("  </url>\n")
        f.write("</urlset>\n")

    print(f"✅ Generated {out_path} with {len(urls)} URLs")

if __name__ == "__main__":
    main()
