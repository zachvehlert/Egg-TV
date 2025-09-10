// Popular Bootstrap icons for streaming/media services
const popularIcons = [
    'bi-play-circle', 'bi-film', 'bi-tv', 'bi-music-note-beamed', 'bi-headphones',
    'bi-camera-video', 'bi-broadcast', 'bi-disc', 'bi-vinyl', 'bi-cassette',
    'bi-speaker', 'bi-boombox', 'bi-mic', 'bi-radio', 'bi-youtube',
    'bi-facebook', 'bi-twitter', 'bi-instagram', 'bi-linkedin', 'bi-github',
    'bi-google', 'bi-microsoft', 'bi-apple', 'bi-amazon', 'bi-netflix',
    'bi-spotify', 'bi-twitch', 'bi-discord', 'bi-reddit', 'bi-pinterest',
    'bi-whatsapp', 'bi-telegram', 'bi-slack', 'bi-zoom', 'bi-skype',
    'bi-gamepad2', 'bi-controller', 'bi-joystick', 'bi-puzzle', 'bi-dice-1',
    'bi-heart', 'bi-star', 'bi-bookmark', 'bi-flag', 'bi-trophy',
    'bi-gift', 'bi-camera', 'bi-images', 'bi-palette', 'bi-brush',
    'bi-scissors', 'bi-hammer', 'bi-wrench', 'bi-gear', 'bi-tools',
    'bi-house', 'bi-building', 'bi-shop', 'bi-cart', 'bi-bag',
    'bi-wallet', 'bi-credit-card', 'bi-piggy-bank', 'bi-currency-dollar', 'bi-graph-up',
    'bi-newspaper', 'bi-book', 'bi-journal', 'bi-pencil', 'bi-pen',
    'bi-calendar', 'bi-clock', 'bi-alarm', 'bi-stopwatch', 'bi-hourglass',
    'bi-globe', 'bi-compass', 'bi-map', 'bi-geo-alt', 'bi-airplane',
    'bi-train', 'bi-car-front', 'bi-bicycle', 'bi-scooter', 'bi-truck',
    'bi-cloud', 'bi-sun', 'bi-moon', 'bi-snow', 'bi-thermometer',
    'bi-lightbulb', 'bi-fire', 'bi-droplet', 'bi-tree', 'bi-flower1'
];

let selectedCustomIcon = {
    add: null,
    edit: null
};

// Modal functionality
function openAddModal() {
    document.getElementById('addLinkModal').classList.add('show');
    initializeIconGrid('add');
}

function closeAddModal() {
    document.getElementById('addLinkModal').classList.remove('show');
}

function openEditModal() {
    document.getElementById('editLinkModal').classList.add('show');
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
    }
}

function initializeIconGrid(modalType) {
    const grid = document.getElementById(`${modalType}IconGrid`);
    grid.innerHTML = '';
    
    popularIcons.forEach(iconClass => {
        const iconOption = document.createElement('div');
        iconOption.className = 'icon-option';
        iconOption.innerHTML = `<i class="bi ${iconClass}"></i>`;
        iconOption.onclick = () => selectIcon(modalType, iconClass, iconOption);
        grid.appendChild(iconOption);
    });
}

function selectIcon(modalType, iconClass, element) {
    // Remove previous selection
    const grid = document.getElementById(`${modalType}IconGrid`);
    grid.querySelectorAll('.icon-option').forEach(opt => opt.classList.remove('selected'));
    
    // Add selection to clicked element
    element.classList.add('selected');
    
    // Update preview
    const preview = document.getElementById(`${modalType}IconPreview`);
    preview.innerHTML = `<i class="bi ${iconClass}"></i>`;
    
    // Store selection
    selectedCustomIcon[modalType] = iconClass;
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

function createIconImg(url, name, customIcon = null) {
    // If custom icon is specified, use Bootstrap icon
    if (customIcon) {
        return `<i class="bi ${customIcon}" style="font-size: 4rem; color: var(--accent-primary);"></i>`;
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

function addNewLink() {
    const name = document.getElementById('linkName').value.trim();
    const url = document.getElementById('linkUrl').value.trim();

    if (!name || !url) {
        alert('Please fill in all required fields.');
        return;
    }

    const customIcon = selectedCustomIcon.add;
    const linksGrid = document.getElementById('linksGrid');
    const faviconHtml = createIconImg(url, name, customIcon);
    
    const newLinkHTML = `
        <div class="link-card-container">
            <a href="${url}" target="_blank" class="link-card">
                <div class="link-icon">
                    ${faviconHtml}
                </div>
                <h5 class="link-title">${name}</h5>
            </a>
            <button class="edit-button" onclick="editLink(this)" title="Edit">
                <svg class="icon" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                </svg>
            </button>
        </div>
    `;

    linksGrid.insertAdjacentHTML('beforeend', newLinkHTML);

    // Clear form and close modal
    document.getElementById('addLinkForm').reset();
    document.getElementById('addCustomIconToggle').classList.remove('active');
    document.getElementById('addIconSelector').classList.remove('show');
    selectedCustomIcon.add = null;
    closeAddModal();

    // Save to localStorage
    saveLinksToStorage();
}

function saveLinksToStorage() {
    const links = [];
    const linkCards = document.querySelectorAll('#linksGrid .link-card-container');
    
    linkCards.forEach(card => {
        const link = card.querySelector('a');
        const title = card.querySelector('.link-title');
        const icon = card.querySelector('.link-icon i');
        
        if (link && title) {
            const linkData = {
                name: title.textContent,
                url: link.href
            };
            
            // Check if it's using a custom Bootstrap icon
            if (icon && icon.className.includes('bi-')) {
                const iconClasses = icon.className.split(' ');
                const bootstrapIcon = iconClasses.find(cls => cls.startsWith('bi-'));
                linkData.customIcon = bootstrapIcon;
            }
            
            links.push(linkData);
        }
    });
    
    localStorage.setItem('tvBoxLinks', JSON.stringify(links));
}

function loadLinksFromStorage() {
    const savedLinks = localStorage.getItem('tvBoxLinks');
    if (savedLinks) {
        const links = JSON.parse(savedLinks);
        const linksGrid = document.getElementById('linksGrid');
        
        // Clear existing links except the first two (YouTube and Netflix)
        const existingLinks = linksGrid.querySelectorAll('.link-card-container');
        for (let i = 2; i < existingLinks.length; i++) {
            existingLinks[i].remove();
        }
        
        // Add saved links (skip first two which are defaults)
        for (let i = 2; i < links.length; i++) {
            const link = links[i];
            let faviconHtml;
            
            // Check if it has a custom icon
            if (link.customIcon) {
                faviconHtml = createIconImg(link.url, link.name, link.customIcon);
            } else {
                // Always use createIconImg for consistent styling and fallback behavior
                faviconHtml = createIconImg(link.url, link.name);
            }
            
            const newLinkHTML = `
                <div class="link-card-container">
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
        }
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
    
    // Check if it has a custom Bootstrap icon
    if (icon && icon.className.includes('bi-')) {
        const iconClasses = icon.className.split(' ');
        const bootstrapIcon = iconClasses.find(cls => cls.startsWith('bi-'));
        
        if (bootstrapIcon) {
            // Enable custom icon mode
            document.getElementById('editCustomIconToggle').classList.add('active');
            document.getElementById('editIconSelector').classList.add('show');
            selectedCustomIcon.edit = bootstrapIcon;
            
            // Update preview
            document.getElementById('editIconPreview').innerHTML = `<i class="bi ${bootstrapIcon}"></i>`;
        }
    }
    
    // Show edit modal
    openEditModal();
}

function saveEditedLink() {
    const name = document.getElementById('editLinkName').value.trim();
    const url = document.getElementById('editLinkUrl').value.trim();

    if (!name || !url) {
        alert('Please fill in all required fields.');
        return;
    }

    if (currentEditingCard) {
        // Update the link
        const link = currentEditingCard.querySelector('a');
        const title = currentEditingCard.querySelector('.link-title');
        const iconContainer = currentEditingCard.querySelector('.link-icon');
        
        link.href = url;
        title.textContent = name;
        
        // Update favicon with custom icon if selected
        const customIcon = selectedCustomIcon.edit;
        const faviconHtml = createIconImg(url, name, customIcon);
        iconContainer.innerHTML = faviconHtml;
        
        // Save to localStorage
        saveLinksToStorage();
        
        // Close modal and reset state
        document.getElementById('editCustomIconToggle').classList.remove('active');
        document.getElementById('editIconSelector').classList.remove('show');
        selectedCustomIcon.edit = null;
        closeEditModal();
        
        currentEditingCard = null;
    }
}

function deleteLink() {
    if (currentEditingCard && confirm('Are you sure you want to delete this link?')) {
        currentEditingCard.remove();
        saveLinksToStorage();
        
        // Close modal
        closeEditModal();
        
        currentEditingCard = null;
    }
}

// Load saved links when page loads
document.addEventListener('DOMContentLoaded', loadLinksFromStorage);