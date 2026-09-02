#!/usr/bin/env python3
"""
Assemble the static pages from src/pages/*.html + src/partials/*.html.

This is a DEV convenience only — the files it writes are plain, standalone
HTML with no build step, no includes and no runtime dependency. Its single
job is to guarantee that the header, CTA band and footer are byte-identical
on every page, which is exactly what makes the later WordPress cut-up safe.

  <!--@name-->   include src/partials/name.html (recursive)
  {{VAR}}        substitute from the page's CONFIG block (missing -> "")
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PARTIALS = os.path.join(ROOT, 'src', 'partials')
PAGES = os.path.join(ROOT, 'src', 'pages')

INCLUDE = re.compile(r'^([ \t]*)<!--@([a-z0-9-]+)-->[ \t]*$', re.M)
VAR = re.compile(r'\{\{([A-Z_]+)\}\}')
CONFIG = re.compile(r'^<!--CONFIG\s*(\{.*?\})\s*-->\s*', re.S)


def expand(text, depth=0):
    if depth > 6:
        raise RuntimeError('include nesting too deep')

    def sub(m):
        indent, name = m.group(1), m.group(2)
        path = os.path.join(PARTIALS, name + '.html')
        if not os.path.exists(path):
            raise FileNotFoundError('missing partial: ' + name)
        with open(path) as fh:
            body = expand(fh.read().rstrip('\n'), depth + 1)
        return '\n'.join(indent + ln if ln.strip() else ln for ln in body.split('\n'))

    return INCLUDE.sub(sub, text)


def build(page_path):
    with open(page_path) as fh:
        raw = fh.read()
    m = CONFIG.match(raw)
    if not m:
        raise RuntimeError('no CONFIG block in ' + page_path)
    cfg = json.loads(m.group(1))
    html = expand(raw[m.end():])
    missing = set()

    def repl(mm):
        key = mm.group(1)
        if key not in cfg:
            missing.add(key)
        return str(cfg.get(key, ''))

    html = VAR.sub(repl, html)
    out = os.path.join(ROOT, cfg['out'])
    os.makedirs(os.path.dirname(out) or '.', exist_ok=True)
    with open(out, 'w') as fh:
        fh.write(html.rstrip('\n') + '\n')
    return cfg['out'], len(html), sorted(missing)


if __name__ == '__main__':
    names = sys.argv[1:] or sorted(
        f for f in os.listdir(PAGES) if f.endswith('.html')
    )
    total = 0
    for n in names:
        out, size, missing = build(os.path.join(PAGES, n))
        total += 1
        note = ('  [defaulted: %s]' % ', '.join(missing)) if missing else ''
        print('  %-52s %6d bytes%s' % (out, size, note))
    print('built %d page(s)' % total)
