import os
from datetime import datetime, timezone
from urllib.parse import quote

BASE_URL = "https://scottnick.github.io"

# 不想收錄的資料夾（可自行增減）
EXCLUDE_DIRS = {
    ".git", ".github", "vendor", "node_modules", "scripts"
}

# 不想收錄的檔案（可自行增減）
EXCLUDE_FILES = {
    "404.html",
}

def should_exclude(rel_path: str) -> bool:
    """
    rel_path 會長得像 "cpp-notes/all problems/xxx.html"
    這裡用 "/" 來切比較穩，不吃 OS 的路徑分隔符差異。
    """
    parts = rel_path.split("/")
    return any(p in EXCLUDE_DIRS for p in parts)

def main():
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # scripts/ 的上一層
    urls = []

    for root, dirs, files in os.walk(repo_root):
        # 排除資料夾（走訪時就先砍掉）
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

        for fn in files:
            if not fn.endswith(".html"):
                continue
            if fn in EXCLUDE_FILES:
                continue

            full_path = os.path.join(root, fn)

            # 產生 repo 相對路徑（統一用 "/"）
            rel_path = os.path.relpath(full_path, repo_root).replace(os.sep, "/")

            # 排除 scripts/ 之類不該被當網頁的地方（保險）
            if should_exclude(rel_path):
                continue

            # URL encoding：把空白等特殊字元轉成 %20…，但保留 "/" 讓路徑結構不被編碼
            rel_path_url = quote(rel_path, safe="/")

            # GitHub Pages：index.html 通常用 / 也能進
            if rel_path == "index.html":
                url = f"{BASE_URL}/"
            else:
                url = f"{BASE_URL}/{rel_path_url}"

            # 取檔案最後修改時間（UTC）
            mtime = datetime.fromtimestamp(os.path.getmtime(full_path), tz=timezone.utc)
            lastmod = mtime.strftime("%Y-%m-%dT%H:%M:%SZ")

            urls.append((url, lastmod))

    # 排序讓 diff 穩定
    urls.sort(key=lambda x: x[0])

    # 生成 sitemap.xml
    out_path = os.path.join(repo_root, "sitemap.xml")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
        f.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
        for url, lastmod in urls:
            f.write("  <url>\n")
            f.write(f"    <loc>{url}</loc>\n")
            f.write(f"    <lastmod>{lastmod}</lastmod>\n")
            f.write("  </url>\n")
        f.write("</urlset>\n")

    print(f"✅ Generated {out_path} with {len(urls)} URLs")

if __name__ == "__main__":
    main()
