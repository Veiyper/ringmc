from flask import request, render_template, g
from pydantic import ValidationError
from . import articles
from ..models.articles import Article, ArticleSchema
from ..extensions import db

@articles.route('/', methods=['GET', 'POST'])
def articles_index():
    if request.method == 'POST':
        data = None

        try:
            data = ArticleSchema(**request.get_json())
        except ValidationError as e:
            return {"error": e.errors()}, 400
        
        if data:
            article = Article(**data.model_dump())
            db.session.add(article)
            db.session.commit()
        else:
            return {"error": "Invalid data"}, 400

    sort = request.args.get('sort', 'desc')
    category = request.args.get('category', None)
    author = request.args.get('author', None)

    if sort not in ['asc', 'desc']:
        sort = 'desc'
    if category not in [None, 'Service', 'Item', 'Autre']:
        category = None

    articles = None
    query = db.select(Article)
    if category:
        query = query.where(Article.category == category)
    if author:
        query = query.where(Article.author == author)
    if sort == 'asc':
        query = query.order_by(Article.id.asc())
    else:
        query = query.order_by(Article.id.desc())
    articles = db.session.execute(query).scalars().all()
    return render_template('articles/index.html', articles=articles, sort=sort, category=category, author=author)

@articles.route('/<int:article_id>')
def article_detail(article_id):
    article = db.session.get(Article, article_id)
    if not article:
        return "Article not found", 404
    return render_template('articles/detail.html', article=article)

@articles.route('/<int:article_id>', methods=['DELETE'])
def delete_article(article_id):
    if not g.is_admin:
        return {"error": "Unauthorized"}, 403
    article = db.session.get(Article, article_id)
    if not article:
        return "Article not found", 404
    db.session.delete(article)
    db.session.commit()
    return {"message": "Article deleted"}, 200