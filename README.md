# 吃好饭 官网（chihaofan）

「吃好饭 · AI 冰箱管家与食谱」的官网与 GEO 知识库。**纯静态站点，零依赖**——
clone 下来有 `python3` 就能跑，不需要 Node、不需要构建流水线。

App 本体在另一个仓库（`ai-ice`）。本仓库只有这个站点。

---

## 本地预览

```bash
python3 tools/serve.py            # → http://127.0.0.1:8000
python3 tools/serve.py --open      # 顺便打开浏览器
python3 tools/serve.py --port 8080
```

启动后会把所有主要页面的地址列出来，直接点。**不需要装任何东西**，
标准库自带。

> 唯一的外部依赖是首页那只青团团的 Lottie 播放器（走 jsdelivr CDN）。
> 断网预览时它加载不到，会自动回落成静态图（`.pet-fallback`），
> 其余部分完全离线可用。

### 为什么不用 `python3 -m http.server`

能用，但有三个坑，`tools/serve.py` 就是来堵这三个坑的：

| 坑 | 症状 | 脚本怎么处理 |
| :-- | :-- | :-- |
| **缓存** | 本站 CSS/JS 全内联在 HTML 里，浏览器走 304，改完文案刷新看不到变化，很容易误判「我改的没生效」 | 所有响应强制 `Cache-Control: no-store` |
| **中文乱码** | `.txt` 的 Content-Type 不带 charset，`llms.txt` / `llms-full.txt` 里的中文在浏览器里花屏 | `.txt/.xml/.json/.html` 一律显式带 `charset=utf-8` |
| **端口被占** | 直接崩掉 | 自动往后找一个能用的端口 |

另外 `http.server` 把站点根定在当前目录，从 `tools/` 里跑就成了空目录；
`serve.py` 无论从哪跑都以仓库根为根。

### 用手机看（改移动端排版时）

```bash
python3 tools/serve.py --lan
```

会额外打印一个局域网地址（`http://192.168.x.x:8000`），手机连同一个 Wi-Fi
直接开。改 hero、顶栏、按钮这类挤不挤得下的问题，真机比模拟准。

### 复现线上的子路径

线上是 GitHub Pages **项目页**，站点挂在 `/chihaofan/` 下面（见「部署」）。
想验证链接在子路径下会不会 404：

```bash
python3 tools/serve.py --base /chihaofan     # → http://127.0.0.1:8000/chihaofan/index.html
```

> ⚠️ **本站所有链接必须是相对路径**（`icon.png`、`index-en.html`），
> 一旦写成 `/icon.png` 这种根绝对路径，**本地预览正常、线上 404**。
> 这个模式就是用来提前抓出这类问题的。

### 无头浏览器截图（批量核对排版）

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# 桌面
"$CHROME" --headless=new --disable-gpu --hide-scrollbars \
  --window-size=1280,900 --screenshot=/tmp/desk.png \
  --virtual-time-budget=4000 "http://127.0.0.1:8000/index.html"

# 手机（375 CSS 像素）——注意下面这条注意事项
"$CHROME" --headless=new --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=2 --window-size=750,900 --screenshot=/tmp/m375.png \
  --virtual-time-budget=4000 "http://127.0.0.1:8000/index.html"
```

> ⚠️ **别用 `--window-size=375,760` 当手机视口。** 它给的不是 375 CSS 像素的
> 布局视口，截出来的图会显示成「内容被切掉一大半」，让人以为页面溢出了
> ——改动前后的版本都会这样，纯属假象。
> 要真 375 布局，用 `--force-device-scale-factor=2 --window-size=750,900`
> （2 倍 DPR ÷ 750 物理像素 = 375 CSS 像素）。2026-08-17 在这上面白查了一轮。

---

## 目录结构

```
index.html / index-en.html      首页（中 / 英）。样式与脚本全内联，改文案只动这两个文件
geo.html   / geo-en.html        GEO 知识库：给 AI 搜索引擎看的长问答页
changelog.html                  更新日志（面向用户）
privacy.html / terms.html / support.html      + 各自的 -en 版本
devlog.html / devlog-en.html    开发日记索引（生成产物，勿手改）
devlog/                         开发日记文章（生成产物）
devlog/src/*.md                 ← 开发日记的源文件，改这里
devlog.css                      开发日记专用样式
llms.txt / llms-full.txt        给 AI 爬虫的结构化说明
robots.txt / sitemap.xml        爬虫指令与站点地图
icon.png / shots/               应用图标与截图
haohao_*.json                   青团团 Lottie 动画（首页右下角那只）
tools/serve.py                  本地预览服务器
tools/build_devlog.py           开发日记生成器
CHANGELOG.md                    本仓库（站点）的改动记录
```

## 改东西之后

| 改了什么 | 要做什么 |
| :-- | :-- |
| 首页 / 协议 / 支持页文案 | 直接改 HTML，刷新即可。**中英文两份都要改** |
| 开发日记 | 改 `devlog/src/*.md`，然后 `python3 tools/build_devlog.py`，把生成的 HTML 一起提交 |
| 新增页面 | 记得同步 `sitemap.xml`，并考虑要不要进 `llms.txt` |
| 下载渠道 / 平台支持 | 一共 7 个地方要同步，见下节 |

### 下载渠道散落在哪些地方

加一个商店或改链接时，这些都要同步，漏一处就会出现「首页说支持、
AI 问答说不支持」这种自相矛盾：

1. `index.html` — 顶栏 CTA、hero 按钮、页脚、青团团气泡、eyebrow、trust 行
2. `index-en.html` — 同上（英文页刻意**不在 hero** 放华为，见 `CHANGELOG.md`）
3. `changelog.html` — 页脚商店按钮
4. `geo.html` 第 6 节「如何获取与使用」
5. `llms.txt` — 平台支持、链接、渠道差异
6. `llms-full.txt` — 同上 + 下载相关 Q&A
7. 四个页面的 JSON-LD：`installUrl`（数组）与 `operatingSystem`

当前渠道：

- **App Store**（iOS / iPadOS）—— 完整功能
- **华为应用市场 AppGallery**（`C118450373`）—— HarmonyOS 4 与安卓底座华为机型，
  **纯血鸿蒙 NEXT 未适配**（那个只吃 ArkTS `.hap`，本包是 APK）；
  **暂不含 AI 相关功能**（国内算法备案办理中）。
  备案下来后要删掉站点上的相关说明，搜 `.store-note` 与 `pet-hw-note`。

> 华为 logo 用的是 [Simple Icons](https://simpleicons.org/?q=huawei) 的官方八花瓣
> path（跟页面里 Apple logo 同样的做法：内联 SVG path，不引外部图片），
> 类名 `.hw-mark`，品牌红 `#CF0A2C`、深色模式提亮到 `#F0334F`。
>
> ⚠️ **红色的 `fill` 必须写在 `path` 上，别写在 `svg` 上**：
> `.hw-mark path { fill: #CF0A2C; }`
>
> 因为容器侧那几条都在给 `svg` 上色 ——
> `.appstore-btn svg` `(0,1,1)`、`.nav-cta svg` `(0,1,1)`、
> `.pet-bubble .pet-cta svg` `(0,2,1)` —— 全是 `fill: currentColor`。
> 跟它们比特异性会没完没了：2026-08-17 先写 `.hw-mark` `(0,1,0)`，
> hero 和页脚变白；改成 `svg.hw-mark` `(0,1,1)` 还是压不住气泡里那颗
> `(0,2,1)`。而那些规则只作用在 `svg` 元素上，`path` 是**继承**来的，
> **`path` 上的直接声明永远赢过继承值**，跟祖先选择器多具体无关——
> 一条搞定全部位置，以后加新容器也不会再被压掉。
>
> 另外 **`changelog.html` 没有内联 `<style>`**，它引 `devlog.css`。
> 往它里面塞 `<style>` 是无效的（同日踩过），这类共享样式要写进 `devlog.css`。

---

## 部署

推 `main` 分支即由 GitHub Pages 自动发布，**没有构建步骤**
（开发日记的 HTML 是本地生成后提交进去的，不是 CI 产的）。

- 仓库：`github.com/ai-chen2050/chihaofan`
- 线上地址：`https://ai-chen2050.github.io/chihaofan/`（**项目页，带 `/chihaofan/` 子路径**）

### 待确认：canonical 指向的域名当前不可用

页面里的 `<link rel="canonical">`、`hreflang`、JSON-LD 与 `sitemap.xml`
写的都是 `https://chihaofan.com/...`，但 **2026-08-17 实测该域名 TLS 握不上手**
（`curl` 报 `SSL_ERROR_SYSCALL`），而站点实际由上面那个项目页地址在服务。

canonical 指向一个打不开的域名，搜索引擎与 AI 爬虫都可能因此不收录。
两条路选一条：

1. **把 `chihaofan.com` 接上**：DNS 指向 GitHub Pages，在仓库
   Settings → Pages 填自定义域名（GitHub 会写入 `CNAME` 文件，本仓库目前没有），
   等证书签发。这条同时能解掉 App 那边卡住的 Universal Link——
   项目页路径没法放 AASA 文件，自定义域名可以。
2. **或者**把站内所有 URL 改成实际地址 `https://ai-chen2050.github.io/chihaofan/`。

别两边都不动。
