import re
import ssl
import urllib.request
from pathlib import Path
from urllib.parse import urljoin

ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / "public" / "brand"
BRAND.mkdir(parents=True, exist_ok=True)

ctx = ssl.create_default_context()
headers = {"User-Agent": "Mozilla/5.0"}

req = urllib.request.Request("https://www.lcwu.edu.pk/", headers=headers)
html = urllib.request.urlopen(req, context=ctx, timeout=30).read().decode("utf-8", "ignore")

imgs = re.findall(
    r"""(?:src|href)=["']([^"']+\.(?:png|jpg|jpeg|svg|webp))["']""",
    html,
    flags=re.I,
)
print("image refs:", len(imgs))
for u in imgs[:50]:
    print(u)

candidates = []
for u in imgs:
    low = u.lower()
    if any(k in low for k in ("logo", "brand", "crest", "seal", "lcwu")):
        candidates.append(urljoin("https://www.lcwu.edu.pk/", u))

# common fallbacks
candidates += [
    "https://www.lcwu.edu.pk/images/logo.png",
    "https://upload.wikimedia.org/wikipedia/en/8/8e/Lahore_College_for_Women_University_logo.png",
]

seen = set()
for url in candidates:
    if url in seen:
        continue
    seen.add(url)
    try:
        r = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(r, context=ctx, timeout=20) as resp:
            data = resp.read()
            ctype = resp.headers.get_content_type()
        if len(data) < 1000:
            print("tiny", url, len(data))
            continue
        ext = ".png"
        if "jpeg" in ctype or url.lower().endswith(".jpg"):
            ext = ".jpg"
        elif "svg" in ctype or url.lower().endswith(".svg"):
            ext = ".svg"
        path = BRAND / f"lcwu-logo{ext}"
        path.write_bytes(data)
        print("SAVED", url, "->", path, len(data))
        break
    except Exception as exc:
        print("fail", url, exc)
else:
    print("No logo downloaded")
