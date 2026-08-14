from typing import Any, Dict, List, cast
from flask import Blueprint, Response, jsonify, make_response
from models import Category, Collection, Article, Friend, Sponsor, Artwork, Contribution, Plan
from extensions import db

public_bp = Blueprint("public", __name__)

@public_bp.route("/articles/index")
def get_article_index() -> Response:
    data: Dict[str, Any] = {}
    data["_collections"] = {}

    categories: List[Category] = cast(
        List[Category], db.session.execute(db.select(Category)).scalars().all()
    )

    for cat in categories:
        articles: List[Article] = cast(
            List[Article],
            db.session.execute(
                db.select(Article).filter_by(category_id=cat.id, collection_id=None)
            ).scalars().all(),
        )
        data[cat.slug] = [a.to_dict_simple() for a in articles]

        collections: List[Collection] = cast(
            List[Collection],
            db.session.execute(
                db.select(Collection).filter_by(category_id=cat.id)
            ).scalars().all(),
        )
        data["_collections"][cat.slug] = [c.to_dict_simple() for c in collections]

    return jsonify(data)

@public_bp.route("/article/<category_slug>/<article_slug>")
def get_article_content(category_slug: str, article_slug: str) -> Response:
    category = db.session.execute(db.select(Category).filter_by(slug=category_slug)).scalar_one_or_none()
    if not category:
        return make_response(jsonify({"error": "Category not found"}), 404)

    article = db.session.execute(
        db.select(Article).filter_by(slug=article_slug, category_id=category.id)
    ).scalar_one_or_none()

    if not article:
        return make_response(jsonify({"error": "Article not found"}), 404)

    return jsonify({
        "id": article.slug,
        "title": article.title,
        "date": article.date,
        "content": article.content,
        "collection_id": article.collection_id, 
        "uid": article.uid
    })

@public_bp.route("/collection/<collection_slug>")
def get_collection_detail(collection_slug: str) -> Response:
    collection = db.session.execute(db.select(Collection).filter_by(slug=collection_slug)).scalar_one_or_none()
    if not collection:
        return make_response(jsonify({"error": "Collection not found"}), 404)

    return jsonify({
        "id": collection.slug,
        "name": collection.name,
        "description": collection.description,
        "articles": [a.to_dict_simple() for a in collection.articles]
    })

@public_bp.route("/friends")
def get_friends() -> Response:
    friends = db.session.execute(db.select(Friend)).scalars().all()
    return jsonify({"friends": [f.to_dict() for f in friends]})

@public_bp.route("/sponsors")
def get_sponsors() -> Response:
    sponsors = db.session.execute(db.select(Sponsor)).scalars().all()
    return jsonify({"sponsors": [s.to_dict() for s in sponsors]})

@public_bp.route("/artworks")
def get_artworks() -> Response:
    artworks = db.session.execute(db.select(Artwork)).scalars().all()
    return jsonify({"artworks": [a.to_dict() for a in artworks]})

@public_bp.route("/contributions")
def get_contributions() -> Response:
    contributions = db.session.execute(db.select(Contribution)).scalars().all()
    return jsonify({"contributions": [c.to_dict() for c in contributions]})

@public_bp.route("/plans")
def get_plans() -> Response:
    plans = db.session.execute(db.select(Plan)).scalars().all()
    return jsonify({"plans": [p.to_dict() for p in plans]})
