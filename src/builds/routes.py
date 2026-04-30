import os
from flask import render_template, request, jsonify, current_app, g
from werkzeug.utils import secure_filename
from pydantic import ValidationError

from src.models.builds import Build, BuildSchema
from . import builds
from ..extensions import db


@builds.route('/', methods=['GET'])
def builds_index():
    sort = request.args.get('sort', 'desc')
    author = request.args.get('author', None)
    if sort not in ['asc', 'desc']:
        sort = 'desc'

    if author:
        builds = db.session.execute(
            db.select(Build).where(Build.author == author).order_by(Build.id.asc() if sort == 'asc' else Build.id.desc())
        ).scalars().all()
    else:
        builds = db.session.execute(
            db.select(Build).order_by(Build.id.asc() if sort == 'asc' else Build.id.desc())
        ).scalars().all()
    return render_template('builds/index.html', builds=builds, sort=sort, author=author)

@builds.route('/create', methods=['POST'])
def create_build():
    try:
        form_data = {
            "name": request.form.get("name"),
            "description": request.form.get("description"),
            "author": request.form.get("author"),
            "images": []
        }

        uploaded_files = request.files.getlist("images")
        upload_folder = current_app.config['UPLOAD_FOLDER_BUILDS']
        
        for file in uploaded_files:
            if file.filename != '':
                filename = secure_filename(file.filename)
                file.save(os.path.join(upload_folder, filename))
                
                form_data["images"].append(filename)

        validated_data = BuildSchema(**form_data)

        new_build = Build(**validated_data.model_dump())
        db.session.add(new_build)
        db.session.commit()

        return render_template('builds/detail.html', build=new_build)

    except ValidationError as e:
        return jsonify(e.errors()), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    
@builds.route('/<int:build_id>')
def build_detail(build_id):
    build = db.session.get(Build, build_id)
    if not build:
        return "Build not found", 404
    return render_template('builds/detail.html', build=build)

@builds.route('/<int:build_id>', methods=['DELETE'])
def delete_build(build_id):
    if not g.is_admin:
        return {"error": "Unauthorized"}, 403
    build = db.session.get(Build, build_id)
    if not build:
        return "Build not found", 404
    db.session.delete(build)
    db.session.commit()
    return {"message": "Build deleted"}, 200