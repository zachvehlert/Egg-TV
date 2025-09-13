from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
from models import db, Link, Setting
import os

app = Flask(__name__)

# Enable CORS for browser extension and local development
CORS(app, origins=[
    'chrome-extension://*', 
    'moz-extension://*',
    'http://localhost:*',
    'http://127.0.0.1:*',
    'https://localhost:*',
    'https://127.0.0.1:*'
], supports_credentials=True)

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
            url=data['url'].strip()
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

@app.route('/api/extension/links', methods=['GET'])
def get_extension_links():
    """Get all links with rendered icon HTML for browser extension use"""
    try:
        links = Link.query.order_by(Link.created_at.asc()).all()
        extension_links = []
        
        for link in links:
            link_data = link.to_dict()
            
            # Generate simple favicon HTML for extension use
            try:
                from urllib.parse import urlparse
                parsed_url = urlparse(link_data['url'])
                domain = parsed_url.hostname
                # Use Google's favicon service which works better in extensions
                link_data['icon_html'] = f'<img src="https://www.google.com/s2/favicons?domain={domain}&sz=32" alt="{link_data["name"]}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 4px;" onerror="handleIconError(this, \'{domain}\', \'{link_data["name"]}\', 1)">'
                link_data['icon_type'] = 'favicon'
                link_data['favicon_domain'] = domain
            except:
                link_data['icon_html'] = '''<svg viewBox="0 0 16 16" style="width: 100%; height: 100%; color: var(--tvbox-accent-primary); fill: currentColor;">
                    <path d="m8 0 1.669.864 1.858.282.842 1.68 1.337 1.32L13.4 6l.306 1.854-1.337 1.32-.842 1.68-1.858.282L8 12l-1.669-.864-1.858-.282-.842-1.68-1.337-1.32L2.6 6l-.306-1.854 1.337-1.32.842-1.68L6.331.864 8 0z"/>
                    <path d="M4 11.794V16l4-1 4 1v-4.206l-2.018.306L8 13.126 6.018 12.1 4 11.794z"/>
                </svg>'''
                link_data['icon_type'] = 'fallback'
            
            extension_links.append(link_data)
            
        return jsonify({
            'success': True,
            'links': extension_links,
            'server_info': {
                'version': '1.0',
                'supports_icons': True
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'links': []
        }), 500

# Settings API Endpoints

@app.route('/api/settings', methods=['GET'])
def get_settings():
    """Get all settings"""
    try:
        settings = Setting.query.all()
        return jsonify({setting.key: setting.value for setting in settings})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/settings/<string:key>', methods=['GET'])
def get_setting(key):
    """Get a specific setting by key"""
    try:
        setting = Setting.query.filter_by(key=key).first()
        if setting:
            return jsonify({'key': setting.key, 'value': setting.value})
        else:
            # Return default values for known settings
            defaults = {
                'search_engine_url': 'https://www.google.com/search?q=',
                'accent_color': '#f8a5c2',
                'background_theme': '{"primary":"#111827","secondary":"#1f2937","card":"#374151"}'
            }
            return jsonify({'key': key, 'value': defaults.get(key, '')})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/settings/<string:key>', methods=['PUT'])
def update_setting(key):
    """Update or create a setting"""
    try:
        data = request.get_json()

        if not data or 'value' not in data:
            return jsonify({'error': 'Value is required'}), 400

        setting = Setting.query.filter_by(key=key).first()

        if setting:
            setting.value = data['value']
        else:
            setting = Setting(key=key, value=data['value'])
            db.session.add(setting)

        db.session.commit()

        return jsonify({'key': setting.key, 'value': setting.value})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/extension/health', methods=['GET'])
def extension_health():
    """Health check endpoint for browser extension"""
    return jsonify({
        'status': 'healthy',
        'server': 'tv-box',
        'version': '1.0'
    })

@app.route('/api/extension/search-url', methods=['GET'])
def get_extension_search_url():
    """Get search engine URL for extension use"""
    try:
        setting = Setting.query.filter_by(key='search_engine_url').first()
        search_url = setting.value if setting else 'https://www.google.com/search?q='
        return jsonify({
            'success': True,
            'search_url': search_url
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'search_url': 'https://www.google.com/search?q='
        }), 500

@app.route('/api/extension/accent-color', methods=['GET'])
def get_extension_accent_color():
    """Get accent color for extension use"""
    try:
        setting = Setting.query.filter_by(key='accent_color').first()
        accent_color = setting.value if setting else '#f8a5c2'
        return jsonify({
            'success': True,
            'accent_color': accent_color
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'accent_color': '#f8a5c2'
        }), 500

@app.route('/api/extension/background-theme', methods=['GET'])
def get_extension_background_theme():
    """Get background theme for extension use"""
    try:
        setting = Setting.query.filter_by(key='background_theme').first()
        background_theme = setting.value if setting else '{"primary":"#111827","secondary":"#1f2937","card":"#374151"}'
        return jsonify({
            'success': True,
            'background_theme': background_theme
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'background_theme': '{"primary":"#111827","secondary":"#1f2937","card":"#374151"}'
        }), 500


def create_tables():
    """Create database tables if they don't exist"""
    with app.app_context():
        db.create_all()

if __name__ == "__main__":
    create_tables()
    app.run(debug=True)
