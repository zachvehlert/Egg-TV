# Keke TV Browser Extension

This browser extension brings your Keke TV toolbar to any website, allowing you to access your favorite links from anywhere on the web.

## Features

- 🎯 **Universal Access**: Your Keke TV links available on any website
- 🖱️ **Hover to Show**: Toolbar appears when you hover near the left edge of any webpage
- 🎨 **Same Design**: Identical look and feel to your main Keke TV application
- ⚡ **Fast & Cached**: Links are cached locally for quick access
- 🔧 **Configurable**: Easy setup through extension popup

## Installation

### Prerequisites

1. Make sure your Keke TV Flask application is running:
   ```bash
   cd /path/to/tv-box
   uv run main.py
   ```
   Your server should be running at `http://localhost:5000`

### Install the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right corner)
3. Click "Load unpacked"
4. Select the `extension` folder from your Keke TV project
5. The Keke TV Toolbar extension should now appear in your extensions list

## Setup

1. Click the Keke TV extension icon in your browser toolbar
2. Configure your server URL (default: `http://localhost:5000`)
3. Ensure the toggle is enabled
4. Click "Save Settings"
5. You should see "Connected to Keke TV" status

## Usage

### Accessing the Toolbar

1. Visit any website
2. Move your mouse to the far left edge of the browser window
3. The Keke TV toolbar will slide out from the left
4. Click any link to open it in a new tab
5. Click the "Keke TV" button to return to your main application

### Managing Settings

- Click the extension icon to open the popup
- Toggle the toolbar on/off
- Change the server URL if needed
- Check connection status

## Troubleshooting

### Toolbar Not Appearing

1. Check that the extension is enabled in `chrome://extensions/`
2. Verify your Keke TV server is running at the configured URL
3. Check the extension popup for connection status
4. Try refreshing the webpage

### Connection Issues

1. Ensure your Keke TV Flask app is running
2. Verify the server URL in extension settings
3. Check that CORS is properly configured (should be automatic)
4. Test the API endpoint: `http://localhost:5000/api/extension/health`

### Links Not Loading

1. Check the extension popup for error messages
2. Verify your Keke TV database has links configured
3. Try clearing the extension's cache by disabling/re-enabling it

## Development

### File Structure
```
extension/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup interface
├── css/
│   └── toolbar.css       # Injected toolbar styles
├── js/
│   ├── content.js        # Main content script (injected into pages)
│   ├── background.js     # Extension background worker
│   └── popup.js          # Popup interface logic
└── icons/               # Extension icons
    ├── icon-16.png
    ├── icon-32.png
    ├── icon-48.png
    └── icon-128.png
```

### API Endpoints Used

- `GET /api/extension/health` - Connection health check
- `GET /api/extension/links` - Fetch all links for toolbar

### Storage

The extension uses Chrome's local storage to save:
- Server URL configuration
- Enable/disable state
- Cached links (5-minute cache duration)

## Security

- Extension only requests minimal permissions
- Cross-origin requests limited to your configured server
- No sensitive data is stored locally
- All links open in new tabs for security

## Browser Compatibility

Currently supports:
- ✅ Chrome (Manifest V3)
- 🔄 Firefox support coming soon

## License

Same license as the main Keke TV project.