import os
import uuid
from typing import Any, Dict, Optional, cast
from datetime import datetime

from flask import Blueprint, current_app, jsonify, request, Response
from flask_jwt_extended import jwt_required
from marshmallow import ValidationError

from extensions import db, limiter
from models import Article, Category, Collection, Friend, Artwork, Plan, Sponsor, Contribution
from schemas import ArticleSchema, CollectionSchema, FriendSchema, ArtworkSchema, PlanSchema, SponsorSchema
from routes.assets import allowed_file

admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/articles", methods=["POST"])
@jwt_required()
@limiter.limit("30 per minute")
def save_article():
    data: Dict[str, Any] = request.json or {}
    is_new = data.get("isNew", False)

    schema = ArticleSchema()
    try:
        validated_data: Dict[str, Any] = schema.load(data)
    except ValidationError as err:
        return jsonify({"error": "Validation failed", "details": err.messages}), 400

    try:
        category = cast(Optional[Category], Category.query.filter_by(slug=validated_data["category"]).first())
        if not category:
            return jsonify({"error": "Invalid category"}), 400

        collection_slug = validated_data.get("collection_id")
        real_collection_id: Optional[int] = None
        if collection_slug:
            col = cast(Optional[Collection], Collection.query.filter_by(slug=collection_slug).first())
            if col:
                real_collection_id = col.id

        if is_new:
            if Article.query.filter_by(slug=validated_data["slug"]).first():
                return jsonify({"error": "Slug already exists"}), 400

            article = Article(
                slug=validated_data["slug"],
                title=validated_data["title"],
                date=validated_data.get("date", datetime.now().strftime("%Y-%m-%d")),
                content=validated_data.get("content", ""),
                category_id=category.id,
                uid=str(uuid.uuid4())[:8],
                collection_id=real_collection_id
            )
            db.session.add(article)
        else:
            article = cast(Optional[Article], Article.query.filter_by(slug=validated_data["slug"]).first())
            if not article:
                return jsonify({"error": "Article not found"}), 404

            article.title = validated_data["title"]
            article.date = str(validated_data.get("date", article.date))
            article.content = validated_data.get("content", "")
            article.category_id = category.id
            article.collection_id = real_collection_id

        today_str = datetime.now().strftime("%Y-%m-%d")
        contrib = cast(Optional[Contribution], Contribution.query.filter_by(date=today_str).first())
        if contrib:
            contrib.count += 1
        else:
            new_contrib = Contribution(date=today_str, count=1)
            db.session.add(new_contrib)

        db.session.commit()
        return jsonify({"message": "Article saved successfully", "id": article.slug})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/articles/<slug>", methods=["DELETE"])
@jwt_required()
def delete_article(slug: str):
    article = cast(Optional[Article], Article.query.filter_by(slug=slug).first())
    if article:
        db.session.delete(article)
        db.session.commit()
        return jsonify({"message": "Deleted"})
    return jsonify({"error": "Not found"}), 404


@admin_bp.route("/admin/assets", methods=["GET"])
@jwt_required()
def get_article_assets():
    upload_folder_str = cast(str, current_app.config['UPLOAD_FOLDER'])
    assets_dir = os.path.join(upload_folder_str, 'article')

    if not os.path.exists(assets_dir):
        return jsonify({"assets": []})

    assets: list[Dict[str, Any]] = []
    with os.scandir(assets_dir) as entries:
        for entry in entries:
            # allowed_file 只接受文件名字符串，跳过非图片文件
            if entry.is_file():
                mtime = entry.stat().st_mtime
                url = f"/api/static/uploads/article/{entry.name}"
                assets.append({
                    "name": entry.name,
                    "url": url,
                    "mtime": mtime,
                    "date": datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M')
                })
    assets.sort(key=lambda x: float(x['mtime']), reverse=True)
    return jsonify({"assets": assets})


@admin_bp.route("/admin/assets", methods=["DELETE"])
@jwt_required()
def delete_article_asset():
    filename = request.args.get('filename')
    if not filename:
        return jsonify({"error": "Filename required"}), 400
    safe_filename = os.path.basename(filename)
    upload_folder_del = cast(str, current_app.config['UPLOAD_FOLDER'])
    file_path = os.path.join(upload_folder_del, 'article', safe_filename)

    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            return jsonify({"message": "File deleted"})
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    return jsonify({"error": "File not found"}), 404


@admin_bp.route("/admin/collections", methods=["POST"])
@jwt_required()
@limiter.limit("30 per minute")
def add_collection():
    data: Dict[str, Any] = request.json or {}
    schema = CollectionSchema()
    try:
        validated_data: Dict[str, Any] = schema.load(data)
    except ValidationError as err:
        return jsonify({"error": "Validation failed", "details": err.messages}), 400

    category = cast(Optional[Category], Category.query.filter_by(slug=validated_data["category"]).first())
    if not category:
        return jsonify({"error": "Invalid category"}), 400

    if Collection.query.filter_by(slug=validated_data["slug"]).first():
        return jsonify({"error": "Collection slug already exists"}), 400

    try:
        new_col = Collection(
            slug=validated_data["slug"],
            name=validated_data["name"],
            description=validated_data.get("description", ""),
            category_id=category.id
        )
        db.session.add(new_col)
        db.session.commit()
        return jsonify({"message": "Collection created"})
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Failed to create collection: {str(e)}")
        return jsonify({"error": "Failed to create collection"}), 500


@admin_bp.route("/admin/collections/<slug>", methods=["DELETE"])
@jwt_required()
def delete_collection(slug: str):
    col = cast(Optional[Collection], Collection.query.filter_by(slug=slug).first())
    if not col:
        return jsonify({"error": "Collection not found"}), 404
    Article.query.filter_by(collection_id=col.id).update({"collection_id": None})
    db.session.delete(col)
    db.session.commit()
    return jsonify({"message": "Collection deleted safely, articles are now independent."})


@admin_bp.route("/admin/collections/<slug>", methods=["PUT"])
@jwt_required()
def update_collection(slug: str):
    data: Dict[str, Any] = request.json or {}
    col = cast(Optional[Collection], Collection.query.filter_by(slug=slug).first())
    if not col:
        return jsonify({"error": "Collection not found"}), 404
    col.name = data.get("name", col.name)
    col.description = data.get("description", col.description)
    db.session.commit()
    return jsonify({"message": "Collection updated"})


@admin_bp.route("/friends", methods=["POST"])
@jwt_required()
@limiter.limit("20 per minute")
def add_friend():
    data: Dict[str, Any] = request.json or {}
    schema = FriendSchema()
    try:
        validated_data: Dict[str, Any] = schema.load(data)
    except ValidationError as err:
        return jsonify({"error": "Validation failed", "details": err.messages}), 400
    try:
        new_friend = Friend(
            name=validated_data["name"],
            desc=validated_data.get("desc", ""),
            url=validated_data["url"],
            avatar=validated_data.get("avatar", ""),
            tags=validated_data.get("tags", [])
        )
        db.session.add(new_friend)
        db.session.commit()
        return jsonify({"message": "Friend added", "friend": new_friend.to_dict()})
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Failed to add friend: {str(e)}")
        return jsonify({"error": "Failed to add friend"}), 500


@admin_bp.route("/friends/<int:id>", methods=["PUT"])
@jwt_required()
@limiter.limit("30 per minute")
def update_friend(id: int):
    data: Dict[str, Any] = request.json or {}
    schema = FriendSchema(partial=True)
    try:
        validated_data: Dict[str, Any] = schema.load(data)
    except ValidationError as err:
        return jsonify({"error": "Validation failed", "details": err.messages}), 400

    friend = db.session.get(Friend, id)
    if not friend:
        return jsonify({"error": "Friend not found"}), 404
    try:
        friend.name = validated_data.get("name", friend.name)
        friend.desc = validated_data.get("desc", friend.desc)
        friend.url = validated_data.get("url", friend.url)
        friend.avatar = validated_data.get("avatar", friend.avatar)
        friend.tags = validated_data.get("tags", friend.tags)
        db.session.commit()
        return jsonify({"message": "Friend updated", "friend": friend.to_dict()})
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Failed to update friend: {str(e)}")
        return jsonify({"error": "Failed to update friend"}), 500


@admin_bp.route("/friends/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_friend(id: int):
    friend = db.session.get(Friend, id)
    if not friend:
        return jsonify({"error": "Friend not found"}), 404
    db.session.delete(friend)
    db.session.commit()
    return jsonify({"message": "Friend deleted"})


@admin_bp.route("/artworks", methods=["POST"])
@jwt_required()
@limiter.limit("20 per minute")
def add_artwork():
    data: Dict[str, Any] = request.json or {}
    schema = ArtworkSchema()
    try:
        validated_data: Dict[str, Any] = schema.load(data)
    except ValidationError as err:
        return jsonify({"error": "Validation failed", "details": err.messages}), 400
    try:
        new_work = Artwork(
            title=validated_data.get("title", "Untitled"),
            thumbnail=validated_data["thumbnail"],
            fullsize=validated_data["fullsize"],
            description=validated_data.get("description", ""),
            date=validated_data.get("date", datetime.now().strftime("%Y-%m-%d"))
        )
        db.session.add(new_work)
        db.session.commit()
        return jsonify({"message": "Artwork added", "artwork": new_work.to_dict()})
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Failed to add artwork: {str(e)}")
        return jsonify({"error": "Failed to add artwork"}), 500


@admin_bp.route("/artworks/<int:id>", methods=["PUT"])
@jwt_required()
@limiter.limit("30 per minute")
def update_artwork(id: int):
    data: Dict[str, Any] = request.json or {}
    schema = ArtworkSchema(partial=True)
    try:
        validated_data: Dict[str, Any] = schema.load(data)
    except ValidationError as err:
        return jsonify({"error": "Validation failed", "details": err.messages}), 400

    work = db.session.get(Artwork, id)
    if not work:
        return jsonify({"error": "Artwork not found"}), 404
    try:
        work.title = validated_data.get("title", work.title)
        work.thumbnail = validated_data.get("thumbnail", work.thumbnail)
        work.fullsize = validated_data.get("fullsize", work.fullsize)
        work.description = validated_data.get("description", work.description)
        work.date = validated_data.get("date", work.date)
        db.session.commit()
        return jsonify({"message": "Artwork updated", "artwork": work.to_dict()})
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Failed to update artwork: {str(e)}")
        return jsonify({"error": "Failed to update artwork"}), 500


@admin_bp.route("/artworks/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_artwork(id: int):
    work = db.session.get(Artwork, id)
    if not work:
        return jsonify({"error": "Artwork not found"}), 404
    db.session.delete(work)
    db.session.commit()
    return jsonify({"message": "Artwork deleted"})


@admin_bp.route("/admin/plans", methods=["POST"])
@jwt_required()
@limiter.limit("30 per minute")
def add_plan():
    try:
        data: Dict[str, Any] = request.json or {}
        validated: Dict[str, Any] = PlanSchema().load(data)
    except ValidationError as e:
        return jsonify({"error": "Input validation failed", "details": e.messages}), 400

    status = validated.get("status", "todo")
    max_order = db.session.query(db.func.max(Plan.sort_order)).scalar() or 0
    new_plan = Plan(content=validated["content"], status=status, sort_order=max_order + 1)
    db.session.add(new_plan)
    db.session.commit()
    return jsonify(new_plan.to_dict())


@admin_bp.route("/admin/plans/<int:id>", methods=["PUT"])
@jwt_required()
@limiter.limit("30 per minute")
def update_plan(id: int):
    try:
        data: Dict[str, Any] = request.json or {}
        validated: Dict[str, Any] = PlanSchema(partial=True).load(data)
    except ValidationError as e:
        return jsonify({"error": "Input validation failed", "details": e.messages}), 400

    plan = db.session.get(Plan, id)
    if not plan:
        return jsonify({"error": "Plan not found"}), 404
    if "status" in validated and validated["status"] != plan.status:
        plan.status = validated["status"]
        plan.update_date = datetime.now().strftime("%Y-%m-%d")
    if "content" in validated:
        plan.content = validated["content"]
    db.session.commit()
    return jsonify(plan.to_dict())


@admin_bp.route("/admin/plans/<int:id>", methods=["DELETE"])
@jwt_required()
@limiter.limit("30 per minute")
def delete_plan(id: int):
    try:
        plan = db.session.get(Plan, id)
        if not plan:
            return jsonify({"error": "Plan not found"}), 404
        db.session.delete(plan)
        db.session.commit()
        return jsonify({"message": "Plan deleted"})
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting plan {id}: {str(e)}")
        return jsonify({"error": "Failed to delete plan"}), 500


@admin_bp.route("/admin/plans/reorder", methods=["PUT"])
@jwt_required()
def reorder_plans() -> Response:
    data: list[Dict[str, Any]] = request.json or []
    for item in data:
        plan_id = item.get("id")
        sort_order = item.get("sort_order")
        if plan_id is not None and sort_order is not None:
            plan = db.session.get(Plan, plan_id)
            if plan:
                plan.sort_order = sort_order
    db.session.commit()
    return jsonify({"message": "Reorder successful"})


@admin_bp.route("/sponsors", methods=["POST"])
@jwt_required()
@limiter.limit("30 per minute")
def add_sponsor():
    try:
        data: Dict[str, Any] = request.json or {}
        validated: Dict[str, Any] = SponsorSchema().load(data)
    except ValidationError as e:
        return jsonify({"error": "Input validation failed", "details": e.messages}), 400

    new_sponsor = Sponsor(
        name=validated["name"],
        avatar=validated.get("avatar"),
        url=validated.get("url"),
        message=validated.get("message"),
        date=validated.get("date")
    )
    db.session.add(new_sponsor)
    db.session.commit()
    return jsonify({"message": "Sponsor added", "sponsor": new_sponsor.to_dict()})


@admin_bp.route("/sponsors/<int:id>", methods=["PUT"])
@jwt_required()
@limiter.limit("30 per minute")
def update_sponsor(id: int):
    try:
        data: Dict[str, Any] = request.json or {}
        validated: Dict[str, Any] = SponsorSchema(partial=True).load(data)
    except ValidationError as e:
        return jsonify({"error": "Input validation failed", "details": e.messages}), 400

    sponsor = db.session.get(Sponsor, id)
    if not sponsor:
        return jsonify({"message": "Sponsor not found"}), 404
    if "name" in validated:
        sponsor.name = validated["name"]
    if "avatar" in validated:
        sponsor.avatar = validated["avatar"]
    if "url" in validated:
        sponsor.url = validated["url"]
    if "message" in validated:
        sponsor.message = validated["message"]
    if "date" in validated:
        sponsor.date = validated["date"]
    db.session.commit()
    return jsonify({"message": "Sponsor updated", "sponsor": sponsor.to_dict()})


@admin_bp.route("/sponsors/<int:id>", methods=["DELETE"])
@jwt_required()
@limiter.limit("30 per minute")
def delete_sponsor(id: int):
    try:
        sponsor = db.session.get(Sponsor, id)
        if not sponsor:
            return jsonify({"message": "Sponsor not found"}), 404
        db.session.delete(sponsor)
        db.session.commit()
        return jsonify({"message": "Sponsor deleted"})
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting sponsor {id}: {str(e)}")
        return jsonify({"error": "Failed to delete sponsor"}), 500
