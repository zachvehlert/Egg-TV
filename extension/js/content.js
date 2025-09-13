// Egg TV Extension Content Script
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
            console.warn('Egg TV: Could not load config, using defaults');
        }
    }
    
    // Create toolbar HTML structure
    function createToolbarHTML() {
        return `
            <div id="tvbox-toolbar">
                <div id="tvbox-toolbar-content">
                    <button id="tvbox-toolbar-home-btn" title="Go to Egg TV">
                        <svg class="tvbox-icon-home" viewBox="0 0 20 20">
                            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                        </svg>
                        Egg TV
                    </button>
                    <button id="tvbox-toolbar-find-btn" class="tvbox-find-website-btn" title="Search The Web">
                        <svg viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
                        </svg>
                        Search The Web
                    </button>
                    <button id="tvbox-toolbar-add-btn" class="tvbox-add-website-btn">Add This Website</button>
                    <div id="tvbox-toolbar-nav-buttons">
                        <button id="tvbox-toolbar-back-btn" title="Go Back">
                            <svg viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
                            </svg>
                        </button>
                        <button id="tvbox-toolbar-forward-btn" title="Go Forward">
                            <svg viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                            </svg>
                        </button>
                        <button id="tvbox-toolbar-reload-btn" title="Reload Page & Extension">
                            <svg viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
                            </svg>
                        </button>
                    </div>
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
            console.error('Egg TV: Failed to fetch links:', error);
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
                <a href="#" class="tvbox-toolbar-link" title="${link.name}" data-url="${link.url}">
                    <div class="tvbox-toolbar-link-icon">
                        ${iconHTML}
                    </div>
                    <div class="tvbox-toolbar-link-title">${link.name}</div>
                </a>
            `;
        }).join('');
        
        linksContainer.innerHTML = linksHTML;
        
        // Add click handlers for toolbar links to use single tab management
        const toolbarLinks = linksContainer.querySelectorAll('.tvbox-toolbar-link');
        toolbarLinks.forEach(link => {
            link.addEventListener('click', async (e) => {
                e.preventDefault();
                const url = link.getAttribute('data-url');
                if (url) {
                    try {
                        const response = await chrome.runtime.sendMessage({
                            type: 'openUrl',
                            url: url
                        });
                        
                        if (response.success) {
                            hideToolbar();
                        } else {
                            console.error('Egg TV: Failed to open URL:', response.error);
                            // Fallback to normal navigation
                            window.location.href = url;
                        }
                    } catch (error) {
                        console.error('Egg TV: Error opening URL:', error);
                        // Fallback to normal navigation
                        window.location.href = url;
                    }
                }
            });
        });
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
    
    // Add current website to the database
    async function addCurrentWebsite() {
        const currentUrl = window.location.href;
        const pageTitle = document.title || window.location.hostname;
        
        // Show loading state
        const addBtn = document.getElementById('tvbox-toolbar-add-btn');
        if (addBtn) {
            addBtn.disabled = true;
            addBtn.textContent = 'Adding...';
        }
        
        try {
            // Check if URL already exists by comparing with current links
            const existingLinks = await fetchLinks();
            const urlExists = existingLinks.some(link => link.url === currentUrl);
            
            if (urlExists) {
                showNotification('Website already exists in your list!', 'info');
                return;
            }
            
            // Add the website via background script
            const response = await chrome.runtime.sendMessage({
                type: 'addWebsite',
                serverUrl: config.serverUrl,
                websiteData: {
                    name: pageTitle,
                    url: currentUrl
                }
            });
            
            if (response.success) {
                showNotification('Website added successfully!', 'success');
                // Clear cache to force refresh of links
                linksCache = null;
                lastFetchTime = 0;
                // Reload links to show the new addition
                await loadLinks();
            } else {
                showNotification(`Failed to add website: ${response.error}`, 'error');
            }
        } catch (error) {
            console.error('Egg TV: Failed to add website:', error);
            showNotification(`Error: ${error.message}`, 'error');
        } finally {
            // Restore button state
            if (addBtn) {
                addBtn.disabled = false;
                addBtn.textContent = 'Add This Website';
            }
        }
    }
    
    // Show notification to user
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.id = 'tvbox-notification';
        notification.className = `tvbox-notification tvbox-notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Reload both the current page and the extension
    async function reloadPageAndExtension() {
        try {
            // Clear the extension cache first
            linksCache = null;
            lastFetchTime = 0;

            // Send message to background script to reload the extension
            await chrome.runtime.sendMessage({
                type: 'reloadExtension'
            });

            // Reload the current page
            window.location.reload();
        } catch (error) {
            console.error('Egg TV: Error during reload:', error);
            // Fallback to just reloading the page if extension reload fails
            window.location.reload();
        }
    }

    // Initialize toolbar event handlers
    function initializeToolbarEvents() {
        const toolbar = document.getElementById('tvbox-toolbar');
        const triggerZone = document.getElementById('tvbox-mouse-trigger-zone');
        const homeBtn = document.getElementById('tvbox-toolbar-home-btn');
        const findBtn = document.getElementById('tvbox-toolbar-find-btn');
        const backBtn = document.getElementById('tvbox-toolbar-back-btn');
        const forwardBtn = document.getElementById('tvbox-toolbar-forward-btn');
        const reloadBtn = document.getElementById('tvbox-toolbar-reload-btn');
        const addBtn = document.getElementById('tvbox-toolbar-add-btn');
        
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
            homeBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    const response = await chrome.runtime.sendMessage({
                        type: 'openUrl',
                        url: config.serverUrl
                    });
                    
                    if (response.success) {
                        hideToolbar();
                    } else {
                        console.error('Egg TV: Failed to open home URL:', response.error);
                        // Fallback to normal navigation
                        window.location.href = config.serverUrl;
                    }
                } catch (error) {
                    console.error('Egg TV: Error opening home URL:', error);
                    // Fallback to normal navigation
                    window.location.href = config.serverUrl;
                }
                hideToolbar();
            });
        }
        
        if (findBtn) {
            findBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    // Get custom search URL from server
                    const searchUrlResponse = await chrome.runtime.sendMessage({
                        type: 'getSearchUrl',
                        serverUrl: config.serverUrl
                    });

                    let searchUrl = 'https://www.google.com';
                    if (searchUrlResponse.success && searchUrlResponse.search_url) {
                        searchUrl = searchUrlResponse.search_url;
                    }

                    const response = await chrome.runtime.sendMessage({
                        type: 'openUrl',
                        url: searchUrl
                    });

                    if (response.success) {
                        hideToolbar();
                    } else {
                        console.error('Egg TV: Failed to open search URL:', response.error);
                        // Fallback to normal navigation
                        window.location.href = searchUrl;
                    }
                } catch (error) {
                    console.error('Egg TV: Error opening search URL:', error);
                    // Fallback to normal navigation
                    window.location.href = 'https://www.google.com';
                }
                hideToolbar();
            });
        }
        
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.history.back();
                hideToolbar();
            });
        }
        
        if (forwardBtn) {
            forwardBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.history.forward();
                hideToolbar();
            });
        }

        if (reloadBtn) {
            reloadBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                // Hide toolbar first
                hideToolbar();
                // Reload the page and extension
                await reloadPageAndExtension();
            });
        }

        if (addBtn) {
            addBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await addCurrentWebsite();
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

    // Load and apply theme (accent color and background)
    async function loadAndApplyTheme() {
        try {
            // Load accent color
            const accentResponse = await chrome.runtime.sendMessage({
                type: 'getAccentColor',
                serverUrl: config.serverUrl
            });

            if (accentResponse.success && accentResponse.accent_color) {
                applyAccentColorToToolbar(accentResponse.accent_color);
            } else {
                console.log('Egg TV: Using default accent color');
                applyAccentColorToToolbar('#f8a5c2');
            }

            // Load background theme
            const bgResponse = await chrome.runtime.sendMessage({
                type: 'getBackgroundTheme',
                serverUrl: config.serverUrl
            });

            if (bgResponse.success && bgResponse.background_theme) {
                try {
                    const theme = JSON.parse(bgResponse.background_theme);
                    applyBackgroundThemeToToolbar(theme);
                } catch (e) {
                    console.log('Egg TV: Invalid background theme JSON, using default');
                    applyBackgroundThemeToToolbar({ primary: '#111827', secondary: '#1f2937', card: '#374151' });
                }
            } else {
                console.log('Egg TV: Using default background theme');
                applyBackgroundThemeToToolbar({ primary: '#111827', secondary: '#1f2937', card: '#374151' });
            }
        } catch (error) {
            console.log('Egg TV: Failed to load theme, using defaults');
            applyAccentColorToToolbar('#f8a5c2');
            applyBackgroundThemeToToolbar({ primary: '#111827', secondary: '#1f2937', card: '#374151' });
        }
    }

    // Apply accent color to toolbar CSS variables
    function applyAccentColorToToolbar(color) {
        const toolbar = document.getElementById('tvbox-toolbar');
        if (toolbar) {
            // Calculate secondary color (lighter version)
            const secondaryColor = adjustColorBrightness(color, 20);

            // Apply the colors to the toolbar CSS variables
            toolbar.style.setProperty('--tvbox-accent-primary', color);
            toolbar.style.setProperty('--tvbox-accent-secondary', secondaryColor);

            // Update the glow shadow with new color
            const shadowGlow = `0 0 20px ${color}40`; // 40 = 25% opacity in hex
            toolbar.style.setProperty('--tvbox-shadow-glow', shadowGlow);
        }
    }

    // Apply background theme to toolbar CSS variables
    function applyBackgroundThemeToToolbar(theme) {
        const toolbar = document.getElementById('tvbox-toolbar');
        if (toolbar) {
            // Apply the background colors to the toolbar CSS variables
            toolbar.style.setProperty('--tvbox-bg-primary', theme.primary);
            toolbar.style.setProperty('--tvbox-bg-secondary', theme.secondary);
            toolbar.style.setProperty('--tvbox-bg-card', theme.card);

            // Calculate hover color (slightly lighter)
            const hoverColor = adjustColorBrightness(theme.card, 15);
            toolbar.style.setProperty('--tvbox-bg-card-hover', hoverColor);

            // Calculate border color (slightly lighter than card)
            const borderColor = adjustColorBrightness(theme.card, 10);
            toolbar.style.setProperty('--tvbox-border-color', borderColor);
        }
    }

    // Helper function to adjust color brightness
    function adjustColorBrightness(color, amount) {
        // Convert hex to RGB
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        // Adjust brightness
        const newR = Math.min(255, Math.max(0, r + amount));
        const newG = Math.min(255, Math.max(0, g + amount));
        const newB = Math.min(255, Math.max(0, b + amount));

        // Convert back to hex
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
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

        // Load and apply theme (accent color and background)
        await loadAndApplyTheme();

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