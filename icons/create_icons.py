from PIL import Image, ImageDraw, ImageFont

def create_icon(size, filename):
    # Create a simple icon with gradient background
    img = Image.new('RGB', (size, size), color=(41, 128, 185))
    draw = ImageDraw.Draw(img)
    
    # Draw a simple "N" for News Neutralizer
    # Draw white rectangle for the N shape
    margin = size // 6
    thickness = size // 8
    
    # Left vertical bar
    draw.rectangle([margin, margin, margin + thickness, size - margin], fill='white')
    
    # Diagonal bar
    draw.polygon([
        (margin + thickness, margin),
        (size - margin - thickness, size - margin),
        (size - margin, size - margin),
        (margin + thickness * 2, margin)
    ], fill='white')
    
    # Right vertical bar
    draw.rectangle([size - margin - thickness, margin, size - margin, size - margin], fill='white')
    
    img.save(filename, 'PNG')
    print(f'Created {filename}')

# Create icons in three sizes
create_icon(16, 'icon16.png')
create_icon(48, 'icon48.png')
create_icon(128, 'icon128.png')
