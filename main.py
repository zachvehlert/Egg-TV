from flask import Flask, render_template, jsonify, request
from models import db, Link
import os

app = Flask(__name__)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///tv_box.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db.init_app(app)

@app.route('/')
def index():
    return render_template('index.html')

# API Endpoints

@app.route('/api/links', methods=['GET'])
def get_links():
    """Get all links"""
    try:
        links = Link.query.order_by(Link.created_at.asc()).all()
        return jsonify([link.to_dict() for link in links])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/links', methods=['POST'])
def create_link():
    """Create a new link"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not data.get('name') or not data.get('url'):
            return jsonify({'error': 'Name and URL are required'}), 400
        
        # Create new link
        link = Link(
            name=data['name'].strip(),
            url=data['url'].strip(),
            custom_icon=data.get('custom_icon'),
            icon_color=data.get('icon_color')
        )
        
        db.session.add(link)
        db.session.commit()
        
        return jsonify(link.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/links/<int:link_id>', methods=['PUT'])
def update_link(link_id):
    """Update an existing link"""
    try:
        link = Link.query.get_or_404(link_id)
        data = request.get_json()
        
        # Validate required fields
        if not data or not data.get('name') or not data.get('url'):
            return jsonify({'error': 'Name and URL are required'}), 400
        
        # Update link fields
        link.name = data['name'].strip()
        link.url = data['url'].strip()
        link.custom_icon = data.get('custom_icon')
        link.icon_color = data.get('icon_color')
        
        db.session.commit()
        
        return jsonify(link.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/links/<int:link_id>', methods=['DELETE'])
def delete_link(link_id):
    """Delete a link"""
    try:
        link = Link.query.get_or_404(link_id)
        db.session.delete(link)
        db.session.commit()
        
        return jsonify({'message': 'Link deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

def create_tables():
    """Create database tables if they don't exist"""
    with app.app_context():
        db.create_all()

if __name__ == "__main__":
    create_tables()
    app.run(debug=True)
