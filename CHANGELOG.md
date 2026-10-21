# Changelog

All notable changes to the ChiHaoFan (吃好饭) landing website project will be documented in this file.

## [1.2.6] - 2026-10-21

### Added
- **Enterprise-Grade Website Redesign (v2.0)**:
  - **Shared Enterprise Stylesheet (`style.css`) & Interactive Engine (`app.js`)**: Designed to match the architectural standard of top-tier product websites (modeled after `fulibiji`), preserving Chihaofan's signature emerald/mint palette (`--brand: #10c877` / `#2ee6a0`) with high-contrast dual dark/light modes.
  - **Interactive Playground 1 (3D Tri-Zone Smart Fridge & Thermostat)**:
    - Interactive 3-zone switcher: `冷藏鲜活舱 (+4°C)`, `微冻软切舱 (-3°C)`, `深冷速冻舱 (-18°C)`.
    - Real-time live telemetry: live temperature readout, relative humidity (`86% RH`), energy consumption (`0.32 kWh/d`), and shelf-life expiry alerts.
    - Interactive magnetic door bar with collectible city stickers.
  - **Interactive Playground 2 (AI 3-Second Meal Engine & 10 Expert Brain Modules)**:
    - Interactive scenarios: `减脂控卡`, `低 GI 控糖`, `剩菜改造 (免费)`, `孕期/月子营养`.
    - White-box reasoning chain console showcasing stock expiry priority, budget constraints, allergy filters, and automatic push to missing shopping lists.
  - **Interactive Playground 3 (3D World Culinary Globe & 8K Living Scene Theater)**:
    - Real HTML5 Canvas 3D rotating globe featuring 19 countries and 37+ gastronomic cities (Tokyo, Paris, Bangkok, Rome, Chengdu).
    - 5 Xiaohongshu 9:16 travel poster styles with interactive die-cut city food stickers.
  - **Interactive Ecosystem**:
    - Showcase for Qingtuan arcade whack-a-mole mini-game with 5-heart capacity and revive perks.
    - iOS home screen interactive widgets and Siri / App Shortcuts.
  - **Enterprise 7-Axis Comparison Matrix**:
    - Comprehensive side-by-side comparison table between Chihaofan, traditional recipe apps, and cloud trackers across privacy, AI algorithm, 3D fridge, world tour, brain modules, iOS widgets, and pricing.
  - **Multi-Tier Transparent Pricing Grid (`#pricing`)**:
    - Free Forever (`¥0` / `$0`), Pro Lifetime (`¥128` / `$19.99` one-time buy), and Pro Subscription (`¥68/yr` / `$9.99/yr` or `¥9.9/mo` / `$1.49/mo`) with billing cycle switcher.
  - **Full Bilingual Parity**:
    - Updated `index.html` (Chinese) and `index-en.html` (native idiomatic English).
    - Updated `geo.html` & `geo-en.html` GEO knowledge bases.
    - Updated `llms.txt` & `llms-full.txt` documentation for AI search crawlers.
  - **Analytics Integrity**:
    - Maintained Google Analytics 4 (`G-1CQNQNPK1Y`), Baidu Tongji (`b3a7b6fedcba22d39897693d6f716035`), and SPA route-tracking scripts.

## [Unreleased] - 2026-10-20

### Added
- **Google Analytics 4 (`G-1CQNQNPK1Y`) + Baidu Tongji (`b3a7b6fedcba22d39897693d6f716035`) Full-Site & SPA Route Tracking**:
  - Updated `tools/build_devlog.py` and injected both `G-1CQNQNPK1Y` (`gtag.js`) and `b3a7b6fedcba22d39897693d6f716035` (`hm.baidu.com/hm.js`) snippets plus History API / `hashchange` `page_view` & `_trackPageview` route tracking into all 21 HTML pages across the repository (`index.html`, `index-en.html`, `geo.html`, `geo-en.html`, `privacy.html`, `privacy-en.html`, `support.html`, `support-en.html`, `terms.html`, `terms-en.html`, `changelog.html`, `devlog.html`, `devlog-en.html`, and all 8 `devlog/*.html` articles) so traffic under `https://ai-chen2050.github.io/chihaofan/` is accurately reported.

## [1.2.0] - 2026-08-17

### Added
- **Huawei AppGallery download** (`https://appgallery.huawei.com/app/C118450373`):
  - **Sticky nav** (both languages): a second `.nav-cta.hw` pill — outlined, eight-petal Huawei mark plus a
    short label (`华为` / `Huawei`). Verified at a true 375 CSS-px layout: brand + language +
    theme + both CTAs all fit, so nothing is pushed off-screen.
  - **Qingtuan floating bubble** (both languages): the App Store CTA is now followed by an
    outlined `.pet-cta.alt` AppGallery link and a `.pet-hw-note` one-liner about the AI difference.
  - `index.html`: second CTA button in the hero (outlined `.appstore-btn.alt` variant so the
    App Store button stays the primary CTA), plus one in the footer store row; eyebrow and
    trust line now name the Huawei channel.
  - `index-en.html`: nav, **hero CTA row**, Qingtuan bubble and footer — same treatment as the
    Chinese page, at the owner's request. The hero keeps a `.store-note` spelling out that the
    AppGallery build is the China release without the AI features, so the extra button can't be
    read as a promise the build doesn't keep. The duplicate footer note was removed.
  - `changelog.html`: added to the store row.
  - `geo.html`: section 6 ("如何获取与使用") rewritten to cover both channels, the device range,
    and the feature difference; `geo-en.html` structured data updated.
- **Honest channel-difference note** (`.store-note`), shown next to the download buttons:
  the AppGallery build **does not include the AI features** (AI meal planning, Qingtuan chat,
  receipt scanning, health reports) because domestic distribution of generative-AI features
  requires an algorithm filing that is still in progress. Everything else matches the iOS build.
  Without this note the site would advertise "AI 冰箱管家" and hand Huawei users a build without it.
- **Device range stated explicitly**: HarmonyOS 4 and Android-based Huawei phones.
  **HarmonyOS NEXT is not supported** — that build is an APK and NEXT only accepts ArkTS `.hap`
  packages, so claiming plain "鸿蒙" support would be wrong.

### Notes
- The Huawei mark is the **real eight-petal logo path from Simple Icons**, inlined as SVG exactly
  the way the Apple logo already was on these pages — no external image, no build step.
  Class `.hw-mark`, brand red `#CF0A2C`, lightened to `#F0334F` in dark mode; checked in both.
  Two hand-drawn attempts were thrown away first (a four-ellipse flower that rendered as a plain
  `+` at 15px, then a thin starburst) — drawing a trademark by hand was the wrong instinct when an
  accurate path was one `curl` away.
- **Fixed the brand colour properly, after two failed attempts at it.** Every container rule
  paints the `svg`: `.appstore-btn svg` `(0,1,1)`, `.nav-cta svg` `(0,1,1)`,
  `.pet-bubble .pet-cta svg` `(0,2,1)` — all `fill: currentColor`. A `.hw-mark` rule at `(0,1,0)`
  lost everywhere (hero and footer rendered white); bumping it to `svg.hw-mark` `(0,1,1)` still
  lost to the bubble's `(0,2,1)`, so the Qingtuan popup's logo stayed white.
  The fix is to stop competing on specificity: **put the fill on the `path`** —
  `.hw-mark path { fill: #CF0A2C; }`. The container rules only set it on the `svg`, which the
  `path` merely *inherits*, and a direct declaration on the `path` always beats an inherited
  value however specific the ancestor selector is. One rule covers every placement, and a future
  container can't break it again.
- `.appstore-btn.alt` and the `.hw-mark` colour rules moved into **`devlog.css`** for
  `changelog.html`: that page has **no inline `<style>` block** (it links `devlog.css`), so an
  earlier attempt to inject CSS into it silently did nothing.
- Headless screenshot gotcha while checking this: Chrome's `--window-size=375,760` does **not**
  give a 375 CSS-px layout viewport, so the page looked badly clipped in both the old and new
  versions. `--force-device-scale-factor=2 --window-size=750,900` gives a real 375-px layout;
  at that width everything fits. Don't chase phantom overflow with the former.

### Added (tooling / docs)
- `tools/serve.py` — zero-dependency local preview server. Wraps
  `SimpleHTTPRequestHandler` to fix three things that bite on this site:
  forces `Cache-Control: no-store` (all CSS/JS is inlined, so 304s make edits
  look like they did nothing), tags `.txt/.xml/.json/.html` with `charset=utf-8`
  (Chinese in `llms.txt` was rendering as mojibake), and auto-picks a free port.
  Also roots itself at the repo regardless of cwd. Flags: `--open`, `--port`,
  `--lan` (prints a LAN URL for checking layout on a real phone) and
  `--base /chihaofan` to reproduce the live project-page subpath.
- `README.md` — first one for this repo: preview instructions, directory map,
  what to regenerate after which kind of edit, the seven places a download
  channel has to be kept in sync, and deployment notes.
  Two gotchas written down because both cost real time:
  - Chrome headless `--window-size=375,760` does **not** give a 375 CSS-px
    layout viewport; use `--force-device-scale-factor=2 --window-size=750,900`.
  - Every link must stay **relative** — the site is served from a GitHub Pages
    project page under `/chihaofan/`, so a root-absolute `/icon.png` works
    locally and 404s in production. `--base` exists to catch that.
- **Flagged in the README, not fixed**: `canonical` / `hreflang` / JSON-LD /
  `sitemap.xml` all point at `https://chihaofan.com/...`, but that domain fails
  TLS as of 2026-08-17 while the site actually serves from
  `https://ai-chen2050.github.io/chihaofan/`. Canonical pointing at an
  unreachable host risks non-indexing. Either attach the custom domain (which
  would also unblock the app's Universal Link — a project-page path can't host
  an AASA file) or rewrite the URLs to the address in use.

### Changed
- Schema.org `SoftwareApplication`: `installUrl` is now an array (App Store + AppGallery) and
  `operatingSystem` lists `Android 8.0, HarmonyOS 4` alongside iOS/iPadOS —
  in `index.html`, `index-en.html`, `geo.html`, `geo-en.html`.
- `llms.txt` / `llms-full.txt`: added the AppGallery URL, the supported device range and a
  dedicated Q&A on the channel feature difference, so AI answers stop describing the app as
  iOS-only. Meta descriptions and keywords updated to match.

## [Unreleased] - 2026-08-03

### Added
- **GEO (Generative Engine Optimization) Infrastructure**:
  - `llms.txt` and `llms-full.txt`: Standard LLM parser documentation describing app architecture, features, privacy model, and FAQs.
  - `robots.txt`: Directives allowing AI search crawlers (`GPTBot`, `ChatGPT-User`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, `Applebot-Extended`, `Bytespider`, etc.).
  - `sitemap.xml`: Complete XML sitemap listing all site pages and GEO documentation.
  - `geo.html` & `geo-en.html`: Dedicated Chinese and English GEO Knowledge Base pages with detailed Q&A, feature comparison matrix, and deep App Store download links.
- **Schema.org Structured Data**:
  - Embedded `SoftwareApplication`, `Organization`, and `FAQPage` JSON-LD schema into `index.html`, `index-en.html`, `geo.html`, and `geo-en.html` to enhance LLM citation and search snippet visibility.
- **Footer Navigation**:
  - Added links to "AI 知识库 / AI Knowledge Base" in `index.html` and `index-en.html`.
