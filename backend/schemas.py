from marshmallow import Schema, fields, validate

class ArticleSchema(Schema):
    """文章创建/更新请求校验"""
    slug = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    title = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    category = fields.Str(required=True, validate=validate.OneOf(['frontend', 'topics', 'novels']))
    date = fields.Str(validate=validate.Regexp(r'^\d{4}-\d{2}-\d{2}$'), allow_none=True)
    content = fields.Str(allow_none=True)
    collection_id = fields.Str(allow_none=True, validate=validate.Length(max=100))
    isNew = fields.Bool(load_default=False)
    uid = fields.Str(allow_none=True, validate=validate.Length(max=50))

class FriendSchema(Schema):
    """友链添加/更新请求校验"""
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    url = fields.Url(required=True)
    desc = fields.Str(validate=validate.Length(max=200), allow_none=True)
    avatar = fields.Url(allow_none=True)
    tags = fields.List(fields.Str(validate=validate.Length(max=50)), allow_none=True)

class ArtworkSchema(Schema):
    """画廊作品添加/更新请求校验"""
    title = fields.Str(validate=validate.Length(max=100), allow_none=True)
    thumbnail = fields.Url(required=True)
    fullsize = fields.Url(required=True)
    description = fields.Str(validate=validate.Length(max=300), allow_none=True)
    date = fields.Str(validate=validate.Regexp(r'^\d{4}-\d{2}-\d{2}$'), allow_none=True)

class PlanSchema(Schema):
    """计划项添加/更新请求校验"""
    content = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    status = fields.Str(validate=validate.OneOf(['todo', 'doing', 'done']), load_default='todo')
    sort_order = fields.Int(validate=validate.Range(min=0), allow_none=True)

class SponsorSchema(Schema):
    """赞助者添加/更新请求校验"""
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    avatar = fields.Url(allow_none=True)
    url = fields.Url(allow_none=True)
    message = fields.Str(validate=validate.Length(max=500), allow_none=True)
    date = fields.Str(validate=validate.Regexp(r'^\d{4}-\d{2}-\d{2}$'), allow_none=True)

class CollectionSchema(Schema):
    """合集添加/更新请求校验"""
    slug = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    description = fields.Str(validate=validate.Length(max=300), allow_none=True)
    category = fields.Str(required=True, validate=validate.OneOf(['frontend', 'topics', 'novels']))
