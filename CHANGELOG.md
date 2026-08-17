# Changelog

All notable changes to the ChiHaoFan (吃好饭) landing website project will be documented in this file.

## [Unreleased] - 2026-08-17

### Added
- **Huawei AppGallery download** (`https://appgallery.huawei.com/app/C118450373`):
  - `index.html`: second CTA button in the hero (outlined `.appstore-btn.alt` variant so the
    App Store button stays the primary CTA), plus one in the footer store row; eyebrow and
    trust line now name the Huawei channel.
  - `index-en.html`: **footer only, deliberately not in the hero** — the AppGallery listing is
    the China release (ICP-filed) and ships without the AI features, so promoting it at the top
    of a page aimed at overseas users would misrepresent the product.
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
