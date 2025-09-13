
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




// Modal functionality

function openEditModal() {
    document.getElementById('editLinkModal').classList.add('show');
}

function closeEditModal() {
    document.getElementById('editLinkModal').classList.remove('show');
}




// Close modal when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('show');
    }
});




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

function createIconImg(url, name) {
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


// saveLinksToStorage is no longer needed - API handles persistence automatically

async function loadLinksFromAPI() {
    try {
        const links = await apiRequest('/api/links');
        const linksGrid = document.getElementById('linksGrid');
        
        // Clear existing links
        linksGrid.innerHTML = '';
        
        // Add all links from API
        links.forEach(link => {
            // Always use createIconImg for consistent styling and fallback behavior
            const faviconHtml = createIconImg(link.url, link.name);
            
            const newLinkHTML = `
                <div class="link-card-container" data-link-id="${link.id}">
                    <a href="${link.url}" class="link-card">
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
    
    // Populate edit form with current values
    document.getElementById('editLinkName').value = title.textContent;
    document.getElementById('editLinkUrl').value = link.href;
    
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
        
        try {
            // Update link via API
            const linkData = {
                name: name,
                url: url
            };
            
            await apiRequest(`/api/links/${linkId}`, {
                method: 'PUT',
                body: JSON.stringify(linkData)
            });

            // Close modal and reset state
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
        try {
            const urlObj = new URL(link.url);
            const domain = urlObj.hostname;
            iconHtml = `<img src="https://logo.clearbit.com/${domain}" alt="${link.name}" onerror="handleToolbarIconError(this, '${domain}', '${link.name}', 1)">`;
        } catch (e) {
            iconHtml = `<svg viewBox="0 0 20 20" style="width: 100%; height: 100%; color: var(--accent-primary);"><path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd"/></svg>`;
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

// Initialize and load saved links when page loads
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize toolbar functionality
    initializeToolbar();
    
    // Load links from API
    await loadLinksFromAPI();
});