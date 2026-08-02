#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
吃好饭官网 · 开发日记（devlog）静态生成器

用法：
    python3 tools/build_devlog.py

做什么：
    读取 devlog/src/*.md（带 YAML frontmatter）→ 生成 devlog/<slug>.html
    并重建索引页 devlog.html（中文）与 devlog-en.html（英文）。

为什么自己写 Markdown 转换而不用第三方库：
    GitHub Pages 直接托管静态文件，本仓库不引入任何依赖，
    clone 下来 python3 一跑就能出结果。支持的语法见 md_to_html()。

新增一篇文章：
    1. 把 Markdown 放进 devlog/src/，文件名即 slug（如 03-zero-servers.md）
    2. 顶部写 frontmatter：title / date / summary / tags / lang / order / status
    3. 跑一次本脚本，提交生成的 html

frontmatter 字段：
    title    标题（必填）
    date     发布日期，索引页按 order 排序、date 仅展示
    summary  摘要，同时用作 og:description
    tags     逗号分隔
    lang     zh（默认）或 en
    order    索引页排序，数字小的在前
    status   published（默认）| draft —— draft 仍会生成页面（方便预览和分享私链），
             但不会出现在索引页里。写好一篇就把它改成 published。
    type     post（默认）| page —— page 是独立页面（如更新日志），
             不进索引、不参与上一篇/下一篇，输出到站点根目录而非 devlog/。
"""

import html
import os
import re
import sys

# 是否渲染正文里的「【配图：xxx】」占位块。
# 自己校稿时开着（能提醒哪里还缺图）；正式对外前如果嫌它显得没做完，改成 False。
SHOW_FIGURE_PLACEHOLDERS = True

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "devlog", "src")
OUT = os.path.join(ROOT, "devlog")

# 与首页保持一致：中文页走中区、英文页走美区
_APP_PATH = ("%E5%90%83%E5%A5%BD%E9%A5%AD-ai%E5%86%B0%E7%AE%B1%E7%AE%A1%E5%AE%B6%E4%B8%8E%E9%A3%9F%E8%B0%B1/"
             "id6792690863")
APPSTORE = {"zh": "https://apps.apple.com/cn/app/" + _APP_PATH,
            "en": "https://apps.apple.com/us/app/" + _APP_PATH}

APPLE_SVG = ('<svg viewBox="0 0 384 512" aria-hidden="true"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>')

STR = {
    "zh": {
        "site": "吃好饭",
        "kicker": "开发日记",
        "index_title": "开发日记 · 吃好饭",
        "index_h1": "开发日记",
        "index_lead": "一个人从第一个 commit 到 App Store 上架，中间发生的事。"
                      "数据、定价、架构、被打回的那几次——包括做错的部分。",
        "nav_home": "首页",
        "nav_devlog": "开发日记",
        "nav_support": "技术支持",
        "nav_dl": "下载",
        "back": "← 全部开发日记",
        "toc": "本文目录",
        "figure": "配图",
        "read_more": "阅读全文",
        "foot_dl_small": "下载于",
        "foot_privacy": "隐私政策",
        "foot_terms": "用户协议",
        "foot_support": "技术支持",
        "foot_changelog": "更新日志",
        "foot_tail": "吃好饭 · 青团团陪你好好吃饭 🍚",
        "contact": "联系我们",
        "other_lang": "EN",
        "other_index": "devlog-en.html",
        "cta_title": "吃好饭 · AI 冰箱管家与食谱",
        "cta_body": "记下家里的菜，临期自动提醒，一键按现有食材配出今晚这餐。"
                    "数据只在你手机里，无账号、无广告。iOS 已上架，安卓版在路上。",
        "empty": "还没有文章。",
    },
    "en": {
        "site": "Chihaofan",
        "kicker": "Dev log",
        "index_title": "Dev log · Chihaofan",
        "index_h1": "Dev log",
        "index_lead": "Building an app in public — one person, first commit to App Store. "
                      "Architecture, pricing, rejections, and the parts I got wrong.",
        "nav_home": "Home",
        "nav_devlog": "Dev log",
        "nav_support": "Support",
        "nav_dl": "Download",
        "back": "← All posts",
        "toc": "Contents",
        "figure": "Figure",
        "read_more": "Read",
        "foot_dl_small": "Download on the",
        "foot_privacy": "Privacy",
        "foot_terms": "Terms",
        "foot_support": "Support",
        "foot_changelog": "Changelog",
        "foot_tail": "Chihaofan · Qingtuan helps you eat well 🍚",
        "contact": "Contact",
        "other_lang": "中文",
        "other_index": "../devlog.html",
        "cta_title": "Chihaofan · an AI fridge in your pocket",
        "cta_body": "Log what you have, get dinner planned in seconds from ingredients you already own, "
                    "and stop throwing groceries away. On-device, no account, no ads. "
                    "iOS is live; Android is in the works.",
        "empty": "No posts yet.",
    },
}


# ─────────────────────────── frontmatter ───────────────────────────

def parse_front(text):
    """解析 `---` 包裹的简易 YAML（只支持 key: value 与逗号分隔的 tags）。"""
    meta, body = {}, text
    if text.startswith("---"):
        end = text.find("\n---", 3)
        if end != -1:
            raw = text[3:end]
            body = text[end + 4:].lstrip("\n")
            for line in raw.splitlines():
                line = line.strip()
                if not line or line.startswith("#") or ":" not in line:
                    continue
                k, v = line.split(":", 1)
                meta[k.strip()] = v.strip().strip('"').strip("'")
    if "tags" in meta:
        meta["tags"] = [t.strip() for t in re.split(r"[,，]", meta["tags"]) if t.strip()]
    else:
        meta["tags"] = []
    return meta, body


# ─────────────────────────── markdown ───────────────────────────

def inline(s):
    """行内语法。先抽出 `code` 保护，再处理粗体/斜体/链接，最后转义。"""
    holds = []

    def hold(m):
        holds.append(m.group(1))
        return "\x00%d\x00" % (len(holds) - 1)

    s = re.sub(r"`([^`]+)`", hold, s)
    s = html.escape(s, quote=False)
    s = re.sub(r"!\[([^\]]*)\]\(([^)\s]+)\)",
               lambda m: '<img src="%s" alt="%s" loading="lazy">' % (
                   html.escape(m.group(2), quote=True), html.escape(m.group(1), quote=True)), s)
    s = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)",
               lambda m: '<a href="%s"%s>%s</a>' % (
                   html.escape(m.group(2), quote=True),
                   ' target="_blank" rel="noopener"' if m.group(2).startswith("http") else "",
                   m.group(1)), s)
    s = re.sub(r"<(https?://[^>\s]+)>",
               r'<a href="\1" target="_blank" rel="noopener">\1</a>', s)
    s = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"(?<![\w*])\*([^*\n]+)\*(?![\w*])", r"<em>\1</em>", s)
    s = re.sub(r"~~([^~]+)~~", r"<del>\1</del>", s)
    s = re.sub(r"\x00(\d+)\x00",
               lambda m: "<code>%s</code>" % html.escape(holds[int(m.group(1))], quote=False), s)
    return s


def slugify(text):
    t = re.sub(r"<[^>]+>", "", text)
    t = re.sub(r"[^\w一-鿿]+", "-", t).strip("-").lower()
    return t or "s"


def md_to_html(md):
    """支持：h1-h4 / 段落 / 无序·有序列表（含嵌套一层）/ 引用 / 表格 / 围栏代码 / 分隔线 / 任务列表。
    返回 (html, toc)，toc 为 [(level, text, anchor)]。"""
    lines = md.split("\n")
    out, toc = [], []
    i, n = 0, len(lines)
    seen = {}

    def anchor(text):
        base = slugify(text)
        seen[base] = seen.get(base, 0) + 1
        return base if seen[base] == 1 else "%s-%d" % (base, seen[base])

    while i < n:
        line = lines[i]

        # 围栏代码
        if line.startswith("```"):
            lang = line[3:].strip()
            i += 1
            buf = []
            while i < n and not lines[i].startswith("```"):
                buf.append(lines[i])
                i += 1
            i += 1
            out.append('<pre class="code"%s><code>%s</code></pre>' % (
                ' data-lang="%s"' % html.escape(lang, quote=True) if lang else "",
                html.escape("\n".join(buf), quote=False)))
            continue

        # 分隔线
        if re.match(r"^\s*([-*_])\1{2,}\s*$", line):
            out.append("<hr>")
            i += 1
            continue

        # 标题
        m = re.match(r"^(#{1,4})\s+(.*)$", line)
        if m:
            lv, txt = len(m.group(1)), inline(m.group(2).strip())
            a = anchor(m.group(2).strip())
            if lv >= 2:
                toc.append((lv, re.sub(r"<[^>]+>", "", txt), a))
            out.append('<h%d id="%s">%s</h%d>' % (lv, a, txt, lv))
            i += 1
            continue

        # 表格
        if "|" in line and i + 1 < n and re.match(r"^\s*\|?[\s:|-]+\|[\s:|-]*$", lines[i + 1]):
            def cells(row):
                row = row.strip()
                if row.startswith("|"):
                    row = row[1:]
                if row.endswith("|"):
                    row = row[:-1]
                return [c.strip() for c in row.split("|")]

            head = cells(line)
            i += 2
            body = []
            while i < n and "|" in lines[i] and lines[i].strip():
                body.append(cells(lines[i]))
                i += 1
            out.append('<div class="tw"><table><thead><tr>%s</tr></thead><tbody>%s</tbody></table></div>' % (
                "".join("<th>%s</th>" % inline(c) for c in head),
                "".join("<tr>%s</tr>" % "".join("<td>%s</td>" % inline(c) for c in r) for r in body)))
            continue

        # 引用（含【配图：】特殊渲染）
        if line.startswith(">"):
            buf = []
            while i < n and lines[i].startswith(">"):
                buf.append(re.sub(r"^>\s?", "", lines[i]))
                i += 1
            joined = "\n".join(buf).strip()
            fig = re.match(r"^【配图[：:]\s*(.+?)】$", joined, re.S)
            if fig:
                if SHOW_FIGURE_PLACEHOLDERS:
                    out.append('<figure class="figph"><span class="tag">配图</span>%s</figure>'
                               % inline(fig.group(1).strip()))
                else:
                    out.append("<!-- 配图待补：%s -->"
                               % html.escape(fig.group(1).strip(), quote=False))
            else:
                inner, _ = md_to_html(joined)
                out.append("<blockquote>%s</blockquote>" % inner)
            continue

        # 列表（无序 / 有序 / 任务）
        m = re.match(r"^(\s*)([-*+]|\d+[.)])\s+(.*)$", line)
        if m:
            ordered = bool(re.match(r"^\d", m.group(2)))
            items, base = [], len(m.group(1))
            while i < n:
                mm = re.match(r"^(\s*)([-*+]|\d+[.)])\s+(.*)$", lines[i])
                if not mm or len(mm.group(1)) < base:
                    if lines[i].strip() == "" and i + 1 < n and re.match(r"^\s*([-*+]|\d+[.)])\s+", lines[i + 1]):
                        i += 1
                        continue
                    break
                indent, content = len(mm.group(1)), mm.group(3)
                if indent > base and items:
                    items[-1][1].append(content)
                else:
                    items.append([content, []])
                i += 1

            def li(text, subs):
                t = re.match(r"^\[( |x|X)\]\s+(.*)$", text)
                if t:
                    box = '<input type="checkbox" disabled%s> ' % (
                        " checked" if t.group(1).lower() == "x" else "")
                    body = box + inline(t.group(2))
                    cls = ' class="task"'
                else:
                    body, cls = inline(text), ""
                sub = ("<ul>%s</ul>" % "".join("<li>%s</li>" % inline(s) for s in subs)) if subs else ""
                return "<li%s>%s%s</li>" % (cls, body, sub)

            tag = "ol" if ordered else "ul"
            out.append("<%s>%s</%s>" % (tag, "".join(li(t, s) for t, s in items), tag))
            continue

        # 空行
        if not line.strip():
            i += 1
            continue

        # 段落
        buf = []
        while i < n and lines[i].strip() and not re.match(
                r"^(#{1,4}\s|>|```|\s*([-*+]|\d+[.)])\s|\s*([-*_])\3{2,}\s*$)", lines[i]):
            if "|" in lines[i] and i + 1 < n and re.match(r"^\s*\|?[\s:|-]+\|[\s:|-]*$", lines[i + 1]):
                break
            buf.append(lines[i].strip())
            i += 1
        if buf:
            joined_p = " ".join(buf)
            rendered = inline(joined_p)
            only_imgs = re.sub(r"<img[^>]*>|\s+", "", rendered) == ""
            cls = ' class="figrow"' if only_imgs and "<img" in rendered else ""
            tag = "div" if cls else "p"
            out.append("<%s%s>%s</%s>" % (tag, cls, rendered, tag))

    return "\n".join(out), toc


# ─────────────────────────── 页面骨架 ───────────────────────────

def chrome(lang, in_sub):
    """返回 (nav_html, footer_html)。in_sub=True 表示页面在 devlog/ 子目录下。"""
    t = STR[lang]
    up = "../" if in_sub else ""
    home = up + ("index-en.html" if lang == "en" else "index.html")
    devlog_index = up + ("devlog-en.html" if lang == "en" else "devlog.html")
    support = up + ("support-en.html" if lang == "en" else "support.html")
    privacy = up + ("privacy-en.html" if lang == "en" else "privacy.html")
    terms = up + ("terms-en.html" if lang == "en" else "terms.html")
    swap = up + ("devlog.html" if lang == "en" else "devlog-en.html")
    store = APPSTORE[lang]

    nav = f"""<nav>
  <div class="wrap">
    <a class="brand" href="{home}"><img src="{up}icon.png" alt="{t['site']}" width="32" height="32">{t['site']}<span class="brand-sub">{t['kicker']}</span></a>
    <span class="nav-links">
      <a href="{home}">{t['nav_home']}</a>
      <a href="{devlog_index}">{t['nav_devlog']}</a>
      <a href="{support}">{t['nav_support']}</a>
      <button class="theme-btn" type="button" aria-label="switch language" style="font-size:12px;font-weight:800" onclick="location.href='{swap}'">{t['other_lang']}</button>
      <button class="theme-btn" id="themeBtn" type="button" aria-label="theme">🌙</button>
      <a class="nav-cta" href="{store}" target="_blank" rel="noopener">{APPLE_SVG}{t['nav_dl']}</a>
    </span>
  </div>
</nav>"""

    footer = f"""<footer>
  <div class="wrap">
    <div class="cta-card">
      <h3>{t['cta_title']}</h3>
      <p>{t['cta_body']}</p>
      <a class="appstore-btn" href="{store}" target="_blank" rel="noopener">{APPLE_SVG}<span class="t"><small>{t['foot_dl_small']}</small><b>App Store</b></span></a>
    </div>
    <div class="foot-links"><a href="{devlog_index}">{t['nav_devlog']}</a><a href="{up}changelog.html">{t['foot_changelog']}</a><a href="{privacy}">{t['foot_privacy']}</a><a href="{terms}">{t['foot_terms']}</a><a href="{support}">{t['foot_support']}</a></div>
    <div class="copyright">{t['foot_tail']}<br>{t['contact']}：<a href="mailto:blake.chen94@gmail.com">blake.chen94@gmail.com</a></div>
  </div>
</footer>"""
    return nav, footer


def page(lang, in_sub, title, desc, body, canonical_extra=""):
    t = STR[lang]
    up = "../" if in_sub else ""
    nav, footer = chrome(lang, in_sub)
    return f"""<!DOCTYPE html>
<html lang="{'en' if lang == 'en' else 'zh-CN'}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="icon" type="image/png" href="{up}icon.png">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc, quote=True)}">
<meta property="og:type" content="article">
<meta property="og:title" content="{html.escape(title, quote=True)}">
<meta property="og:description" content="{html.escape(desc, quote=True)}">
<meta property="og:image" content="{up}icon.png">
<meta name="twitter:card" content="summary">{canonical_extra}
<script>(function(){{try{{var t=localStorage.getItem('theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t);}}catch(e){{}}}})();</script>
<link rel="stylesheet" href="{up}devlog.css">
</head>
<body>
<div class="scroll-prog" id="prog"></div>
{nav}
{body}
{footer}
<script>
  // 主题切换（与首页同一个 localStorage key）
  (function () {{
    var btn = document.getElementById('themeBtn');
    function cur() {{
      var a = document.documentElement.getAttribute('data-theme');
      if (a) return a;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }}
    function paint() {{ if (btn) btn.textContent = cur() === 'dark' ? '☀️' : '🌙'; }}
    paint();
    if (btn) btn.addEventListener('click', function () {{
      var next = cur() === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try {{ localStorage.setItem('theme', next); }} catch (e) {{}}
      paint();
    }});
  }})();
  // 阅读进度条
  (function () {{
    var bar = document.getElementById('prog');
    if (!bar) return;
    function tick() {{
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
    }}
    document.addEventListener('scroll', tick, {{ passive: true }});
    tick();
  }})();
</script>
</body>
</html>
"""


# ─────────────────────────── 构建 ───────────────────────────

def build():
    if not os.path.isdir(SRC):
        print("找不到 %s —— 请先创建 devlog/src/ 并放入 Markdown。" % SRC, file=sys.stderr)
        return 1

    posts = []
    for fn in sorted(os.listdir(SRC)):
        if not fn.endswith(".md"):
            continue
        slug = fn[:-3]
        with open(os.path.join(SRC, fn), encoding="utf-8") as f:
            meta, body = parse_front(f.read())
        lang = meta.get("lang", "zh")
        # 正文里的 H1 与 frontmatter 标题重复，去掉正文那一个
        body = re.sub(r"^#\s+.*?\n", "", body, count=1)
        content, toc = md_to_html(body)
        posts.append({
            "slug": slug, "lang": lang, "meta": meta, "html": content, "toc": toc,
            "order": int(meta.get("order", "999") or 999),
            "title": meta.get("title", slug),
            "date": meta.get("date", ""),
            "summary": meta.get("summary", ""),
            "tags": meta.get("tags", []),
            "draft": meta.get("status", "published").strip().lower() == "draft",
            "page": meta.get("type", "post").strip().lower() == "page",
        })

    posts.sort(key=lambda p: (p["order"], p["slug"]))
    # 索引与上一篇/下一篇只串已发布的文章；草稿仍生成页面，方便预览
    t_all = {"zh": [p for p in posts if p["lang"] != "en" and not p["draft"] and not p["page"]],
             "en": [p for p in posts if p["lang"] == "en" and not p["draft"] and not p["page"]]}

    os.makedirs(OUT, exist_ok=True)

    # 文章页
    for idx, p in enumerate(posts):
        t = STR[p["lang"]]
        same = t_all[p["lang"]]
        in_sub = not p["page"]              # 独立页面放站点根目录，文章放 devlog/
        if p["draft"] or p["page"]:
            prev_p = next_p = None
        else:
            pos = same.index(p)
            prev_p = same[pos - 1] if pos > 0 else None
            next_p = same[pos + 1] if pos + 1 < len(same) else None

        toc_html = ""
        h2s = [x for x in p["toc"] if x[0] == 2]
        if len(h2s) >= 3:
            toc_html = '<aside class="toc"><b>%s</b><ol>%s</ol></aside>' % (
                t["toc"], "".join('<li><a href="#%s">%s</a></li>' % (a, html.escape(txt))
                                  for _, txt, a in h2s))

        tags = "".join('<span class="tag">%s</span>' % html.escape(x) for x in p["tags"])
        nav_links = []
        if prev_p:
            nav_links.append('<a class="pn prev" href="%s.html"><small>%s</small>%s</a>'
                             % (prev_p["slug"], "上一篇" if p["lang"] == "zh" else "Previous",
                                html.escape(prev_p["title"])))
        if next_p:
            nav_links.append('<a class="pn next" href="%s.html"><small>%s</small>%s</a>'
                             % (next_p["slug"], "下一篇" if p["lang"] == "zh" else "Next",
                                html.escape(next_p["title"])))

        idx_href = ("devlog-en.html" if p["lang"] == "en" else "devlog.html")
        if in_sub:
            idx_href = "../" + idx_href
        body = f"""<article class="wrap post">
  <a class="back" href="{idx_href}">{t['back']}</a>
  <header class="post-head">
    <div class="meta">{html.escape(p['date'])}{'　·　' + tags if tags else ''}</div>
    <h1>{html.escape(p['title'])}</h1>
    {'<p class="lead">' + inline(p['summary']) + '</p>' if p['summary'] else ''}
  </header>
  {toc_html}
  <div class="body">
{p['html']}
  </div>
  <nav class="postnav">{''.join(nav_links)}</nav>
</article>"""
        out = page(p["lang"], in_sub, "%s · %s" % (p["title"], STR[p["lang"]]["site"]),
                   p["summary"] or p["title"], body)
        dest_dir = OUT if in_sub else ROOT
        rel = ("devlog/" if in_sub else "") + p["slug"] + ".html"
        with open(os.path.join(dest_dir, p["slug"] + ".html"), "w", encoding="utf-8") as f:
            f.write(out)
        note = "  （草稿，不进索引）" if p["draft"] else ("  （独立页面）" if p["page"] else "")
        print("  ✓ %s%s" % (rel, note))

    # 索引页
    for lang in ("zh", "en"):
        t = STR[lang]
        items = t_all[lang]
        if items:
            cards = "".join(
                f"""<a class="card" href="devlog/{p['slug']}.html">
  <div class="card-meta">{html.escape(p['date'])}{'　·　' + '、'.join(html.escape(x) for x in p['tags']) if p['tags'] else ''}</div>
  <h2>{html.escape(p['title'])}</h2>
  <p>{html.escape(p['summary'])}</p>
  <span class="more">{t['read_more']} →</span>
</a>""" for p in items)
        else:
            cards = '<p class="empty">%s</p>' % t["empty"]

        body = f"""<header class="idx-head">
  <div class="wrap">
    <span class="eyebrow">🛠 {t['kicker']}</span>
    <h1>{t['index_h1']}</h1>
    <p class="lead">{t['index_lead']}</p>
  </div>
</header>
<main class="wrap idx">
  {cards}
</main>"""
        fn = "devlog-en.html" if lang == "en" else "devlog.html"
        with open(os.path.join(ROOT, fn), "w", encoding="utf-8") as f:
            f.write(page(lang, False, t["index_title"], t["index_lead"], body))
        print("  ✓ %s（%d 篇）" % (fn, len(items)))

    return 0


if __name__ == "__main__":
    print("构建开发日记…")
    sys.exit(build())
