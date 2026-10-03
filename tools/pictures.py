#!/usr/bin/env python3
"""pictures.py — fetches the chosen Commons pictures at 1200 px and writes tools/photos.json.
Each keeps its author and licence. Run once; the files live in docs/img/."""
import io
import json
import os
import sys
import time
import urllib.parse
import urllib.request

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
UA = {"User-Agent": "research-bot/1.0"}
LIC = {"CC BY-SA 3.0": "https://creativecommons.org/licenses/by-sa/3.0/", "CC BY-SA 2.0": "https://creativecommons.org/licenses/by-sa/2.0/",
       "CC BY 2.0": "https://creativecommons.org/licenses/by/2.0/", "CC BY 3.0": "https://creativecommons.org/licenses/by/3.0/",
       "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0/", "CC0": "https://creativecommons.org/publicdomain/zero/1.0/", "Public domain": ""}


def main(picks_path, research_path):
    picks = json.load(open(picks_path))
    pics = {p["file_page"]: p for p in json.load(open(research_path))["pictures"]}
    out = []
    os.makedirs(os.path.join(HERE, "..", "docs", "img"), exist_ok=True)
    for i, k in enumerate(picks, 1):
        p = pics[k["page"]]
        name = urllib.parse.unquote(p["file_page"].split("File:")[1])
        url = "https://commons.wikimedia.org/wiki/Special:FilePath/" + urllib.parse.quote(name) + "?width=1200"
        dest = f"{i:02d}-{k['slug']}.jpg"
        path = os.path.join(HERE, "..", "docs", "img", dest)
        if not os.path.exists(path):
            data = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()
            im = Image.open(io.BytesIO(data)).convert("RGB")
            im.thumbnail((1200, 1200))
            im.save(path, "JPEG", quality=80, optimize=True, progressive=True)
            time.sleep(1)
        im = Image.open(path)
        out.append({"file": dest, "width": im.width, "height": im.height, "author": p["author"], "license": p["licence"],
                    "license_url": LIC.get(p["licence"], ""), "commons_page": p["file_page"], "caption_en": k["en"], "caption_th": k["th"]})
        print(dest, im.size)
    json.dump(out, open(os.path.join(HERE, "photos.json"), "w"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
