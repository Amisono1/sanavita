#!/usr/bin/env python3
"""Збирає сторінки сайту: src/pages/*.html + спільні частини -> *.html у корені.

Кожна сторінка в src/pages починається з рядка-коментаря з метаданими:
<!-- {"title": "...", "description": "...", "active": "home"} -->
Запуск: python3 build.py
"""
import hashlib
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / "src"

NAV = [
    ("home", "Головна", "index.html"),
    ("departments", "Відділення", "departments.html"),
    ("doctors", "Лікарі", "doctors.html"),
    ("prices", "Ціни", "prices.html"),
    ("about", "Про нас", "index.html#about"),
    ("reviews", "Відгуки", "index.html#reviews"),
    ("blog", "Блог", "index.html#blog"),
    ("contacts", "Контакти", "contacts.html"),
]

LAYOUT = """<!doctype html>
<html lang="uk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{description}">
<meta name="theme-color" content="#fefff8">
<link rel="icon" href="assets/img/favicon.png" type="image/png">
<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/styles.css?v={ver}">
<script>
/* мобільний макет намальований під ширину 360 px: на ширших телефонах масштабуємо його пропорційно */
(function () {{
  function fit() {{
    var w = window.innerWidth;
    document.documentElement.style.zoom = (w > 360 && w <= 480) ? (w / 360) : "";
  }}
  fit();
  window.addEventListener("resize", fit);
  window.addEventListener("orientationchange", fit);
}})();
</script>
</head>
<body data-page="{active}">
{header}
<div class="page">
{body}
</div>
{footer}
<script src="js/main.js?v={ver}" defer></script>
</body>
</html>
"""


def nav_html(active, mobile):
    out = []
    for key, label, href in NAV:
        on = key == active
        if mobile:
            icon = "menu-dot.svg" if on else "chevron-right.svg"
            out.append(
                f'      <a class="menu__item{" is-active" if on else ""}" href="{href}"'
                f'{" aria-current=page" if on else ""}><span>{label}</span>'
                f'<img src="assets/icons/{icon}" alt=""></a>'
            )
        else:
            out.append(
                f'        <a class="nav__link{" is-active" if on else ""}" href="{href}"'
                f'{" aria-current=page" if on else ""}>{label}</a>'
            )
    return "\n".join(out)


def main():
    header_tpl = (SRC / "partials/header.html").read_text(encoding="utf-8")
    footer = (SRC / "partials/footer.html").read_text(encoding="utf-8")
    # версія файлів для скидання кешу браузера після кожного оновлення
    ver = hashlib.md5((ROOT / "css/styles.css").read_bytes() + (ROOT / "js/main.js").read_bytes()).hexdigest()[:8]
    for page in sorted((SRC / "pages").glob("*.html")):
        raw = page.read_text(encoding="utf-8")
        m = re.match(r"\s*<!--\s*(\{.*?\})\s*-->\s*", raw, re.S)
        if not m:
            raise SystemExit(f"{page.name}: немає рядка з метаданими")
        meta = json.loads(m.group(1))
        body = raw[m.end():]
        active = meta.get("active", "")
        header = header_tpl.replace("{{NAV_DESKTOP}}", nav_html(active, False)).replace(
            "{{NAV_MOBILE}}", nav_html(active, True)
        )
        html = LAYOUT.format(
            title=meta["title"],
            description=meta.get("description", ""),
            active=active,
            header=header,
            body=body.rstrip(),
            footer=footer,
            ver=ver,
        )
        (ROOT / page.name).write_text(html, encoding="utf-8")
        print("built", page.name)


if __name__ == "__main__":
    main()
