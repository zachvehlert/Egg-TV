from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
from models import db, Link
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

@app.route('/api/extension/links', methods=['GET'])
def get_extension_links():
    """Get all links with rendered icon HTML for browser extension use"""
    try:
        links = Link.query.order_by(Link.created_at.asc()).all()
        extension_links = []
        
        for link in links:
            link_data = link.to_dict()
            
            # Generate the exact same icon HTML that the webapp uses
            if link_data['custom_icon']:
                color = link_data['icon_color'] or 'var(--tvbox-accent-primary)'
                # Convert Bootstrap Icon classes to inline SVGs for extension compatibility
                svg_icon = get_bootstrap_icon_svg(link_data['custom_icon'], color)
                if svg_icon:
                    link_data['icon_html'] = svg_icon
                    link_data['icon_type'] = 'bootstrap_svg'
                else:
                    # Fallback to generic icon if specific SVG not found
                    link_data['icon_html'] = f'''<svg viewBox="0 0 20 20" style="width: 100%; height: 100%; color: {color};">
                        <path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd"/>
                    </svg>'''
                    link_data['icon_type'] = 'fallback'
            else:
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

@app.route('/api/extension/health', methods=['GET'])
def extension_health():
    """Health check endpoint for browser extension"""
    return jsonify({
        'status': 'healthy',
        'server': 'tv-box',
        'version': '1.0'
    })

def get_bootstrap_icon_svg(icon_class, color):
    """Convert Bootstrap Icon class to inline SVG"""
    # Map of Bootstrap Icon classes to their SVG paths (from Bootstrap Icons official repo)
    icon_svgs = {
        'bi-trophy-fill': '''<svg viewBox="0 0 16 16" style="width: 100%; height: 100%; color: {color}; fill: currentColor;">
            <path d="M2.5.5A.5.5 0 0 1 3 0h10a.5.5 0 0 1 .5.5q0 .807-.034 1.536a3 3 0 1 1-1.133 5.89c-.79 1.865-1.878 2.777-2.833 3.011v2.173l1.425.356c.194.048.377.135.537.255L13.3 15.1a.5.5 0 0 1-.3.9H3a.5.5 0 0 1-.3-.9l1.838-1.379c.16-.12.343-.207.537-.255L6.5 13.11v-2.173c-.955-.234-2.043-1.146-2.833-3.012a3 3 0 1 1-1.132-5.89A33 33 0 0 1 2.5.5m.099 2.54a2 2 0 0 0 .72 3.935c-.333-1.05-.588-2.346-.72-3.935m10.083 3.935a2 2 0 0 0 .72-3.935c-.133 1.59-.388 2.885-.72 3.935"/>
        </svg>''',
        'bi-reddit': '''<svg viewBox="0 0 16 16" style="width: 100%; height: 100%; color: {color}; fill: currentColor;">
            <path d="M6.167 8a.831.831 0 0 0-.83.83c0 .459.372.84.83.831a.831.831 0 0 0 0-1.661m1.843 3.647c.315 0 1.403-.038 1.976-.611a.232.232 0 0 0 0-.306.213.213 0 0 0-.306 0c-.353.363-1.126.487-1.67.487-.545 0-1.317-.124-1.67-.487a.213.213 0 0 0-.306 0 .232.232 0 0 0 0 .306c.573.573 1.661.611 1.976.611M9.833 7.17c0 .459-.372.84-.831.84-.458 0-.83-.381-.83-.84 0-.458.372-.83.83-.83.459 0 .831.372.831.83"/>
            <path d="M2.52 12.294A2.389 2.389 0 0 1 0 9.927c0-1.263 1.056-2.317 2.317-2.317.319 0 .625.077.897.198.326-.34.766-.599 1.288-.721A4.72 4.72 0 0 1 5.928 5.79c.652-1.142 1.902-1.904 3.316-1.904 1.414 0 2.664.762 3.316 1.904.319.561.497 1.201.497 1.873.522.122.962.381 1.288.721.272-.121.578-.198.897-.198A2.317 2.317 0 0 1 17.56 9.927a2.389 2.389 0 0 1-2.52 2.367c-.065.543-.312 1.031-.712 1.378-.652.561-1.627.848-2.756.848s-2.104-.287-2.756-.848c-.4-.347-.647-.835-.712-1.378"/>
        </svg>''',
        'bi-trophy': '''<svg viewBox="0 0 16 16" style="width: 100%; height: 100%; color: {color}; fill: currentColor;">
            <path d="M2.5.5A.5.5 0 0 1 3 0h10a.5.5 0 0 1 .5.5q0 .807-.034 1.536a3 3 0 1 1-1.133 5.89c-.79 1.865-1.878 2.777-2.833 3.011v2.173l1.425.356c.194.048.377.135.537.255L13.3 15.1a.5.5 0 0 1-.3.9H3a.5.5 0 0 1-.3-.9l1.838-1.379c.16-.12.343-.207.537-.255L6.5 13.11v-2.173c-.955-.234-2.043-1.146-2.833-3.012a3 3 0 1 1-1.132-5.89A33 33 0 0 1 2.5.5M4.5 5.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4m7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4M8 1a2.5 2.5 0 0 0-2.5 2.5V7a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V3.5A2.5 2.5 0 0 0 8 1"/>
        </svg>''',
        'bi-link': '''<svg viewBox="0 0 16 16" style="width: 100%; height: 100%; color: {color}; fill: currentColor;">
            <path d="M6.354 5.5H4a3 3 0 0 0 0 6h3a3 3 0 0 0 2.83-4H9c-.086 0-.17.01-.25.031A2 2 0 0 1 7 9.5a2 2 0 0 1-1.25-3.5.5.5 0 1 0-.396-.5zM5 8a.5.5 0 0 0 .5.5H8a.5.5 0 0 0 0-1H5.5A.5.5 0 0 0 5 8zm7.646-2.5a.5.5 0 0 1 .708.708L12 7.5a.5.5 0 0 1-.708 0L10 6.207a.5.5 0 0 1 .708-.708L11.646 5.5z"/>
        </svg>'''
    }
    
    # Remove 'bi-' prefix if present
    icon_key = icon_class if icon_class.startswith('bi-') else f'bi-{icon_class}'
    
    if icon_key in icon_svgs:
        return icon_svgs[icon_key].format(color=color)
    return None

def create_tables():
    """Create database tables if they don't exist"""
    with app.app_context():
        db.create_all()

if __name__ == "__main__":
    create_tables()
    app.run(debug=True)
