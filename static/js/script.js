// Dynamic Bootstrap Icons array - will be populated from CSS
let allBootstrapIcons = [];

// API Helper Functions
async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Request failed:', error);
        alert(`Error: ${error.message}`);
        throw error;
    }
}

// Function to dynamically extract Bootstrap icon classes from CSS
async function loadBootstrapIcons() {
    try {
        // Find the Bootstrap Icons CSS link
        const bootstrapIconsLink = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
            .find(link => link.href.includes('bootstrap-icons'));
        
        if (!bootstrapIconsLink) {
            console.warn('Bootstrap Icons CSS not found, using fallback icons');
            return getFallbackIcons();
        }

        // Fetch the CSS content
        const response = await fetch(bootstrapIconsLink.href);
        const cssText = await response.text();
        
        // Extract icon class names using regex
        // Bootstrap icons follow the pattern .bi-icon-name::before
        const iconMatches = cssText.match(/\.bi-[a-z0-9-]+(?=::before)/g);
        
        if (iconMatches) {
            // Remove duplicates and sort
            const uniqueIcons = [...new Set(iconMatches)]
                .map(match => match.substring(1)) // Remove the leading dot
                .sort();
            
            console.log(`Loaded ${uniqueIcons.length} Bootstrap icons dynamically`);
            return uniqueIcons;
        } else {
            console.warn('Could not parse Bootstrap Icons from CSS, using fallback');
            return getFallbackIcons();
        }
    } catch (error) {
        console.error('Error loading Bootstrap Icons:', error);
        return getFallbackIcons();
    }
}

// Fallback icons for when dynamic loading fails
function getFallbackIcons() {
    return [
        'bi-alarm', 'bi-app', 'bi-archive', 'bi-arrow-down', 'bi-arrow-left', 'bi-arrow-right', 'bi-arrow-up',
        'bi-bag', 'bi-bell', 'bi-book', 'bi-bookmark', 'bi-calendar', 'bi-camera', 'bi-cart', 'bi-chat',
        'bi-check', 'bi-circle', 'bi-clipboard', 'bi-clock', 'bi-cloud', 'bi-code', 'bi-compass',
        'bi-cpu', 'bi-credit-card', 'bi-cursor', 'bi-dash', 'bi-disc', 'bi-download', 'bi-envelope',
        'bi-eye', 'bi-file', 'bi-film', 'bi-flag', 'bi-folder', 'bi-gear', 'bi-gift', 'bi-globe',
        'bi-graph-up', 'bi-grid', 'bi-hammer', 'bi-heart', 'bi-house', 'bi-image', 'bi-info',
        'bi-key', 'bi-laptop', 'bi-link', 'bi-list', 'bi-lock', 'bi-map', 'bi-mic', 'bi-moon',
        'bi-music-note', 'bi-pause', 'bi-pencil', 'bi-person', 'bi-phone', 'bi-play', 'bi-plus',
        'bi-printer', 'bi-search', 'bi-share', 'bi-shield', 'bi-star', 'bi-stop', 'bi-sun',
        'bi-table', 'bi-tag', 'bi-trash', 'bi-tv', 'bi-upload', 'bi-volume-up', 'bi-wifi', 'bi-x'
    ];
}

let selectedCustomIcon = {
    add: null,
    edit: null
};

let selectedIconColor = {
    add: '#6366f1',
    edit: '#6366f1'
};

// Modal functionality
function openAddModal() {
    document.getElementById('addLinkModal').classList.add('show');
    document.getElementById('addIconSearch').value = '';
    document.getElementById('addIconColor').value = '#6366f1';
    selectedIconColor.add = '#6366f1';
    updateIconPreviewColor('add', '#6366f1');
    initializeIconGrid('add');
}

function closeAddModal() {
    document.getElementById('addLinkModal').classList.remove('show');
}

function openEditModal() {
    document.getElementById('editLinkModal').classList.add('show');
    document.getElementById('editIconSearch').value = '';
    document.getElementById('editIconColor').value = '#6366f1';
    selectedIconColor.edit = '#6366f1';
    updateIconPreviewColor('edit', '#6366f1');
    initializeIconGrid('edit');
}

function closeEditModal() {
    document.getElementById('editLinkModal').classList.remove('show');
}

// Icon selector functionality
function toggleCustomIcon(modalType) {
    const toggle = document.getElementById(`${modalType}CustomIconToggle`);
    const selector = document.getElementById(`${modalType}IconSelector`);
    
    toggle.classList.toggle('active');
    selector.classList.toggle('show');
    
    if (!toggle.classList.contains('active')) {
        selectedCustomIcon[modalType] = null;
    } else {
        // Clear search and reinitialize grid when opening
        document.getElementById(`${modalType}IconSearch`).value = '';
        initializeIconGrid(modalType);
    }
}

function initializeIconGrid(modalType, searchTerm = '') {
    const grid = document.getElementById(`${modalType}IconGrid`);
    grid.innerHTML = '';
    
    // Filter icons based on search term
    const filteredIcons = searchTerm 
        ? allBootstrapIcons.filter(iconClass => 
            iconClass.toLowerCase().includes(searchTerm.toLowerCase()))
        : allBootstrapIcons;
    
    // Limit to first 200 icons for performance
    const iconsToShow = filteredIcons.slice(0, 200);
    
    iconsToShow.forEach(iconClass => {
        const iconOption = document.createElement('div');
        iconOption.className = 'icon-option';
        iconOption.innerHTML = `<i class="bi ${iconClass}"></i>`;
        iconOption.onclick = () => selectIcon(modalType, iconClass, iconOption);
        grid.appendChild(iconOption);
    });
    
    // Show count of filtered results
    if (searchTerm && filteredIcons.length > 0) {
        const countInfo = document.createElement('div');
        countInfo.className = 'icon-count-info';
        countInfo.textContent = `Showing ${iconsToShow.length} of ${filteredIcons.length} icons`;
        grid.insertBefore(countInfo, grid.firstChild);
    }
}

function selectIcon(modalType, iconClass, element) {
    // Remove previous selection
    const grid = document.getElementById(`${modalType}IconGrid`);
    grid.querySelectorAll('.icon-option').forEach(opt => opt.classList.remove('selected'));
    
    // Add selection to clicked element
    element.classList.add('selected');
    
    // Update preview with current color
    const preview = document.getElementById(`${modalType}IconPreview`);
    const currentColor = selectedIconColor[modalType];
    preview.innerHTML = `<i class="bi ${iconClass}" style="color: ${currentColor};"></i>`;
    
    // Store selection
    selectedCustomIcon[modalType] = iconClass;
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('show');
    }
});

// Search icons function
function searchIcons(modalType, searchTerm) {
    initializeIconGrid(modalType, searchTerm);
}

// Color picker functions
function updateIconPreviewColor(modalType, color) {
    selectedIconColor[modalType] = color;
    const preview = document.getElementById(`${modalType}IconPreview`);
    const icon = preview.querySelector('i');
    if (icon) {
        icon.style.color = color;
    }
}

function setIconColor(modalType, color) {
    document.getElementById(`${modalType}IconColor`).value = color;
    updateIconPreviewColor(modalType, color);
}

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelector('.modal-overlay.show')?.classList.remove('show');
    }
});

function handleIconError(img, domain, name, step = 1) {
    const baseStyle = "width: 100%; height: 100%; object-fit: contain; border-radius: 12px;";
    
    if (step === 1) {
        // Try high-res Apple touch icon first
        img.src = `https://${domain}/apple-touch-icon.png`;
        img.style.cssText = baseStyle;
        img.onerror = () => handleIconError(img, domain, name, 2);
    } else if (step === 2) {
        // Try Clearbit logo API (high quality)
        img.src = `https://logo.clearbit.com/${domain}`;
        img.style.cssText = baseStyle;
        img.onerror = () => handleIconError(img, domain, name, 3);
    } else if (step === 3) {
        // Try Google high-res favicon
        img.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
        img.style.cssText = baseStyle;
        img.onerror = () => handleIconError(img, domain, name, 4);
    } else {
        // Final fallback to link SVG icon
        img.outerHTML = `<svg viewBox="0 0 20 20" style="width: 100%; height: 100%; color: var(--accent-primary);">
            <path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd"/>
        </svg>`;
    }
}

function createIconImg(url, name, customIcon = null, iconColor = null) {
    // If custom icon is specified, use Bootstrap icon
    if (customIcon) {
        const color = iconColor || 'var(--accent-primary)';
        return `<i class="bi ${customIcon}" style="font-size: 4rem; color: ${color};"></i>`;
    }
    
    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        
        // Start with Clearbit's logo API - provides high-quality SVG/PNG logos
        return `<img src="https://logo.clearbit.com/${domain}" alt="${name}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 12px;" onerror="handleIconError(this, '${domain}', '${name}', 1)">`;
    } catch (e) {
        return `<svg viewBox="0 0 20 20" style="width: 100%; height: 100%; color: var(--accent-primary);">
            <path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd"/>
        </svg>`;
    }
}

async function addNewLink() {
    const name = document.getElementById('linkName').value.trim();
    const url = document.getElementById('linkUrl').value.trim();

    if (!name || !url) {
        alert('Please fill in all required fields.');
        return;
    }

    const customIcon = selectedCustomIcon.add;
    const iconColor = selectedIconColor.add;
    
    try {
        // Create link via API
        const linkData = {
            name: name,
            url: url,
            custom_icon: customIcon,
            icon_color: iconColor
        };
        
        await apiRequest('/api/links', {
            method: 'POST',
            body: JSON.stringify(linkData)
        });

        // Clear form and close modal
        document.getElementById('addLinkForm').reset();
        document.getElementById('addCustomIconToggle').classList.remove('active');
        document.getElementById('addIconSelector').classList.remove('show');
        selectedCustomIcon.add = null;
        selectedIconColor.add = '#6366f1';
        closeAddModal();

        // Reload links from API to show the new link
        await loadLinksFromAPI();
    } catch (error) {
        console.error('Failed to add link:', error);
    }
}

// saveLinksToStorage is no longer needed - API handles persistence automatically

async function loadLinksFromAPI() {
    try {
        const links = await apiRequest('/api/links');
        const linksGrid = document.getElementById('linksGrid');
        
        // Clear existing links
        linksGrid.innerHTML = '';
        
        // Add all links from API
        links.forEach(link => {
            let faviconHtml;
            
            // Check if it has a custom icon
            if (link.custom_icon) {
                faviconHtml = createIconImg(link.url, link.name, link.custom_icon, link.icon_color);
            } else {
                // Always use createIconImg for consistent styling and fallback behavior
                faviconHtml = createIconImg(link.url, link.name);
            }
            
            const newLinkHTML = `
                <div class="link-card-container" data-link-id="${link.id}">
                    <a href="${link.url}" target="_blank" class="link-card">
                        <div class="link-icon">
                            ${faviconHtml}
                        </div>
                        <h5 class="link-title">${link.name}</h5>
                    </a>
                    <button class="edit-button" onclick="editLink(this)" title="Edit">
                        <svg class="icon" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                        </svg>
                    </button>
                </div>
            `;
            linksGrid.insertAdjacentHTML('beforeend', newLinkHTML);
        });
        
        // Also populate the toolbar with links
        populateToolbarLinks(links);
    } catch (error) {
        console.error('Failed to load links:', error);
    }
}

let currentEditingCard = null;

function editLink(button) {
    currentEditingCard = button.closest('.link-card-container');
    const link = currentEditingCard.querySelector('a');
    const title = currentEditingCard.querySelector('.link-title');
    const icon = currentEditingCard.querySelector('.link-icon i');
    
    // Populate edit form with current values
    document.getElementById('editLinkName').value = title.textContent;
    document.getElementById('editLinkUrl').value = link.href;
    
    // Reset custom icon state
    document.getElementById('editCustomIconToggle').classList.remove('active');
    document.getElementById('editIconSelector').classList.remove('show');
    selectedCustomIcon.edit = null;
    selectedIconColor.edit = '#6366f1';
    
    // Check if it has a custom Bootstrap icon
    if (icon && icon.className.includes('bi-')) {
        const iconClasses = icon.className.split(' ');
        const bootstrapIcon = iconClasses.find(cls => cls.startsWith('bi-'));
        
        if (bootstrapIcon) {
            // Enable custom icon mode
            document.getElementById('editCustomIconToggle').classList.add('active');
            document.getElementById('editIconSelector').classList.add('show');
            selectedCustomIcon.edit = bootstrapIcon;
            
            // Get icon color
            const iconColor = icon.style.color || '#6366f1';
            selectedIconColor.edit = iconColor;
            document.getElementById('editIconColor').value = iconColor;
            
            // Update preview
            document.getElementById('editIconPreview').innerHTML = `<i class="bi ${bootstrapIcon}" style="color: ${iconColor};"></i>`;
        }
    }
    
    // Show edit modal
    openEditModal();
}

async function saveEditedLink() {
    const name = document.getElementById('editLinkName').value.trim();
    const url = document.getElementById('editLinkUrl').value.trim();

    if (!name || !url) {
        alert('Please fill in all required fields.');
        return;
    }

    if (currentEditingCard) {
        const linkId = currentEditingCard.dataset.linkId;
        const customIcon = selectedCustomIcon.edit;
        const iconColor = selectedIconColor.edit;
        
        try {
            // Update link via API
            const linkData = {
                name: name,
                url: url,
                custom_icon: customIcon,
                icon_color: iconColor
            };
            
            await apiRequest(`/api/links/${linkId}`, {
                method: 'PUT',
                body: JSON.stringify(linkData)
            });

            // Close modal and reset state
            document.getElementById('editCustomIconToggle').classList.remove('active');
            document.getElementById('editIconSelector').classList.remove('show');
            selectedCustomIcon.edit = null;
            selectedIconColor.edit = '#6366f1';
            closeEditModal();
            
            currentEditingCard = null;

            // Reload links from API to show the updated link
            await loadLinksFromAPI();
        } catch (error) {
            console.error('Failed to update link:', error);
        }
    }
}

async function deleteLink() {
    if (currentEditingCard && confirm('Are you sure you want to delete this link?')) {
        const linkId = currentEditingCard.dataset.linkId;
        
        try {
            // Delete link via API
            await apiRequest(`/api/links/${linkId}`, {
                method: 'DELETE'
            });

            // Close modal
            closeEditModal();
            
            currentEditingCard = null;

            // Reload links from API to show the updated list
            await loadLinksFromAPI();
        } catch (error) {
            console.error('Failed to delete link:', error);
        }
    }
}

// Toolbar functionality
let toolbarTimeout;
let isToolbarVisible = false;

function initializeToolbar() {
    const toolbar = document.getElementById('leftToolbar');
    const triggerZone = document.getElementById('mouseTriggerZone');
    
    // Mouse enter trigger zone
    triggerZone.addEventListener('mouseenter', () => {
        showToolbar();
    });
    
    // Mouse leave toolbar
    toolbar.addEventListener('mouseleave', () => {
        hideToolbar();
    });
    
    // Keep toolbar visible when hovering over it
    toolbar.addEventListener('mouseenter', () => {
        clearTimeout(toolbarTimeout);
        showToolbar();
    });
}

function showToolbar() {
    clearTimeout(toolbarTimeout);
    const toolbar = document.getElementById('leftToolbar');
    toolbar.classList.add('show');
    isToolbarVisible = true;
}

function hideToolbar() {
    toolbarTimeout = setTimeout(() => {
        const toolbar = document.getElementById('leftToolbar');
        toolbar.classList.remove('show');
        isToolbarVisible = false;
    }, 300); // Small delay to prevent flickering
}

function goHome() {
    // Check if we're already on the home page
    if (window.location.pathname === '/' || window.location.pathname === '') {
        // If already home, just scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        // Navigate to home page
        window.location.href = '/';
    }
    hideToolbar();
}

function populateToolbarLinks(links) {
    const toolbarLinks = document.getElementById('toolbarLinks');
    toolbarLinks.innerHTML = '';
    
    links.forEach(link => {
        const toolbarLink = document.createElement('a');
        toolbarLink.className = 'toolbar-link';
        toolbarLink.href = link.url;
        toolbarLink.target = '_blank';
        toolbarLink.title = link.name;
        
        // Create icon HTML
        let iconHtml;
        if (link.custom_icon) {
            const color = link.icon_color || 'var(--accent-primary)';
            iconHtml = `<i class="bi ${link.custom_icon}" style="color: ${color};"></i>`;
        } else {
            try {
                const urlObj = new URL(link.url);
                const domain = urlObj.hostname;
                iconHtml = `<img src="https://logo.clearbit.com/${domain}" alt="${link.name}" onerror="handleToolbarIconError(this, '${domain}', '${link.name}', 1)">`;
            } catch (e) {
                iconHtml = `<svg viewBox="0 0 20 20" style="width: 100%; height: 100%; color: var(--accent-primary);"><path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd"/></svg>`;
            }
        }
        
        toolbarLink.innerHTML = `
            <div class="toolbar-link-icon">
                ${iconHtml}
            </div>
            <div class="toolbar-link-title">${link.name}</div>
        `;
        
        toolbarLinks.appendChild(toolbarLink);
    });
}

function handleToolbarIconError(img, domain, name, step = 1) {
    const baseStyle = "width: 100%; height: 100%; object-fit: contain; border-radius: 4px;";
    
    if (step === 1) {
        img.src = `https://${domain}/apple-touch-icon.png`;
        img.style.cssText = baseStyle;
        img.onerror = () => handleToolbarIconError(img, domain, name, 2);
    } else if (step === 2) {
        img.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
        img.style.cssText = baseStyle;
        img.onerror = () => handleToolbarIconError(img, domain, name, 3);
    } else {
        img.outerHTML = `<svg viewBox="0 0 20 20" style="width: 100%; height: 100%; color: var(--accent-primary);">
            <path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd"/>
        </svg>`;
    }
}

// Initialize icons and load saved links when page loads
document.addEventListener('DOMContentLoaded', async function() {
    // Load Bootstrap icons dynamically
    allBootstrapIcons = await loadBootstrapIcons();
    
    // Initialize toolbar functionality
    initializeToolbar();
    
    // Load links from API
    await loadLinksFromAPI();
});