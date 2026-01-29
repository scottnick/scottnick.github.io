import json
import os
import re
from datetime import datetime
from urllib.parse import quote

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUTPUT_PATH = os.path.join(REPO_ROOT, "site-index.json")

EXCLUDE_FILES = {
    "index.html",
    "categories.html",
    "category.html",
    "cpp.html",
}

TAG_RE = re.compile(r'class="post-tag"[^>]*>\s*([^<]+?)\s*<', re.IGNORECASE)
TITLE_H1_RE = re.compile(r"<h1[^>]*>\s*([^<]+?)\s*</h1>", re.IGNORECASE)
TITLE_TAG_RE = re.compile(r"<title[^>]*>\s*([^<]+?)\s*</title>", re.IGNORECASE)
DATE_RE = re.compile(r'<span class="meta-value">\s*(\d{4}-\d{2}-\d{2})\s*</span>')


def to_url_path(fs_rel_path: str) -> str:
    parts = fs_rel_path.replace("\\", "/").split("/")
    parts = [quote(p) for p in parts]
    return "/".join(parts)


def extract_folder(fs_rel_path: str) -> str:
    normalized = fs_rel_path.replace("\\", "/")
    if "/" not in normalized:
        return ""
    return normalized.rsplit("/", 1)[0]


def is_article_html(content: str) -> bool:
    if 'class="post-tag"' not in content:
        return False
    return True


def extract_title(content: str) -> str:
    match = TITLE_H1_RE.search(content)
    if match:
        return match.group(1).strip()
    match = TITLE_TAG_RE.search(content)
    if match:
        return match.group(1).strip()
    return ""


def extract_date(content: str) -> str:
    match = DATE_RE.search(content)
    if match:
        return match.group(1).strip()
    return ""


def extract_tags(content: str):
    tags = [tag.strip() for tag in TAG_RE.findall(content)]
    seen = set()
    output = []
    for tag in tags:
        if tag and tag not in seen:
            seen.add(tag)
            output.append(tag)
    return output


def main():
    posts = []
    folder_counts = {}

    for root, _, files in os.walk(REPO_ROOT):
        for filename in files:
            if not filename.lower().endswith(".html"):
                continue
            if filename in EXCLUDE_FILES:
                continue

            abs_path = os.path.join(root, filename)
            rel_path = os.path.relpath(abs_path, REPO_ROOT)
            rel_path_norm = rel_path.replace("\\", "/")

            try:
                with open(abs_path, "r", encoding="utf-8") as handle:
                    content = handle.read()
            except Exception:
                continue

            if not is_article_html(content):
                continue

            url_path = to_url_path(rel_path_norm)

            posts.append(
                {
                    "path": url_path,
                    "title": extract_title(content),
                    "date": extract_date(content),
                    "tags": extract_tags(content),
                    "folder": extract_folder(rel_path_norm),
                }
            )

    cpp_root = os.path.join(REPO_ROOT, "cpp-notes")
    if os.path.isdir(cpp_root):
        for folder in os.listdir(cpp_root):
            folder_abs = os.path.join(cpp_root, folder)
            if not os.path.isdir(folder_abs):
                continue

            count = 0
            for root, _, files in os.walk(folder_abs):
                for filename in files:
                    if not filename.lower().endswith(".html"):
                        continue
                    if filename.lower() == "index.html":
                        continue

                    abs_path = os.path.join(root, filename)
                    try:
                        with open(abs_path, "r", encoding="utf-8") as handle:
                            content = handle.read()
                        if is_article_html(content):
                            count += 1
                    except Exception:
                        continue

            folder_url = quote(folder)
            folder_counts[f"cpp-notes/{folder_url}/index.html"] = count

    data = {
        "buildId": datetime.utcnow().strftime("%Y%m%d%H%M%S"),
        "generatedAt": datetime.utcnow().isoformat() + "Z",
        "posts": posts,
        "folderCounts": folder_counts,
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as handle:
        json.dump(data, handle, ensure_ascii=False, indent=2)

    print(f"✅ Generated {OUTPUT_PATH} with {len(posts)} posts")


if __name__ == "__main__":
    main()
