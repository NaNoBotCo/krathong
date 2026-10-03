#!/usr/bin/env python3
"""build.py — writes docs/index.html (English) and docs/th/index.html (Thai), sitemap.xml,
robots.txt and llms.txt. All copy, both languages, is written by hand in copy.py.

Run:  python3 tools/build.py [--motdang]
"""
import html
import json
import os
import re
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from copy_text import UI, PHOTOS, SOURCES  # noqa: E402

SLUG = "krathong"
DOCS = os.path.join(HERE, "..", "docs")
GH = f"https://nanobotco.github.io/{SLUG}/"
CANON = f"https://motdang.net/sites/{SLUG}/"
MD_ROOT = f"/sites/{SLUG}/"
SIB = "https://motdang.net/sites/khom-loi/"
E = html.escape
CSS = open(os.path.join(HERE, "site.css")).read()
GOOGLE_ESCAPE = '<script>if(/[.]translate[.]goog$/.test(location.hostname))location.replace("https://"+location.hostname.slice(0,-15).replace(/--/g,"~").replace(/-/g,".").replace(/~/g,"-")+location.pathname+location.search.replace(/([?&])_x_tr_[^&]*/g,"$1").replace(/[?&]+$/,"").replace(/[?]&+/,"?")+location.hash)</script>'


def paras(ps):
    return "".join(f"<p>{p}</p>" for p in ps)


def rng(id_, label, lo, hi, step, val, out=None):
    o = f' <b id="{out}"></b>' if out else ""
    return f'<label class="lab" for="{id_}">{E(label)}{o}</label><input id="{id_}" type="range" min="{lo}" max="{hi}" step="{step}" value="{val}">'


def ro(label, id_):
    return f'<div><span>{E(label)}</span><b id="{id_}">–</b></div>'


def page(lang, md=False):
    u = UI[lang]
    root = MD_ROOT if md else ("" if lang == "en" else "../")
    url = CANON if lang == "en" else CANON + "th/"
    js = {k: u[k] for k in ("fold_steps", "petals_per_leaf", "coin_g", "b_sunk", "b_tips", "b_ok", "counts")}
    js["lang"] = lang
    nav = "".join(f'<a href="#{a}">{E(b)}</a>' for a, b in u["nav"])
    other = (MD_ROOT + ("th/" if lang == "en" else "")) if md else ("th/" if lang == "en" else "../")
    sib = ("/sites/khom-loi/" if md else SIB) + ("th/" if lang == "th" else "")
    sibicon = ("/sites/khom-loi/" if md else SIB) + "icon.svg"
    head = f'''<!doctype html><html lang="{lang}" translate="no" class="notranslate"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="google" content="notranslate">
{GOOGLE_ESCAPE}
<title>{E(u["title"])} · {E(u["other_title"])}</title>
<meta name="description" content="{E(u["desc"])}">
<meta name="theme-color" content="#06202e">
<link rel="canonical" href="{url}">
<link rel="alternate" hreflang="en" href="{CANON}"><link rel="alternate" hreflang="th" href="{CANON}th/"><link rel="alternate" hreflang="x-default" href="{CANON}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Krathong, Drawn · กระทง วาดด้วยคณิต">
<meta property="og:title" content="{E(u["title"])}"><meta property="og:description" content="{E(u["desc"])}"><meta property="og:url" content="{url}">
<meta property="og:image" content="{CANON}card.jpg"><meta property="og:image:secure_url" content="{CANON}card.jpg"><meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{E(u["card_alt"])}">
<meta property="og:locale" content="{"en_US" if lang == "en" else "th_TH"}"><meta property="og:locale:alternate" content="{"th_TH" if lang == "en" else "en_US"}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="{CANON}card.jpg">
<link rel="icon" href="{root}icon.svg" type="image/svg+xml">
<link rel="alternate" type="text/plain" href="{CANON}llms.txt" title="llms.txt">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Noto+Sans+Thai:wght@400;600;700&family=Noto+Serif+Thai:wght@600;700&display=swap" rel="stylesheet">
<script>if(/[?&]card/.test(location.search))document.documentElement.classList.add("card")</script>
<style>{CSS}</style>
</head><body>
<header class="top"><div class="in"><a class="brand" href="#top"><img src="{root}icon.svg" width="28" height="28" alt=""><span>{E(u["title"])}</span></a>
<nav aria-label="{E(u["nav_label"])}">{nav}</nav>
<span class="lang"><b>{E(u["lang_this"])}</b> | <a href="{other}" hreflang="{"th" if lang == "en" else "en"}">{E(u["lang_other"])}</a></span></div></header>
'''
    hero = f'''<section id="top" class="hero"><canvas id="scene" role="img" aria-label="{E(u["hero_alt"])}"></canvas>
<div class="hero-t"><p class="kick">{E(u["kicker"])}</p><h1>{E(u["title"])}</h1><p class="lede">{E(u["lede"])}</p><p class="hint">{E(u["hint"])}</p><p class="cardline">{E(u["cardline"])}<br><span>motdang.net/sites/{SLUG}</span></p></div></section>
'''
    what = f'''<section id="what" class="sec"><div class="in"><p class="kick">{E(u["what_kick"])}</p><h2>{E(u["what_h"])}</h2>{paras(u["what_p"])}</div></section>
'''
    steps = "".join(f'<button class="pill" type="button" data-fstep="{i}" aria-pressed="false">{i + 1}</button>' for i in range(len(u["fold_steps"])))
    fold = f'''<section id="fold" class="sec dark"><div class="in two"><div><canvas id="foldcv" class="cv" role="img" aria-label="{E(u["fo_h"])}"></canvas></div>
<div><p class="kick">{E(u["fo_kick"])}</p><h2>{E(u["fo_h"])}</h2>{paras(u["fo_p"])}
<div class="steps" role="group" aria-label="{E(u["fo_h"])}">{steps}<button id="fplay" class="pill hot" type="button">{E(u["play"])}</button></div>
<p id="foldtext" class="steptext" aria-live="polite"></p>{paras(u["fo_p2"])}<p class="note">{u["fo_note"]}</p></div></div></section>
'''
    ring = f'''<section id="rings" class="sec"><div class="in two"><div><canvas id="ringcv" class="cv" role="img" aria-label="{E(u["ri_h"])}"></canvas></div>
<div><p class="kick">{E(u["ri_kick"])}</p><h2>{E(u["ri_h"])}</h2>{paras(u["ri_p"])}
<p class="eq">{u["ri_eq"]}</p>
{rng("rd", u["r_d"], 12, 40, 1, 22, "rdo")}{rng("rw", u["r_w"], 15, 60, 1, 30, "rwo")}{rng("rn", u["r_n"], 1, 5, 1, 3, "rno")}{rng("rl", u["r_l"], 0, 60, 1, 35, "rlo")}
<div class="readout">{ro(u["r_per"], "rper")}{ro(u["r_tot"], "rtot")}{ro(u["r_leaf"], "rleaf")}</div>
<p class="note">{u["ri_note"]}</p></div></div></section>
'''
    flo = f'''<section id="float" class="sec rock"><div class="in"><p class="kick">{E(u["fl_kick"])}</p><h2>{E(u["fl_h"])}</h2>{paras(u["fl_p"])}
<p class="eq">{u["fl_eq"]}</p>
<canvas id="floatcv" class="cv" role="img" aria-label="{E(u["fl_h"])}"></canvas>
<p class="legend"><span><i style="background:#c2410c"></i>{E(u["b_g"])}</span><span><i style="background:#1d4ed8"></i>{E(u["b_m"])}</span></p>
<div class="readout" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr))"><div>{rng("bd", u["b_d"], 8, 50, 1, 25, "bdo")}</div><div>{rng("bt", u["b_t"], 1, 8, 0.5, 4, "bto")}</div><div>{rng("brho", u["b_rho"], 300, 950, 10, u["rho_default"], "brhoo")}</div><div>{rng("bl", u["b_l"], 20, 600, 5, 120, "blo")}</div><div>{rng("bh", u["b_h"], 3, 40, 1, 10, "bho")}</div></div>
<div class="btns"><button id="bcoin" class="pill hot" type="button">{E(u["b_coin"])}</button><button id="bclear" class="pill" type="button">{E(u["b_clear"])}</button></div>
<p><b id="bstate"></b></p>
<div class="readout">{ro(u["b_mass"], "bmass")}{ro(u["b_sink"], "bsink")}{ro(u["b_free"], "bfree")}{ro(u["b_gm"], "bgm")}{ro(u["b_heel"], "bheel")}{ro(u["b_count"], "bcount")}{ro(u["b_left"], "bcoins")}</div>
{paras(u["fl_p2"])}<p class="note">{u["fl_note"]}</p></div></section>
'''
    riv = f'''<section id="river" class="sec"><div class="in"><p class="kick">{E(u["rv_kick"])}</p><h2>{E(u["rv_h"])}</h2>{paras(u["rv_p"])}
<p class="eq">{u["rv_eq"]}</p>
<canvas id="rivercv" class="cv" role="img" aria-label="{E(u["rv_h"])}"></canvas>
<p class="legend"><span><i style="background:#2f8a3c"></i>{E(u["v_moving"])}</span><span><i style="background:#7a5b2a"></i>{E(u["v_caught"])}</span></p>
<div class="readout" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))"><div>{rng("vmax", u["v_max"], 10, 150, 1, 80, "vmaxo")}</div><div>{rng("vp", u["v_p"], 10, 80, 1, 20, "vpo")}</div></div>
<div class="btns"><button id="vagain" class="pill hot" type="button">{E(u["v_again"])}</button></div>
<div class="readout">{ro(u["v_clock"], "vclock")}{ro(u["v_mean"], "vmean")}{ro(u["v_1h"], "v1h")}{ro(u["v_night"], "vnight")}{ro(u["v_stuck"], "vstuck")}</div>
<p id="vlive" class="note" data-src="{u["ping_src"]}"></p>
{paras(u["rv_p2"])}<p class="note">{u["rv_note"]}</p></div></section>
'''
    aft = f'''<section id="after" class="sec dark"><div class="in"><p class="kick">{E(u["af_kick"])}</p><h2>{E(u["af_h"])}</h2>{paras(u["af_p"])}
<canvas id="aftercv" class="cv" role="img" aria-label="{E(u["af_h"])}"></canvas>
<p class="legend"><span><i style="background:#3c9c45"></i>{E(u["a_nat"])}</span><span><i style="background:#e05a7a"></i>{E(u["a_foam"])}</span><span><i style="background:#e3a23b"></i>{E(u["a_bread"])}</span></p>
{paras(u["af_p2"])}<p class="note">{u["af_note"]}</p></div></section>
''' if u["counts"] else ""
    dates = "".join(f'<div><b>{E(a)}</b><span>{b}</span></div>' for a, b in u["dates"])
    yp = f'''<section id="yipeng" class="sec"><div class="in"><p class="kick">{E(u["yp_kick"])}</p><h2>{E(u["yp_h"])}</h2>{paras(u["yp_p"])}
<div class="dates">{dates}</div>{paras(u["yp_p2"])}
<a class="sib" href="{sib}"><img src="{sibicon}" width="48" height="48" alt=""><span><b>{E(u["sib_h"])}</b>{E(u["sib_p"])}</span></a></div></section>
'''
    figs = []
    for p in PHOTOS:
        licl = f'<a href="{p["license_url"]}">{E(p["license"])}</a>' if p.get("license_url") else E(p["license"])
        cap = p["caption_" + lang]
        figs.append(f'<figure><img loading="lazy" src="{root}img/{p["file"]}" width="{p["width"]}" height="{p["height"]}" alt="{E(cap)}"><figcaption>{E(cap)} <a href="{p["commons_page"]}">{E(p["author"])}</a> · {licl}</figcaption></figure>')
    pics = f'''<section id="pictures" class="sec rock"><div class="in"><p class="kick">{E(u["pic_kick"])}</p><h2>{E(u["pic_h"])}</h2><div class="ph">{"".join(figs)}</div></div></section>
''' if figs else ""
    words = "".join(f'<div><b>{E(a)}</b><i>{E(b)}</i><p>{E(c)}</p></div>' for a, b, c in u["words"])
    wd = f'''<section id="words" class="sec"><div class="in"><h2>{E(u["words_h"])}</h2><div class="glos">{words}</div></div></section>
'''
    src = "".join(f'<li><a href="{h}">{E(t)}</a></li>' for t, h in SOURCES)
    so = f'''<section id="sources" class="sec"><div class="in"><h2>{E(u["src_h"])}</h2><p>{E(u["src_p"])}</p><ul class="src">{src}</ul></div></section>
'''
    tail = f'''<footer class="bot"><div class="in">{E(u["foot"])} · <a href="https://github.com/NaNoBotCo/{SLUG}">GitHub</a> · <a href="https://motdang.net/">motdang.net</a> · <a href="https://hongdam.net/">hongdam.net</a></div></footer>
<script>window.UI={json.dumps(js, ensure_ascii=False)};</script>
<script src="{root}krathong.js"></script><script src="{root}app.js"></script><script src="{root}top.js"></script>
</body></html>
'''
    return head + "<main>" + hero + what + fold + ring + flo + riv + aft + yp + pics + wd + so + "</main>" + tail


def write_site(out, md):
    os.makedirs(os.path.join(out, "th"), exist_ok=True)
    host = CANON if md else GH
    for lang, path in (("en", "index.html"), ("th", "th/index.html")):
        with open(os.path.join(out, path), "w") as f:
            f.write(page(lang, md))
    with open(os.path.join(out, "sitemap.xml"), "w") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
                f'<url><loc>{host}</loc></url>\n<url><loc>{host}th/</loc></url>\n</urlset>\n')
    if not md:
        with open(os.path.join(out, "robots.txt"), "w") as f:
            f.write(f"User-agent: *\nAllow: /\nSitemap: {host}sitemap.xml\n")
    u = UI["en"]
    strip = lambda s: html.unescape(re.sub("<[^>]+>", "", s))
    lines = ["# Krathong, Drawn · กระทง วาดด้วยคณิต", "", u["desc"], "", f"English: {CANON}", f"Thai: {CANON}th/", ""]
    for key in ("what", "fo", "ri", "fl", "rv", "af", "yp"):
        lines += ["## " + strip(u[key + "_h"]), ""] + [strip(p) for p in u[key + "_p"]] + [""]
    lines += ["## Dates", ""] + [f"- {a}: {strip(b)}" for a, b in u["dates"]] + [""]
    lines += ["## Words", ""] + [f"- {a} ({b}): {c}" for a, b, c in u["words"]]
    lines += ["", "## Sources", ""] + [f"- {t}: {h}" for t, h in SOURCES]
    lines += ["", "## Licence", "", "Text CC BY 4.0, NaNoBotCo. Code MIT. Photographs keep their own licences, listed on the page.", ""]
    with open(os.path.join(out, "llms.txt"), "w") as f:
        f.write("\n".join(lines))


def main():
    write_site(DOCS, False)
    print("built en + th -> docs/")
    if "--motdang" in sys.argv:
        md = os.path.join(HERE, "..", "..", "mot-dang")
        for sub in (f"assets/sites/{SLUG}", f"docs/sites/{SLUG}"):
            out = os.path.join(md, sub)
            if os.path.isdir(out):
                shutil.rmtree(out)
            shutil.copytree(DOCS, out, ignore=shutil.ignore_patterns("robots.txt", ".DS_Store"))
            write_site(out, True)
            shutil.copy(os.path.join(HERE, "motdang_card.json"), os.path.join(out, "card.json"))
            print("built en + th ->", os.path.normpath(out))


if __name__ == "__main__":
    main()
