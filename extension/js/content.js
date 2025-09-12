// TV Box Extension Content Script
// This script runs on every webpage and injects the toolbar

(function() {
    'use strict';
    
    // Prevent multiple injections
    if (window.tvboxToolbarInjected) {
        return;
    }
    window.tvboxToolbarInjected = true;
    
    let isToolbarVisible = false;
    let toolbarTimeout;
    let linksCache = null;
    let lastFetchTime = 0;
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    
    // Default configuration
    const DEFAULT_CONFIG = {
        enabled: true,
        serverUrl: 'http://localhost:5000'
    };
    
    let config = DEFAULT_CONFIG;
    
    // Load configuration from storage
    async function loadConfig() {
        try {
            const result = await chrome.storage.local.get(['tvboxConfig']);
            if (result.tvboxConfig) {
                config = { ...DEFAULT_CONFIG, ...result.tvboxConfig };
            }
        } catch (error) {
            console.warn('TV Box: Could not load config, using defaults');
        }
    }
    
    // Create toolbar HTML structure
    function createToolbarHTML() {
        return `
            <div id="tvbox-toolbar">
                <div id="tvbox-toolbar-content">
                    <button id="tvbox-toolbar-home-btn" title="Go to TV Box">
                        <svg class="tvbox-icon-home" viewBox="0 0 20 20">
                            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                        </svg>
                        TV Box
                    </button>
                    <div id="tvbox-toolbar-divider"></div>
                    <div id="tvbox-toolbar-links">
                        <div id="tvbox-loading-indicator">Loading links...</div>
                    </div>
                </div>
            </div>
            <div id="tvbox-mouse-trigger-zone"></div>
        `;
    }
    
    // Fetch links from server via background script
    async function fetchLinks() {
        const now = Date.now();
        
        // Use cached data if still fresh
        if (linksCache && (now - lastFetchTime) < CACHE_DURATION) {
            return linksCache;
        }
        
        try {
            // Use background script for more reliable cross-origin requests
            const response = await chrome.runtime.sendMessage({
                type: 'fetchLinks',
                serverUrl: config.serverUrl
            });
            
            if (response.success) {
                linksCache = response.links;
                lastFetchTime = now;
                return response.links;
            } else {
                throw new Error(response.error || 'Unknown server error');
            }
        } catch (error) {
            console.error('TV Box: Failed to fetch links:', error);
            throw error;
        }
    }
    
    // Handle icon error with fallback chain
    function handleIconError(img, domain, name, step = 1) {
        const baseStyle = "width: 100%; height: 100%; object-fit: contain; border-radius: 4px;";
        
        if (step === 1) {
            // Try apple-touch-icon
            img.src = `https://${domain}/apple-touch-icon.png`;
            img.style.cssText = baseStyle;
            img.onerror = () => handleIconError(img, domain, name, 2);
        } else {
            // Final fallback to star SVG icon
            img.outerHTML = `<svg viewBox="0 0 16 16" style="width: 100%; height: 100%; color: var(--tvbox-accent-primary); fill: currentColor;">
                <path d="m8 0 1.669.864 1.858.282.842 1.68 1.337 1.32L13.4 6l.306 1.854-1.337 1.32-.842 1.68-1.858.282L8 12l-1.669-.864-1.858-.282-.842-1.68-1.337-1.32L2.6 6l-.306-1.854 1.337-1.32.842-1.68L6.331.864 8 0z"/>
                <path d="M4 11.794V16l4-1 4 1v-4.206l-2.018.306L8 13.126 6.018 12.1 4 11.794z"/>
            </svg>`;
        }
    }
    
    // Create icon HTML for a link - now using server-provided HTML
    function createIconHTML(link) {
        // Server now provides ready-to-use icon HTML
        return link.icon_html || `<svg viewBox="0 0 20 20" style="width: 100%; height: 100%; color: var(--tvbox-accent-primary);">
            <path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd"/>
        </svg>`;
    }
    
    // Populate toolbar with links
    function populateToolbar(links) {
        const linksContainer = document.getElementById('tvbox-toolbar-links');
        
        if (!links || links.length === 0) {
            linksContainer.innerHTML = '<div id="tvbox-loading-indicator">No links found</div>';
            return;
        }
        
        const linksHTML = links.map(link => {
            const iconHTML = createIconHTML(link);
            return `
                <a href="${link.url}" target="_blank" class="tvbox-toolbar-link" title="${link.name}">
                    <div class="tvbox-toolbar-link-icon">
                        ${iconHTML}
                    </div>
                    <div class="tvbox-toolbar-link-title">${link.name}</div>
                </a>
            `;
        }).join('');
        
        linksContainer.innerHTML = linksHTML;
    }
    
    // Show toolbar with animation
    function showToolbar() {
        clearTimeout(toolbarTimeout);
        const toolbar = document.getElementById('tvbox-toolbar');
        if (toolbar) {
            toolbar.classList.add('show');
            isToolbarVisible = true;
        }
    }
    
    // Hide toolbar with animation
    function hideToolbar() {
        toolbarTimeout = setTimeout(() => {
            const toolbar = document.getElementById('tvbox-toolbar');
            if (toolbar) {
                toolbar.classList.remove('show');
                isToolbarVisible = false;
            }
        }, 300); // Small delay to prevent flickering
    }
    
    // Initialize toolbar event handlers
    function initializeToolbarEvents() {
        const toolbar = document.getElementById('tvbox-toolbar');
        const triggerZone = document.getElementById('tvbox-mouse-trigger-zone');
        const homeBtn = document.getElementById('tvbox-toolbar-home-btn');
        
        if (triggerZone) {
            triggerZone.addEventListener('mouseenter', showToolbar);
        }
        
        if (toolbar) {
            toolbar.addEventListener('mouseleave', hideToolbar);
            toolbar.addEventListener('mouseenter', () => {
                clearTimeout(toolbarTimeout);
                showToolbar();
            });
        }
        
        if (homeBtn) {
            homeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.open(config.serverUrl, '_blank');
                hideToolbar();
            });
        }
    }
    
    // Load and display links
    async function loadLinks() {
        try {
            const links = await fetchLinks();
            populateToolbar(links);
        } catch (error) {
            const linksContainer = document.getElementById('tvbox-toolbar-links');
            if (linksContainer) {
                linksContainer.innerHTML = `
                    <div id="tvbox-error-message">
                        Failed to load links:<br>
                        <small>${error.message}</small><br>
                        <small>Check server at ${config.serverUrl}</small>
                    </div>
                `;
            }
        }
    }
    
    // Initialize the toolbar
    async function initializeToolbar() {
        await loadConfig();
        
        if (!config.enabled) {
            return;
        }
        
        // Make handleIconError globally accessible immediately
        window.handleIconError = handleIconError;
        
        // Create and inject toolbar HTML
        const toolbarContainer = document.createElement('div');
        toolbarContainer.innerHTML = createToolbarHTML();
        document.body.appendChild(toolbarContainer);
        
        // Initialize events
        initializeToolbarEvents();
        
        // Load links
        await loadLinks();
    }
    
    // Listen for configuration changes
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.onChanged.addListener(async (changes, namespace) => {
            if (namespace === 'local' && changes.tvboxConfig) {
                await loadConfig();
                
                // Reload toolbar if configuration changed
                const existingToolbar = document.getElementById('tvbox-toolbar');
                if (existingToolbar) {
                    existingToolbar.parentElement.remove();
                }
                
                // Clear cache to force refresh
                linksCache = null;
                lastFetchTime = 0;
                
                await initializeToolbar();
            }
        });
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeToolbar);
    } else {
        initializeToolbar();
    }
    
})();