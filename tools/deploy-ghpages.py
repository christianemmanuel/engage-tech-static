#!/usr/bin/env python3
"""
Produce dist/ for GitHub Pages from the built site.

GitHub Pages serves PROJECT sites under a subpath (/<repo>/), while the site
deliberately uses root-relative URLs (/assets/..., /services/...) because that
is what the WordPress build needs. This script bridges the two at deploy time:

  1. copies the built pages + assets into dist/
  2. prefixes every root-relative href/src with the base path
  3. injects <meta name="robots" content="noindex"> so the preview never
     competes with engagetechsolutions.us in search

The source tree is never modified. Usage:
    python3 tools/deploy-ghpages.py [base-path]      # default: /engage-tech-static
"""
import os, re, shutil, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = (sys.argv[1] if len(sys.argv) > 1 else '/engage-tech-static').rstrip('/')
DIST = os.path.join(ROOT, 'dist')

PAGES = [
    'index.html',
    'about-us/index.html',
    'contact/index.html',
    'services/managed-it-services/index.html',
    'in/raleigh/managed-it-services/index.html',
    'industries/healthcare-it-services/index.html',
    'blog/cyber-insurance-controls-2026/index.html',
]

# href="/x" or src="/x" — but not protocol-relative ("//") and not already prefixed
ATTR = re.compile(r'(href|src)="/(?!/)')
NOINDEX = '<meta name="robots" content="noindex">'


def rewrite(html: str) -> str:
    html = ATTR.sub(lambda m: '%s="%s/' % (m.group(1), BASE), html)
    if NOINDEX not in html:
        html = html.replace('<meta charset="utf-8">',
                            '<meta charset="utf-8">\n' + NOINDEX, 1)
    return html


def main():
    if os.path.isdir(DIST):
        shutil.rmtree(DIST)
    os.makedirs(DIST)

    for rel in PAGES:
        src = os.path.join(ROOT, rel)
        dst = os.path.join(DIST, rel)
        os.makedirs(os.path.dirname(dst) or DIST, exist_ok=True)
        with open(src) as fh:
            html = rewrite(fh.read())
        with open(dst, 'w') as fh:
            fh.write(html)

    shutil.copytree(os.path.join(ROOT, 'assets'), os.path.join(DIST, 'assets'),
                    ignore=shutil.ignore_patterns('.DS_Store'))

    # 404 that sends people back to the preview home
    with open(os.path.join(DIST, '404.html'), 'w') as fh:
        fh.write('<!doctype html><meta charset="utf-8">' + NOINDEX +
                 '<meta http-equiv="refresh" content="0;url=%s/">' % BASE +
                 '<title>Redirecting</title><a href="%s/">Engage Tech preview</a>' % BASE)

    n = sum(len(files) for _, _, files in os.walk(DIST))
    print('dist/ ready: %d files, base path %s/' % (n, BASE))


if __name__ == '__main__':
    main()
