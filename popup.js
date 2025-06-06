let currentSlide = 0;
let screenshots = [];
let allLinks = []; // Store all links for filtering
let filterVisible = false; // Changed to false for filters hidden by default
let currentZoom = 1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;
let showLinkNames = false;
let allPageLinks = [];

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
        const { cachedScreenshots = {} } = await chrome.storage.session.get('cachedScreenshots');
        if (cachedScreenshots[url]) {
            console.log(`Using cached screenshot for: ${url}`);
            return cachedScreenshots[url];
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

        // Create URL for display
        const screenshotUrl = URL.createObjectURL(blob);
        
        // Only cache if there's space
        try {
            // Convert blob to base64 string for storage
            const reader = new FileReader();
            const base64Promise = new Promise((resolve) => {
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });
            const base64Data = await base64Promise;
            
            // Try to store in cache
            const updatedCache = {
                ...cachedScreenshots,
                [url]: base64Data
            };
            await chrome.storage.session.set({ cachedScreenshots: updatedCache });
            console.log(`Cached screenshot for ${url}`);
        } catch (cacheError) {
            console.warn('Could not cache screenshot:', cacheError);
            // Clear cache if it's full
            if (cacheError.message.includes('quota')) {
                await chrome.storage.session.remove('cachedScreenshots');
                console.log('Cache cleared due to quota exceeded');
            }
        }
        
        return screenshotUrl;
    } catch (error) {
        console.error(`Error generating preview for ${url}:`, error);
        return null;
    }
}

function updateCarousel() {
    cleanupBlobUrls(); // Cleanup old blob URLs
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
    
    // Add resize handle setup
    setupResizeHandle();
    
    // Add click handlers for navigation buttons
    document.getElementById('prevButton').addEventListener('click', prevSlide);
    document.getElementById('nextButton').addEventListener('click', nextSlide);
    
    // Setup link count handlers
    setupLinkCountHandlers();

    // Check server health first
    const serverRunning = await checkServerHealth();
    if (!serverRunning) {
        showError('Preview service is not running. Please start the service and try again.');
        return;
    }

    // Query active tab and get links
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        const tab = tabs[0];
        try {
            console.log('Executing content script...');
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });

            console.log('Getting links from page...');
            chrome.tabs.sendMessage(tab.id, { action: "getLinks" }, async (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Content script error:', chrome.runtime.lastError);
                    showError('Please refresh the page and try again.');
                    return;
                }
                
                if (!response) {
                    console.error('No response from content script');
                    showError('No response from content script. Please refresh the page.');
                    return;
                }

                if (!response.success) {
                    console.error('Content script error:', response.error);
                    showError(`Error: ${response.error || 'Unknown error occurred'}`);
                    return;
                }

                if (response.links && response.links.length > 0) {
                    console.log(`Found ${response.links.length} links on the page:`, response.links);
                    allLinks = response.links;
                    
                    // Check server health before processing links
                    const isServerRunning = await checkServerHealth();
                    if (!isServerRunning) {
                        console.error('Screenshot service is not running');
                        showError('Screenshot service is not running. Please start the service and try again.');
                        return;
                    }

                    // Process the links
                    await processLinks(response.links);
                } else {
                    console.error('No valid links found');
                    showError('No valid links found on this page.');
                }
            });
        } catch (error) {
            console.error('Error in main process:', error);
            showError('An error occurred. Please try again.');
        }
    });

    // Setup event listeners for controls
    document.getElementById('linkNamesBtn').addEventListener('click', toggleLinkNames);
    document.getElementById('viewAllBtn').addEventListener('click', toggleAllLinksView);
    setupSearch();
});

// Add this function to handle filtering
function filterLinks(links) {
    return links; // Just return all links since we don't use filtering anymore
}

// Add filter change handlers
function setupFilterHandlers() {
    // Empty function since we don't use filters anymore
}

// Add this function to handle filter visibility toggle
function toggleFilters() {
    // Empty function since we don't use filters anymore
}

// Add this function to update jump buttons
function updateJumpButtons() {
    const jumperContainer = document.getElementById('linkJumper');
    if (!jumperContainer) return;
    
    jumperContainer.innerHTML = '';
    
    // Get the total number of links we're processing
    const linkCountSelect = document.getElementById('linkCount');
    const selectedValue = linkCountSelect.value;
    const totalLinks = selectedValue === 'all' ? allLinks.length : 
                      selectedValue === 'custom' ? parseInt(document.getElementById('customLinkCount').value) : 
                      parseInt(selectedValue);
    
    console.log(`Updating jump buttons: ${screenshots.length} screenshots out of ${totalLinks} total links`);
    
    // Create buttons for all expected screenshots
    for (let i = 0; i < totalLinks; i++) {
        const button = document.createElement('button');
        const isLoaded = i < screenshots.length;
        const isActive = i === currentSlide;
        
        button.className = `jump-button ${isActive ? 'active' : ''} ${isLoaded ? '' : 'loading'}`;
        
        if (isLoaded) {
            // Show number or name for loaded screenshots
            const buttonText = !showLinkNames ? 
                (i + 1).toString() : 
                (screenshots[i].linkText.trim() || `Link ${i + 1}`);
            
            button.textContent = buttonText;
            if (showLinkNames) {
                button.title = buttonText; // Add tooltip for full text
            }
            
            button.addEventListener('click', () => {
                currentSlide = i;
                updateCarousel();
            });
        } else {
            // Show loading indicator for unloaded screenshots
            button.innerHTML = `<span class="loading-dots">...</span>`;
            button.disabled = true;
        }
        
        jumperContainer.appendChild(button);
    }
    
    console.log('Jump buttons updated');
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

function toggleLinkNames() {
    showLinkNames = !showLinkNames;
    const button = document.getElementById('linkNamesBtn');
    button.querySelector('span').textContent = showLinkNames ? 'Link Numbers' : 'Link Names';
    updateJumpButtons();
}

function toggleAllLinksView() {
    const existingDropdown = document.querySelector('.all-links-dropdown');
    if (existingDropdown) {
        existingDropdown.remove();
        return;
    }

    const dropdown = document.createElement('div');
    dropdown.className = 'all-links-dropdown';
    
    allLinks.forEach((link, index) => {
        const item = document.createElement('div');
        item.className = 'all-links-item';
        item.innerHTML = `
            <div class="all-links-text">${link.text || `Link ${index + 1}`}</div>
            <div class="all-links-url">${link.url}</div>
        `;
        item.addEventListener('click', () => {
            jumpToLink(link);
            dropdown.remove();
        });
        dropdown.appendChild(item);
    });

    // If no links are found
    if (allLinks.length === 0) {
        const item = document.createElement('div');
        item.className = 'all-links-item';
        item.textContent = 'No links found on this page.';
        dropdown.appendChild(item);
    }

    const viewAllBtn = document.getElementById('viewAllBtn');
    viewAllBtn.parentNode.insertBefore(dropdown, viewAllBtn.nextSibling);

    // Close dropdown when clicking outside
    document.addEventListener('click', function closeDropdown(e) {
        if (!dropdown.contains(e.target) && !e.target.closest('#viewAllBtn')) {
            dropdown.remove();
            document.removeEventListener('click', closeDropdown);
        }
    });
}

async function processLinks(links) {
    try {
        if (links.length === 0) {
            console.error('No links to process');
            showError('No links found on this page.');
            return;
        }

        console.log('Starting to process links:', links);

        // Get the selected link count
        const linkCountSelect = document.getElementById('linkCount');
        const selectedValue = linkCountSelect.value;
        const maxLinks = selectedValue === 'all' ? links.length : 
                        selectedValue === 'custom' ? parseInt(document.getElementById('customLinkCount').value) : 
                        parseInt(selectedValue);

        // Limit the links to process
        const linksToProcess = links.slice(0, maxLinks);
        console.log(`Processing ${linksToProcess.length} links out of ${links.length} total`);

        // Clear existing state
        screenshots = [];
        currentSlide = 0;
        const carousel = document.getElementById('carousel');
        carousel.innerHTML = '<div class="loading">Preparing to generate previews...</div>';
        updateJumpButtons(); // Reset jump buttons

        // Process each link
        for (let i = 0; i < linksToProcess.length; i++) {
            const link = linksToProcess[i];
            console.log(`Processing link ${i + 1}/${linksToProcess.length}:`, link);
            updateLoadingStatus(i + 1, linksToProcess.length);
            
            try {
                const screenshotUrl = await generateScreenshot(link.url, link.text);
                if (screenshotUrl) {
                    console.log(`Successfully generated screenshot for ${link.url}`);
                    const screenshot = {
                        url: link.url,
                        linkText: link.text,
                        screenshotUrl: screenshotUrl
                    };
                    screenshots.push(screenshot);
                    addScreenshotToCarousel(screenshot);
                    updateJumpButtons(); // Update after each successful screenshot
                } else {
                    console.error(`Failed to generate screenshot for ${link.url}`);
                }
            } catch (screenshotError) {
                console.error(`Error generating screenshot for ${link.url}:`, screenshotError);
                // Continue with next link instead of stopping
                continue;
            }
        }

        if (screenshots.length === 0) {
            console.error('No screenshots were generated successfully');
            showError('Failed to generate any previews. Please check if the screenshot service is running (run_server.bat) and try again.');
            return;
        }

        console.log(`Successfully generated ${screenshots.length} previews`);
        updateCarousel();
    } catch (error) {
        console.error('Error processing links:', error);
        showError('Error processing links. Please ensure the screenshot service is running and try again.');
    }
}

// Add these functions for search functionality
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (query.length < 1) {
            searchResults.style.display = 'none';
            return;
        }

        const matches = allLinks.filter(link => 
            link.text.toLowerCase().includes(query) ||
            link.url.toLowerCase().includes(query)
        );

        displaySearchResults(matches);
    });

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            searchResults.style.display = 'none';
        }
    });
}

function displaySearchResults(matches) {
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '';
    
    if (matches.length === 0) {
        searchResults.innerHTML = '<div class="search-result-item">No matches found</div>';
        searchResults.style.display = 'block';
        return;
    }

    matches.forEach((match, index) => {
        const div = document.createElement('div');
        div.className = 'search-result-item';
        div.textContent = match.text || `Link ${index + 1}`;
        div.addEventListener('click', () => {
            jumpToLink(match);
            searchResults.style.display = 'none';
            document.getElementById('searchInput').value = '';
        });
        searchResults.appendChild(div);
    });

    searchResults.style.display = 'block';
}

function jumpToLink(link) {
    const index = screenshots.findIndex(s => s.url === link.url);
    if (index !== -1) {
        currentSlide = index;
        updateCarousel();
    }
}

// Add cleanup function for blob URLs
function cleanupBlobUrls() {
    const carousel = document.getElementById('carousel');
    const images = carousel.querySelectorAll('img.screenshot');
    images.forEach(img => {
        if (img.src.startsWith('blob:')) {
            URL.revokeObjectURL(img.src);
        }
    });
}

// Add resize handle functionality
function setupResizeHandle() {
    const handle = document.querySelector('.resize-handle');
    const body = document.body;
    let startX, startWidth;
    const defaultWidth = 800; // Default width when extension first loads

    handle.addEventListener('mousedown', initDrag);

    function initDrag(e) {
        startX = e.clientX;
        startWidth = parseInt(window.getComputedStyle(body).width);
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', stopDrag);
        e.preventDefault();
    }

    function doDrag(e) {
        const width = startWidth - (e.clientX - startX);
        // Constrain width between min and max, with default as the max
        const constrainedWidth = Math.max(400, Math.min(defaultWidth, width));
        body.style.width = constrainedWidth + 'px';
        
        // Reset preview to default state
        const containers = document.querySelectorAll('.preview-container');
        containers.forEach(container => {
            const screenshot = container.querySelector('.screenshot');
            if (screenshot) {
                screenshot.style.transform = '';
                screenshot.classList.remove('zoomed');
                container.scrollLeft = 0;
                container.scrollTop = 0;
            }
        });

        // Reset zoom level displays
        const zoomLevels = document.querySelectorAll('.zoom-level');
        zoomLevels.forEach(zoomLevel => {
            zoomLevel.textContent = '100%';
        });

        // Reset current zoom
        currentZoom = 1;
    }

    function stopDrag() {
        document.removeEventListener('mousemove', doDrag);
        document.removeEventListener('mouseup', stopDrag);
    }
} 