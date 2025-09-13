#!/usr/bin/env python3
"""
Database initialization script for Egg TV
Creates tables and adds sample data
"""

from main import app
from models import db, Link

def init_database():
    """Initialize database with tables and sample data"""
    with app.app_context():
        # Create all tables
        db.create_all()
        print("✅ Database tables created")
        
        # Check if we already have data
        if Link.query.count() > 0:
            print("📋 Database already has data, skipping sample data creation")
            return
        
        # Add sample links (YouTube and Netflix from original HTML)
        sample_links = [
            Link(
                name="YouTube",
                url="https://www.youtube.com"
            ),
            Link(
                name="Netflix", 
                url="https://www.netflix.com"
            )
        ]
        
        for link in sample_links:
            db.session.add(link)
        
        db.session.commit()
        print(f"✅ Added {len(sample_links)} sample links")
        
        # Display created links
        print("\n📝 Current links in database:")
        all_links = Link.query.all()
        for link in all_links:
            print(f"  - {link.name}: {link.url}")

if __name__ == "__main__":
    init_database()