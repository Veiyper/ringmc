import os

from flask import redirect, request, render_template, make_response, url_for
from . import index

from ..models.articles import Article
from ..models.builds import Build
from ..extensions import db

@index.route('/', methods=['GET', 'POST'])
def home():
    articles = db.session.execute(
        db.select(Article).order_by(Article.id.desc()).limit(3)
    ).scalars().all()
    builds = db.session.execute(
        db.select(Build).order_by(Build.id.desc()).limit(3)
    ).scalars().all()
    return render_template('index.html', articles=articles, builds=builds)

@index.route('/login', methods=['POST'])
def login():
    if request.method == 'POST':
        password = request.form.get('password')
        if password in [os.getenv('ADMIN_PASS'), os.getenv('USER_PASS')]:
            response = make_response(redirect(url_for('index.home')))
            response.set_cookie('password', password, max_age=60*60*24)
            return response
            
    return render_template('lockdown.html')

@index.route('/logout')
def logout():
    response = make_response(redirect(url_for('index.home')))
    response.set_cookie('password', '', max_age=0)
    return response