let currentSlide = 0;
let screenshots = [];
let allLinks = []; // Store all links for filtering
let filterVisible = false; // Changed to false for filters hidden by default
let currentZoom = 1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

async function checkServerHealth() {
    try {
        const response = await fetch('http://localhost:5000/health');
        const text = await response.text();
        console.log('Health check response:', text);
        return response.ok;
    } catch (error) {
        console.error('Server health check failed:', error);
        return false;
    }
}

async function getCachedScreenshots(links) {
    try {
        const { cachedScreenshots } = await chrome.storage.session.get('cachedScreenshots');
        if (!cachedScreenshots) return new Map();
        
        // Convert the cached data back to a Map
        const screenshotMap = new Map(Object.entries(cachedScreenshots));
        console.log(`Found ${screenshotMap.size} cached screenshots`);
        return screenshotMap;
    } catch (error) {
        console.error('Error getting cached screenshots:', error);
        return new Map();
    }
}

async function cacheScreenshot(url, screenshotBlob) {
    try {
        const { cachedScreenshots = {} } = await chrome.storage.session.get('cachedScreenshots');
        const updatedCache = {
            ...cachedScreenshots,
            [url]: await screenshotBlob.text() // Store as base64 string
        };
        await chrome.storage.session.set({ cachedScreenshots: updatedCache });
        console.log(`Cached screenshot for ${url}`);
    } catch (error) {
        console.error('Error caching screenshot:', error);
    }
}

async function generateScreenshot(url, linkText) {
    try {
        console.log(`Generating preview for: ${url} (${linkText})`);
        
        // Check cache first
        const cachedScreenshots = await getCachedScreenshots();
        if (cachedScreenshots.has(url)) {
            console.log(`Using cached screenshot for: ${url}`);
            const cachedData = cachedScreenshots.get(url);
            const blob = new Blob([cachedData], { type: 'image/png' });
            return URL.createObjectURL(blob);
        }

        const response = await fetch(`http://localhost:5000/screenshot?url=${encodeURIComponent(url)}`, {
            method: 'GET',
            headers: {
                'Accept': 'image/png',
            },
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Server error (${response.status}):`, errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        if (blob.size === 0) {
            throw new Error('Received empty response from server');
        }
        
        // Cache the successful screenshot
        await cacheScreenshot(url, blob);
        
        console.log(`Preview generated successfully for: ${url}`);
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error(`Error generating preview for ${url}:`, error);
        return null;
    }
}

function updateCarousel() {
    const carousel = document.getElementById('carousel');
    carousel.style.transform = `translateX(-${currentSlide * 100}%)`;
    
    // Reset zoom when changing slides
    currentZoom = 1;
    const container = carousel.children[currentSlide]?.querySelector('.preview-container');
    if (container) {
        const screenshot = container.querySelector('.screenshot');
        screenshot.style.transform = '';
        screenshot.classList.remove('zoomed');
        container.scrollLeft = 0;
        updateZoomLevel(container);
    }
    
    // Update preview counter
    const counter = document.getElementById('preview-counter');
    if (counter) {
        counter.textContent = `Preview ${currentSlide + 1} of ${screenshots.length}`;
    }
    
    // Update jump buttons
    updateJumpButtons();
}

function prevSlide() {
    if (currentSlide > 0) {
        currentSlide--;
        updateCarousel();
    }
}

function nextSlide() {
    if (currentSlide < screenshots.length - 1) {
        currentSlide++;
        updateCarousel();
    }
}

function updateLoadingStatus(current, total) {
    const carousel = document.getElementById('carousel');
    if (current === 0) {
        carousel.innerHTML = '<div class="loading">Preparing to generate previews...<br>This may take a few moments.</div>';
    } else {
        const loadingDiv = carousel.querySelector('.loading');
        if (loadingDiv) {
            loadingDiv.innerHTML = `
                Generating previews...<br>
                Screenshot ${current} of ${total}<br>
                <small style="color: #666;">Please wait while screenshots are generated</small>
            `;
        }
    }
}

function showError(message) {
    const carousel = document.getElementById('carousel');
    carousel.innerHTML = `<div class="loading" style="color: #d32f2f;">${message}</div>`;
}

function addScreenshotToCarousel(screenshot) {
    const carousel = document.getElementById('carousel');
    const loadingDiv = carousel.querySelector('.loading');
    
    if (loadingDiv) {
        carousel.innerHTML = '';
    }
    
    const newItem = document.createElement('div');
    newItem.className = 'carousel-item';
    newItem.innerHTML = `
        <div class="preview-header">
            <div class="preview-header-content">
                <div class="link-text">${screenshot.linkText}</div>
                <div class="url-display">${screenshot.url}</div>
            </div>
            <button class="visit-site-btn" data-url="${screenshot.url}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
                Visit Site
            </button>
        </div>
        <div class="preview-container">
            <img class="screenshot" src="${screenshot.screenshotUrl}" alt="Page Preview">
            <div class="zoom-controls">
                <span class="zoom-level">100%</span>
            </div>
        </div>
    `;

    // Add click handler for the visit site button
    const visitButton = newItem.querySelector('.visit-site-btn');
    visitButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        chrome.tabs.create({ 
            url: screenshot.url,
            active: false  // This makes the tab open in the background
        });
    });

    // Add zoom controls handlers
    const container = newItem.querySelector('.preview-container');

    // Mouse wheel zoom
    container.addEventListener('wheel', (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
            handleZoom(container, currentZoom + delta, e);
        }
    });

    // Double click to toggle zoom
    container.addEventListener('dblclick', (e) => {
        const newZoom = currentZoom === 1 ? 2 : 1;
        handleZoom(container, newZoom, e);
    });
    
    carousel.appendChild(newItem);
    updateJumpButtons();
}

function getMaxLinks() {
    const linkCount = document.getElementById('linkCount').value;
    const customCount = document.getElementById('customLinkCount').value;
    
    if (linkCount === 'all') return Infinity;
    if (linkCount === 'custom') return parseInt(customCount) || 5;
    return parseInt(linkCount) || 5;
}

function setupLinkCountHandlers() {
    const linkCountSelect = document.getElementById('linkCount');
    const customCountContainer = document.getElementById('customCountContainer');
    const customLinkCount = document.getElementById('customLinkCount');

    linkCountSelect.addEventListener('change', () => {
        customCountContainer.style.display = 
            linkCountSelect.value === 'custom' ? 'inline-block' : 'none';
        
        // Reapply filters and update carousel
        const filteredLinks = filterLinks(allLinks);
        initializeCarousel(filteredLinks);
    });

    customLinkCount.addEventListener('change', () => {
        const filteredLinks = filterLinks(allLinks);
        initializeCarousel(filteredLinks);
    });
}

function getMainLinks(links) {
    const uniqueLinks = new Map();
    
    links.forEach(({ url, text }) => {
        try {
            const urlObj = new URL(url);
            const baseUrl = urlObj.origin + urlObj.pathname;
            
            if (!uniqueLinks.has(baseUrl)) {
                uniqueLinks.set(baseUrl, text.trim() || url);
            }
        } catch (e) {
            console.error('Invalid URL:', url);
        }
    });
    
    // Use getMaxLinks() instead of MAX_LINKS constant
    const maxLinks = getMaxLinks();
    const allUniqueLinks = Array.from(uniqueLinks)
        .map(([url, text]) => ({ url, text }));
    
    // Only slice if we have a finite limit
    return maxLinks === Infinity ? allUniqueLinks : allUniqueLinks.slice(0, maxLinks);
}

async function initializeCarousel(links) {
    console.log('Initializing preview carousel with links:', links);
    
    // Check if screenshot service is running
    const isServerRunning = await checkServerHealth();
    if (!isServerRunning) {
        showError('Preview service is not running. Please start the service and try again.');
        return;
    }

    // Get main links only
    const mainLinks = getMainLinks(links);
    console.log(`Processing ${mainLinks.length} links for preview`);

    if (mainLinks.length === 0) {
        showError('No valid links found to preview on this page.');
        return;
    }

    // Clear existing screenshots and carousel
    screenshots = [];
    const carousel = document.getElementById('carousel');
    carousel.innerHTML = '';
    updateLoadingStatus(0, mainLinks.length);
    updateJumpButtons(); // Show loading state for all buttons
    
    // Process previews one by one
    for (let i = 0; i < mainLinks.length; i++) {
        const { url, text } = mainLinks[i];
        try {
            updateLoadingStatus(i + 1, mainLinks.length);
            const screenshotUrl = await generateScreenshot(url, text);
            if (screenshotUrl) {
                screenshots.push({ url, screenshotUrl, linkText: text });
                addScreenshotToCarousel({ url, screenshotUrl, linkText: text });
            }
        } catch (error) {
            console.error(`Failed to generate preview for ${url}:`, error);
        }
        // Update jump buttons after each screenshot
        updateJumpButtons();
    }

    if (screenshots.length === 0) {
        showError('Could not generate any previews. Please check the console for errors.');
    } else {
        console.log(`Successfully generated ${screenshots.length} previews`);
        currentSlide = 0;
        updateCarousel();
        // Cache state after successful load
        try {
            await cacheState();
        } catch (error) {
            console.error('Failed to cache state:', error);
        }
    }
}

// Add event listeners when the document is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Preview extension opened');
    
    // Setup filter toggle
    document.getElementById('filterToggle').addEventListener('click', toggleFilters);
    
    // Hide filters by default
    const filterControls = document.getElementById('filterControls');
    filterControls.style.display = 'none';
    document.getElementById('filterToggle').querySelector('span').textContent = 'Show Filters';
    
    // Add click handlers for navigation buttons
    document.getElementById('prevButton').addEventListener('click', prevSlide);
    document.getElementById('nextButton').addEventListener('click', nextSlide);
    
    // Setup link count handlers
    setupLinkCountHandlers();

    // Query for links in the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        const tab = tabs[0];
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });

            chrome.tabs.sendMessage(tab.id, { action: "getLinks" }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Content script error:', chrome.runtime.lastError);
                    showError('Please refresh the page and try again.');
                    return;
                }
                
                if (!response) {
                    showError('No response from content script. Please refresh the page.');
                    return;
                }

                if (!response.success) {
                    showError(`Error: ${response.error || 'Unknown error occurred'}`);
                    return;
                }

                if (response.links && response.links.length > 0) {
                    console.log(`Found ${response.links.length} links on the page`);
                    allLinks = response.links;
                    setupFilterHandlers();
                    const filteredLinks = filterLinks(allLinks);
                    initializeCarousel(filteredLinks);
                } else {
                    showError('No valid links found on this page.');
                }
            });
        } catch (error) {
            console.error('Error:', error);
            showError('An error occurred. Please try again.');
        }
    });
});

// Add this function to handle filtering
function filterLinks(links) {
    const externalOnly = document.getElementById('externalLinks').checked;
    const internalOnly = document.getElementById('internalLinks').checked;
    const linkType = document.getElementById('linkType').value;
    
    return links.filter(link => {
        const url = new URL(link.url);
        const isExternal = url.hostname !== window.location.hostname;
        const isInternal = !isExternal;
        
        // Check external/internal filters
        if (externalOnly && !isExternal) return false;
        if (internalOnly && !isInternal) return false;
        
        // Check link type
        if (linkType !== 'all') {
            const extension = url.pathname.split('.').pop().toLowerCase();
            switch (linkType) {
                case 'images':
                    if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return false;
                    break;
                case 'docs':
                    if (!['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension)) return false;
                    break;
                case 'media':
                    if (!['mp4', 'mp3', 'wav', 'avi', 'mov'].includes(extension)) return false;
                    break;
            }
        }
        
        return true;
    });
}

// Add filter change handlers
function setupFilterHandlers() {
    const filterElements = ['externalLinks', 'internalLinks', 'linkType'];
    filterElements.forEach(id => {
        document.getElementById(id).addEventListener('change', () => {
            const filteredLinks = filterLinks(allLinks);
            initializeCarousel(filteredLinks);
        });
    });
}

// Add this function to handle filter visibility toggle
function toggleFilters() {
    const filterControls = document.getElementById('filterControls');
    const toggleButton = document.getElementById('filterToggle');
    filterVisible = !filterVisible;
    
    filterControls.style.display = filterVisible ? 'block' : 'none';
    toggleButton.querySelector('span').textContent = filterVisible ? 'Filters' : 'Show Filters';
    
    // Save preference
    chrome.storage.local.set({ filterVisible });
}

// Add this function to update jump buttons
function updateJumpButtons() {
    const jumper = document.getElementById('linkJumper');
    jumper.innerHTML = '';
    
    // Get the total number of links we're processing
    const totalLinks = getMainLinks(allLinks).length;
    
    // Create buttons for all expected screenshots
    for (let i = 0; i < totalLinks; i++) {
        const button = document.createElement('button');
        const isLoaded = i < screenshots.length;
        const isActive = i === currentSlide;
        
        button.className = `jump-button ${isActive ? 'active' : ''} ${isLoaded ? '' : 'loading'}`;
        
        if (isLoaded) {
            // Show number for loaded screenshots
            button.textContent = (i + 1).toString();
            button.addEventListener('click', () => {
                currentSlide = i;
                updateCarousel();
                updateJumpButtons();
            });
        } else {
            // Show loading indicator for unloaded screenshots
            button.innerHTML = `<span class="loading-dots">...</span>`;
            button.disabled = true;
        }
        
        jumper.appendChild(button);
    }
}

// Add this function to cache the current state
async function cacheState() {
    const cachedData = {
        links: allLinks,
        screenshots: screenshots.map(screenshot => ({
            ...screenshot,
            screenshotUrl: null // Don't cache the blob URLs
        })),
        currentSlide: currentSlide
    };
    await chrome.storage.local.set({ cachedData });
}

function updateZoomLevel(container) {
    const zoomLevel = container.querySelector('.zoom-level');
    if (zoomLevel) {
        zoomLevel.textContent = `${Math.round(currentZoom * 100)}%`;
    }
}

function handleZoom(container, newZoom, event) {
    const screenshot = container.querySelector('.screenshot');
    if (!screenshot) return;

    // Constrain zoom level
    newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
    
    if (newZoom === currentZoom) return;

    // Get mouse position relative to image
    const rect = screenshot.getBoundingClientRect();
    const x = event ? (event.clientX - rect.left) / screenshot.width : 0.5;
    const y = event ? (event.clientY - rect.top) / screenshot.height : 0.5;

    // Apply zoom transform
    screenshot.style.transform = `scale(${newZoom})`;
    
    // Update container scroll to keep mouse position fixed
    if (newZoom > 1) {
        screenshot.classList.add('zoomed');
        const newWidth = screenshot.width * newZoom;
        const newHeight = screenshot.height * newZoom;
        
        container.scrollLeft = (newWidth * x) - (container.clientWidth * x);
        container.scrollTop = (newHeight * y) - (container.clientHeight * y);
    } else {
        screenshot.classList.remove('zoomed');
        container.scrollLeft = 0;
    }

    currentZoom = newZoom;
    updateZoomLevel(container);
} 