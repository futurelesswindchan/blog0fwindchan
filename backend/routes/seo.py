"""
SEO 支援蓝图

职责：
  1. sitemap.xml —— 动态生成包含所有文章与页面的标准站点地图，供搜索引擎爬取。
  2. 爬虫 meta 注入 —— 检测搜索引擎 User-Agent，对爬虫请求返回带有页面专属
     title / description / og:* 标签的完整 HTML，解决纯 SPA 无法被正常索引的问题。
     普通浏览器请求不受影响，仍由 Vue SPA 接管。

NOTE: 此蓝图应在所有 API 蓝图之后、兜底 SPA 路由之前注册，且 url_prefix 为空字符串。
"""

import re
from datetime import datetime, timezone
from flask import Blueprint, Response, current_app, make_response, request
from models import Article, Category
from extensions import db

seo_bp = Blueprint("seo", __name__)

# ── 站点基础信息 ────────────────────────────────────────────────────────────────

SITE_URL = "https://qwq.windchan0v0.xyz"
SITE_NAME = "风风博客"
SITE_DESC = "记录技术手记、奇怪杂谈与幻想物语的个人博客。"
OG_IMAGE = f"{SITE_URL}/og-cover.png"

# ── 爬虫 UA 特征（主流搜索引擎） ────────────────────────────────────────────────

_BOT_UA_PATTERN = re.compile(
    r"(googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|sogou|exabot|facebot|ia_archiver)",
    re.IGNORECASE,
)


def _is_crawler(user_agent: str) -> bool:
    """判断请求是否来自搜索引擎爬虫。"""
    return bool(_BOT_UA_PATTERN.search(user_agent))


# ── HTML 模板 ────────────────────────────────────────────────────────────────────

def _build_seo_html(title: str, description: str, canonical: str, og_image: str = OG_IMAGE) -> str:
    """
    为爬虫构造一个轻量 HTML 响应。

    包含完整的 meta / og / twitter 标签，以及指向真实页面的 canonical，
    body 里放一段对搜索引擎有意义的纯文本摘要。

    NOTE: 不内联任何 JS/CSS，避免爬虫预算浪费在渲染资源上。
    """
    safe_title = title.replace('"', "&quot;")
    safe_desc = description.replace('"', "&quot;")

    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{safe_title} | {SITE_NAME}</title>
  <meta name="description" content="{safe_desc}" />
  <link rel="canonical" href="{canonical}" />

  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="{SITE_NAME}" />
  <meta property="og:title" content="{safe_title}" />
  <meta property="og:description" content="{safe_desc}" />
  <meta property="og:url" content="{canonical}" />
  <meta property="og:image" content="{og_image}" />
  <meta property="og:locale" content="zh_CN" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{safe_title}" />
  <meta name="twitter:description" content="{safe_desc}" />
  <meta name="twitter:image" content="{og_image}" />
</head>
<body>
  <h1>{safe_title}</h1>
  <p>{safe_desc}</p>
  <p>请访问 <a href="{canonical}">{canonical}</a> 查看完整内容。</p>
</body>
</html>"""


# ── sitemap.xml ──────────────────────────────────────────────────────────────────

@seo_bp.route("/sitemap.xml")
def sitemap() -> Response:
    """
    动态生成 sitemap.xml。

    包含：首页、各分类页、所有文章详情页。
    lastmod 取文章 date 字段；静态页使用当日日期。
    """
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    urls: list[dict] = []

    # 静态固定页面
    static_pages = [
        {"loc": f"{SITE_URL}/home",     "priority": "1.0", "changefreq": "daily"},
        {"loc": f"{SITE_URL}/articles", "priority": "0.9", "changefreq": "weekly"},
        {"loc": f"{SITE_URL}/gallery",  "priority": "0.7", "changefreq": "monthly"},
        {"loc": f"{SITE_URL}/friends",  "priority": "0.6", "changefreq": "monthly"},
    ]
    for page in static_pages:
        urls.append({**page, "lastmod": today})

    # 分类页
    categories = db.session.execute(db.select(Category)).scalars().all()
    for cat in categories:
        urls.append({
            "loc": f"{SITE_URL}/articles/{cat.slug}",
            "lastmod": today,
            "priority": "0.8",
            "changefreq": "weekly",
        })

    # 文章详情页
    articles = db.session.execute(db.select(Article)).scalars().all()
    for article in articles:
        cat = db.session.get(Category, article.category_id)
        if not cat:
            continue
        urls.append({
            "loc": f"{SITE_URL}/articles/{cat.slug}/{article.slug}",
            "lastmod": article.date,
            "priority": "0.9",
            "changefreq": "monthly",
        })

    # 组装 XML
    url_entries = "\n".join(
        f"""  <url>
    <loc>{u["loc"]}</loc>
    <lastmod>{u["lastmod"]}</lastmod>
    <changefreq>{u["changefreq"]}</changefreq>
    <priority>{u["priority"]}</priority>
  </url>"""
        for u in urls
    )

    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{url_entries}
</urlset>"""

    resp = make_response(xml)
    resp.headers["Content-Type"] = "application/xml; charset=utf-8"
    return resp


# ── 爬虫 meta 注入（SPA 路由拦截） ──────────────────────────────────────────────

@seo_bp.route("/articles/<category_slug>/<article_slug>")
def seo_article(category_slug: str, article_slug: str) -> Response:
    """
    文章详情页的爬虫 meta 注入端点。

    爬虫命中时：查询数据库取标题与正文摘要，返回纯 meta HTML。
    普通浏览器：重定向至 SPA（由 Nginx/前端路由接管）。

    NOTE: 此路由与前端 SPA 路由路径相同，依赖 Nginx 将爬虫流量路由至 Flask，
          普通请求走静态文件服务。详见部署说明。
    """
    ua = request.headers.get("User-Agent", "")
    if not _is_crawler(ua):
        # 非爬虫：返回 SPA 壳，让前端 Vue Router 接管
        return current_app.send_static_file("index.html")  # type: ignore[return-value]

    category = db.session.execute(
        db.select(Category).filter_by(slug=category_slug)
    ).scalar_one_or_none()

    article = (
        db.session.execute(
            db.select(Article).filter_by(slug=article_slug, category_id=category.id)
        ).scalar_one_or_none()
        if category
        else None
    )

    if not article:
        return make_response(_build_seo_html(
            title="页面未找到",
            description=f"{SITE_NAME} - 该文章不存在或已被删除。",
            canonical=f"{SITE_URL}/articles/{category_slug}/{article_slug}",
        ), 404)

    # 取正文前 120 字作为摘要（去除 Markdown 符号）
    raw_content = article.content or ""
    plain = re.sub(r"[#*`>\[\]!_~\-]", "", raw_content).strip()
    plain = re.sub(r"\s+", " ", plain)
    excerpt = plain[:120] + ("..." if len(plain) > 120 else "")

    canonical = f"{SITE_URL}/articles/{category_slug}/{article_slug}"
    html = _build_seo_html(
        title=article.title,
        description=excerpt or SITE_DESC,
        canonical=canonical,
    )
    return make_response(html, 200)


@seo_bp.route("/articles/<category_slug>")
def seo_category(category_slug: str) -> Response:
    """
    分类列表页的爬虫 meta 注入端点。
    """
    ua = request.headers.get("User-Agent", "")
    if not _is_crawler(ua):
        return current_app.send_static_file("index.html")  # type: ignore[return-value]

    category = db.session.execute(
        db.select(Category).filter_by(slug=category_slug)
    ).scalar_one_or_none()

    if not category:
        return make_response(_build_seo_html(
            title="分类未找到",
            description=f"{SITE_NAME} - 该分类不存在。",
            canonical=f"{SITE_URL}/articles/{category_slug}",
        ), 404)

    canonical = f"{SITE_URL}/articles/{category_slug}"
    html = _build_seo_html(
        title=f"{category.name} - 文章列表",
        description=f"{SITE_NAME} {category.name}分类下的所有文章。",
        canonical=canonical,
    )
    return make_response(html, 200)
