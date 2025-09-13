# Keke TV

A highly configurable smart TV web application with browser extension support, designed to run on a Raspberry Pi 5 with fullpage OS.

## Overview

Keke TV is a streaming-focused web application that provides a customizable dashboard of links to various streaming services and websites. Think of it as a simplified, web-based alternative to Apple TV or other streaming devices. It now includes a browser extension for easy access to your links from any web browser.

## Features

- **Link Management**: Add, delete, and edit webpage links with custom icons and colors
- **Browser Extension**: Chrome/Firefox extension for quick access to your Keke TV links
- **Custom Icons**: Support for Bootstrap icons with custom colors, plus automatic favicon retrieval
- **API Endpoints**: REST API for programmatic access and browser extension integration
- **CORS Support**: Cross-origin support for browser extensions and external applications
- **SQLite Database**: Persistent storage for all your links and settings
- **Responsive Design**: Works on TV screens, desktop browsers, and mobile devices

## Getting Started

### Prerequisites

- Python 3.13+
- UV package manager (recommended) or pip

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd tv-box
   ```

2. **Install dependencies:**
   ```bash
   # Using UV (recommended)
   uv install
   
   # Or using pip
   pip install -r requirements.txt
   ```

3. **Run the application:**
   ```bash
   # Using UV
   uv run main.py
   
   # Or using python directly
   python main.py
   ```

4. **Access the application:**
   Open your browser and navigate to `http://localhost:5000`

### Browser Extension Setup

The Keke TV browser extension allows you to access your links directly from your browser toolbar.

#### Installation

1. **Chrome/Chromium:**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `extension/` directory from your Keke TV installation
   - The Keke TV extension should now appear in your toolbar

2. **Firefox:**
   - Open Firefox and navigate to `about:debugging`
   - Click "This Firefox"
   - Click "Load Temporary Add-on"
   - Select the `manifest.json` file from the `extension/` directory

#### Configuration

1. **Start your Keke TV server** (it must be running for the extension to work)
2. **Click the Keke TV extension icon** in your browser toolbar
3. **Configure server URL** if different from `http://localhost:5000`
4. **Access your links** directly from the extension popup

## API Endpoints

Keke TV provides several API endpoints for integration:

- `GET /api/links` - Get all links
- `POST /api/links` - Create a new link
- `PUT /api/links/<id>` - Update a link
- `DELETE /api/links/<id>` - Delete a link
- `GET /api/extension/links` - Get links formatted for browser extension
- `GET /api/extension/health` - Health check for browser extension

## Development

### Dependencies

- **Flask** - Web framework
- **Flask-CORS** - Cross-origin support for browser extension
- **Flask-SQLAlchemy** - Database ORM
- **Pillow** - Image processing

### File Structure

```
tv-box/
├── main.py              # Main Flask application
├── models.py            # Database models
├── templates/           # HTML templates
├── static/             # CSS, JavaScript, images
├── extension/          # Browser extension files
│   ├── manifest.json   # Extension manifest
│   ├── popup.html      # Extension popup interface
│   └── js/            # Extension JavaScript files
├── instance/          # SQLite database location
└── README.md          # This file
```

## Target Platform

- **Primary**: Raspberry Pi 5 with Fullpage OS
- **Secondary**: Any system running Python 3.13+ (development/testing)
- **Browser Extension**: Chrome, Firefox, and other Chromium-based browsers

## Usage

### TV Interface
The application is intended to be used as a full-screen interface on a TV, providing easy access to various streaming platforms and web services through a clean, user-friendly interface.

### Desktop/Mobile
Access your links through the web interface on any device with a modern web browser.

### Browser Extension
Quick access to your Keke TV links from any website through the browser extension popup.