#!/usr/bin/env python3
"""
Simple script to create basic extension icons
Creates PNG icons in different sizes with a simple design
"""

from PIL import Image, ImageDraw
import os

def create_icon(size, output_path):
    # Create a square image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Colors (Egg TV brand colors)
    primary_color = (99, 102, 241)  # #6366f1
    secondary_color = (139, 92, 246)  # #8b5cf6
    
    # Draw a rounded rectangle background
    margin = size // 8
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=size // 6,
        fill=primary_color,
        outline=secondary_color,
        width=2
    )
    
    # Draw "TV" text or simple box design
    if size >= 32:
        # For larger icons, draw some simple geometric shapes to represent a "box"
        inner_margin = size // 3
        box_size = size - (2 * inner_margin)
        
        # Draw inner squares to represent "links/boxes"
        square_size = box_size // 3
        for i in range(2):
            for j in range(2):
                x = inner_margin + (j * square_size) + (j * square_size // 4)
                y = inner_margin + (i * square_size) + (i * square_size // 4)
                draw.rectangle(
                    [x, y, x + square_size - 4, y + square_size - 4],
                    fill=(255, 255, 255, 200)
                )
    
    img.save(output_path, 'PNG')
    print(f"Created icon: {output_path}")

def main():
    # Ensure we're in the right directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    # Create icons in standard sizes
    sizes = [16, 32, 48, 128]
    
    for size in sizes:
        create_icon(size, f'icon-{size}.png')
    
    print("All icons created successfully!")
    print("You can now load the extension in Chrome by:")
    print("1. Opening chrome://extensions/")
    print("2. Enabling Developer mode")
    print("3. Clicking 'Load unpacked' and selecting the extension folder")

if __name__ == '__main__':
    main()