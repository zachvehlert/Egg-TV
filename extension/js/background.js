// TV Box Extension Background Script
// Handles extension lifecycle and storage management

// Default configuration
const DEFAULT_CONFIG = {
    enabled: true,
    serverUrl: 'http://localhost:5000'
};

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
        // Set default configuration
        await chrome.storage.local.set({
            tvboxConfig: DEFAULT_CONFIG
        });
        
        // Show welcome notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon-48.png',
            title: 'TV Box Toolbar Installed',
            message: 'Hover near the left edge of any webpage to access your links!'
        });
    }
});

// Handle toolbar toggle from context menu or keyboard shortcut
chrome.action.onClicked.addListener(async (tab) => {
    try {
        const result = await chrome.storage.local.get(['tvboxConfig']);
        const config = result.tvboxConfig || DEFAULT_CONFIG;
        
        // Toggle enabled state
        config.enabled = !config.enabled;
        
        await chrome.storage.local.set({ tvboxConfig: config });
        
        // Show notification about state change
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon-48.png',
            title: 'TV Box Toolbar',
            message: config.enabled ? 'Toolbar enabled' : 'Toolbar disabled'
        });
        
        // Reload the current tab to apply changes
        chrome.tabs.reload(tab.id);
        
    } catch (error) {
        console.error('TV Box: Failed to toggle toolbar:', error);
    }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
        case 'getConfig':
            chrome.storage.local.get(['tvboxConfig']).then(result => {
                sendResponse(result.tvboxConfig || DEFAULT_CONFIG);
            });
            return true; // Indicates we'll respond asynchronously
            
        case 'setConfig':
            chrome.storage.local.set({ tvboxConfig: message.config }).then(() => {
                sendResponse({ success: true });
            }).catch(error => {
                sendResponse({ success: false, error: error.message });
            });
            return true;
            
        case 'testConnection':
            testServerConnection(message.serverUrl).then(result => {
                sendResponse(result);
            });
            return true;
            
        case 'fetchLinks':
            fetchLinksFromServer(message.serverUrl).then(result => {
                sendResponse(result);
            });
            return true;
            
        default:
            sendResponse({ error: 'Unknown message type' });
    }
});

// Test server connection
async function testServerConnection(serverUrl) {
    try {
        const response = await fetch(`${serverUrl}/api/extension/health`, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Accept': 'application/json',
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            return {
                success: true,
                status: data.status || 'healthy',
                version: data.version || '1.0'
            };
        } else {
            return {
                success: false,
                error: `Server returned ${response.status}: ${response.statusText}`
            };
        }
    } catch (error) {
        return {
            success: false,
            error: `Connection failed: ${error.message}`
        };
    }
}

// Fetch links from server
async function fetchLinksFromServer(serverUrl) {
    try {
        const response = await fetch(`${serverUrl}/api/extension/links`, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Accept': 'application/json',
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                return {
                    success: true,
                    links: data.links
                };
            } else {
                return {
                    success: false,
                    error: data.error || 'Unknown server error'
                };
            }
        } else {
            return {
                success: false,
                error: `Server returned ${response.status}: ${response.statusText}`
            };
        }
    } catch (error) {
        return {
            success: false,
            error: `Failed to fetch links: ${error.message}`
        };
    }
}

// Handle extension icon badge
async function updateBadge() {
    try {
        const result = await chrome.storage.local.get(['tvboxConfig']);
        const config = result.tvboxConfig || DEFAULT_CONFIG;
        
        if (config.enabled) {
            chrome.action.setBadgeText({ text: '' });
            chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });
        } else {
            chrome.action.setBadgeText({ text: 'OFF' });
            chrome.action.setBadgeBackgroundColor({ color: '#64748b' });
        }
    } catch (error) {
        console.error('TV Box: Failed to update badge:', error);
    }
}

// Update badge when configuration changes
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.tvboxConfig) {
        updateBadge();
    }
});

// Initialize badge on startup
updateBadge();