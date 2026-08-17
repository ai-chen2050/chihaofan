#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
吃好饭官网 · 本地预览服务器

用法：
    python3 tools/serve.py                  # http://127.0.0.1:8000
    python3 tools/serve.py --open           # 顺便打开浏览器
    python3 tools/serve.py --port 8080
    python3 tools/serve.py --lan            # 同时监听局域网，手机可访问

为什么不直接 `python3 -m http.server`：
    能用，但有三个坑，本脚本就是来堵这三个坑的。

    1. **缓存**。本站 CSS/JS 全内联在 HTML 里，`http.server` 会带
       `Last-Modified` 让浏览器走 304，改完文案刷新看不到变化，
       容易误判「我改的没生效」。这里对所有响应强制 no-store。
    2. **中文乱码**。`http.server` 给 `.txt` 的 Content-Type 不带
       charset，`llms.txt` / `llms-full.txt` 里的中文在浏览器里会花掉
       （给 AI 爬虫看的文件，本地校对时更需要看清）。
    3. **端口被占**。默认端口占用时 `http.server` 直接崩，
       这里自动往后找一个能用的。

    另外它把「站点根目录」定在 cwd，从 tools/ 里跑就成了空目录；
    本脚本无论从哪跑都以仓库根为根。

线上是 **GitHub Pages 项目页**，站点挂在 `/chihaofan/` 子路径下
（见 README「部署」一节）。所以本站所有链接都必须是**相对路径**——
一旦写成 `/icon.png` 这种根绝对路径，本地预览正常、线上 404。
本脚本默认把站点挂在 `/`，若想复现线上的子路径行为：

    python3 tools/serve.py --base /chihaofan
"""
import argparse
import functools
import http.server
import mimetypes
import os
import socket
import socketserver
import sys
import threading
import webbrowser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 首页 + 需要逐个过目的页面（启动时打印出来，省得自己翻目录）
PAGES = [
    ('index.html', '中文首页'),
    ('index-en.html', '英文首页'),
    ('changelog.html', '更新日志'),
    ('geo.html', 'AI 知识库（中）'),
    ('geo-en.html', 'AI 知识库（英）'),
    ('devlog.html', '开发日记（中）'),
    ('devlog-en.html', '开发日记（英）'),
    ('privacy.html', '隐私政策'),
    ('terms.html', '用户协议'),
    ('support.html', '技术支持'),
    ('llms.txt', 'llms.txt（给 AI 爬虫）'),
    ('llms-full.txt', 'llms-full.txt'),
    ('sitemap.xml', 'sitemap.xml'),
    ('robots.txt', 'robots.txt'),
]


class Handler(http.server.SimpleHTTPRequestHandler):
    """在 SimpleHTTPRequestHandler 上补 no-store 与 charset。"""

    base = ''

    # .txt/.xml/.json 明确带上 utf-8，否则中文在浏览器里花屏
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.txt': 'text/plain; charset=utf-8',
        '.xml': 'application/xml; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.html': 'text/html; charset=utf-8',
        '.svg': 'image/svg+xml',
        '.webmanifest': 'application/manifest+json',
    }

    def translate_path(self, path):
        # --base /chihaofan：复现线上子路径，剥掉前缀再交给父类
        if self.base and path.startswith(self.base):
            path = path[len(self.base):] or '/'
        return super().translate_path(path)

    def end_headers(self):
        # 本站样式内联在 HTML 里，缓存会让「改了没生效」这种误判频繁发生
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, fmt, *args):
        # 只报非 200，正常请求刷屏没意义
        status = args[1] if len(args) > 1 else ''
        if str(status).startswith(('4', '5')):
            sys.stderr.write('  %s %s\n' % (status, args[0]))


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


def pick_port(want, host):
    """端口被占就往后找，最多试 20 个。"""
    for port in range(want, want + 20):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                s.bind((host, port))
                return port
            except OSError:
                continue
    sys.exit('端口 %d~%d 都被占了，用 --port 指定一个' % (want, want + 19))


def lan_ip():
    """取本机在局域网里的地址（不实际发包）。"""
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
        try:
            s.connect(('10.255.255.255', 1))
            return s.getsockname()[0]
        except OSError:
            return None


def main():
    ap = argparse.ArgumentParser(description='吃好饭官网本地预览')
    ap.add_argument('--port', type=int, default=8000)
    ap.add_argument('--open', action='store_true', help='启动后打开浏览器')
    ap.add_argument('--lan', action='store_true',
                    help='监听 0.0.0.0，手机连同一个 Wi-Fi 就能访问')
    ap.add_argument('--base', default='',
                    help='挂载前缀，复现线上项目页的子路径，如 /chihaofan')
    args = ap.parse_args()

    mimetypes.init()
    host = '0.0.0.0' if args.lan else '127.0.0.1'
    port = pick_port(args.port, host)
    base = ('/' + args.base.strip('/')) if args.base.strip('/') else ''
    Handler.base = base

    handler = functools.partial(Handler, directory=ROOT)
    httpd = Server((host, port), handler)

    origin = 'http://127.0.0.1:%d%s' % (port, base)
    print('吃好饭官网预览：%s' % origin)
    print('站点根目录：%s' % ROOT)
    if args.lan:
        ip = lan_ip()
        if ip:
            print('局域网（手机可开）：http://%s:%d%s' % (ip, port, base))
        else:
            print('局域网地址取不到，检查是否连着 Wi-Fi')
    print('\n主要页面：')
    for path, label in PAGES:
        mark = '' if os.path.exists(os.path.join(ROOT, path)) else '  ← 文件不存在'
        print('  %-16s %s/%s%s' % (label, origin, path, mark))
    print('\nCtrl-C 退出。已关缓存，改完直接刷新即可。')
    sys.stdout.flush()   # 输出重定向到文件时也能立刻看到地址

    if args.open:
        threading.Timer(0.4, webbrowser.open, ['%s/index.html' % origin]).start()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\n已退出')
        httpd.server_close()


if __name__ == '__main__':
    main()
