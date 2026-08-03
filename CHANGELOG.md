# Changelog

All notable changes to the ChiHaoFan (吃好饭) landing website project will be documented in this file.

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
