"""Split semester pack PDFs into per-course PDFs + download LCWU logo."""
from __future__ import annotations

import ssl
import urllib.request
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
PAPERS = ROOT / "public" / "papers"
BY_COURSE = PAPERS / "by-course"
BRAND = ROOT / "public" / "brand"
BY_COURSE.mkdir(parents=True, exist_ok=True)
BRAND.mkdir(parents=True, exist_ok=True)

# page indices are 0-based inclusive ranges
SPLITS = {
    "sem-3.pdf": [
        ("intro-to-management-mid-2024.pdf", [0]),
        ("applied-physics-mid-2024.pdf", [1]),
        ("applied-physics-final-2024.pdf", [2]),
        ("intro-to-management-final-2024.pdf", [3, 4, 5]),
        ("data-structures-final-2024.pdf", [6]),
        ("calculus-final-2025.pdf", [7]),
        ("artificial-intelligence-final-2024.pdf", [8]),
    ],
    "sem-4.pdf": [
        ("civics-paper.pdf", [0]),
        ("database-systems-mid-2025.pdf", [1]),
        ("operating-systems-final-2025.pdf", [2, 3]),
        ("pakistan-studies-final-2025.pdf", [4]),
        ("entrepreneurship-final-2025.pdf", [5]),
        ("professional-practices-final-2025.pdf", [6]),
        ("civics-mid-2025.pdf", [7]),
    ],
    "sem-5.pdf": [
        ("computer-architecture-mid-2025.pdf", [0]),
        ("advance-database-systems-final-2025.pdf", [1]),
        ("technical-business-writing-final.pdf", [2]),
        # start page then continuation (scanner order was continuation first)
        ("database-systems-final-2025.pdf", [4, 3]),
        ("computer-architecture-final.pdf", [5]),
        ("information-security-final-2025.pdf", [6]),
        ("computer-graphics-mid-2025.pdf", [7]),
    ],
}

LOGO_CANDIDATES = [
    "https://www.lcwu.edu.pk/images/logo.png",
    "https://www.lcwu.edu.pk/images/lcwu-logo.png",
    "https://www.lcwu.edu.pk/assets/images/logo.png",
    "https://www.lcwu.edu.pk/wp-content/uploads/logo.png",
    "https://www.lcwu.edu.pk/img/logo.png",
    "https://upload.wikimedia.org/wikipedia/en/thumb/8/8e/Lahore_College_for_Women_University_logo.png/220px-Lahore_College_for_Women_University_logo.png",
]


def split_pdfs() -> None:
    for pack_name, items in SPLITS.items():
        src = PAPERS / pack_name
        doc = fitz.open(src)
        print(f"{pack_name}: {doc.page_count} pages")
        for out_name, pages in items:
            out = fitz.open()
            for p in pages:
                if p >= doc.page_count:
                    raise SystemExit(f"Missing page {p} in {pack_name}")
                out.insert_pdf(doc, from_page=p, to_page=p)
            dest = BY_COURSE / out_name
            out.save(dest)
            out.close()
            print(f"  -> {out_name} ({len(pages)} page)")
        doc.close()


def download_logo() -> Path | None:
    ctx = ssl.create_default_context()
    for url in LOGO_CANDIDATES:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, context=ctx, timeout=20) as resp:
                data = resp.read()
                ctype = resp.headers.get_content_type()
            if len(data) < 800:
                continue
            ext = ".png"
            if "jpeg" in ctype or "jpg" in ctype:
                ext = ".jpg"
            elif "svg" in ctype:
                ext = ".svg"
            elif "webp" in ctype:
                ext = ".webp"
            path = BRAND / f"lcwu-logo{ext}"
            path.write_bytes(data)
            print(f"Logo saved from {url} -> {path} ({len(data)} bytes)")
            return path
        except Exception as exc:
            print(f"skip {url}: {exc}")
    return None


if __name__ == "__main__":
    split_pdfs()
    download_logo()
