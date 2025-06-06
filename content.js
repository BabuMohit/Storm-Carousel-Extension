/**
 * Link Preview Carousel Content Script
 * 
 * This content script is injected into web pages to collect and analyze links.
 * It implements smart link detection to focus on content-relevant links while
 * filtering out navigation and functional links.
 * 
 * Features:
 * - Smart link detection
 * - Content area identification
 * - Link text extraction
 * - URL validation
 */

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getLinks") {
        try {
            console.log('Content script received getLinks request');
            
            const visibleLinks = new Map();
            
            // Find all potential content areas
            const contentAreas = findContentAreas();
            console.log('Found content areas:', contentAreas);

            // Process each content area for links
            contentAreas.forEach(area => {
                // Find all anchor elements within the content area
                const anchors = area.getElementsByTagName('a');
                
                Array.from(anchors).forEach(anchor => {
                    if (isContentLink(anchor) && isVisibleElement(anchor)) {
                        const url = anchor.href;
                        const text = getVisibleText(anchor).trim();
                        
                        // Only include if it's a valid URL and has visible text
                        if (isValidUrl(url) && text) {
                            visibleLinks.set(url, {
                                url: url,
                                text: text
                            });
                        }
                    }
                });
            });

            // Convert Map to array and send response
            const links = Array.from(visibleLinks.values());
            console.log(`Found ${links.length} content links on the page`);
            
            sendResponse({ success: true, links: links });
        } catch (error) {
            console.error('Content script error:', error);
            sendResponse({ 
                success: false, 
                error: error.message,
                links: []
            });
        }
    }
    return true; // Keep message channel open for async response
});

/**
 * Identifies main content areas in the webpage
 * Uses a prioritized list of common content selectors
 * Falls back to body if no specific content areas are found
 * 
 * @returns {Array<Element>} Array of content area elements
 */
function findContentAreas() {
    const contentAreas = [];
    
    // Common content selectors in order of priority
    const contentSelectors = [
        'article',
        'main',
        '.content',
        '.post-content',
        '.entry-content',
        '#content',
        '.article-content',
        // Wikipedia specific
        '.mw-parser-output',
        // Common blog platforms
        '.post-body',
        '.blog-post',
        // Documentation
        '.documentation',
        '.docs-content',
        // Fallback to body if no content areas found
        'body'
    ];
    
    for (const selector of contentSelectors) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            if (isVisibleElement(element)) {
                contentAreas.push(element);
            }
        });
        
        // If we found content areas, stop looking
        if (contentAreas.length > 0) break;
    }
    
    return contentAreas;
}

/**
 * Determines if a link is likely to be content-relevant
 * Checks for various indicators of content links vs. navigation links
 * 
 * @param {HTMLAnchorElement} anchor - The anchor element to check
 * @returns {boolean} True if the link is likely content-relevant
 */
function isContentLink(anchor) {
    // Check if the link is likely a citation or reference
    const isCitation = (
        anchor.classList.contains('reference') ||
        anchor.classList.contains('citation') ||
        anchor.hasAttribute('data-cite') ||
        /\[\d+\]/.test(anchor.textContent) ||  // Common citation format [1]
        anchor.closest('.references, .citations, .footnotes') !== null
    );
    
    // Check if the link is within text content
    const isInlineLink = (
        anchor.parentElement &&
        anchor.parentElement.textContent.trim().length > anchor.textContent.trim().length * 2
    );
    
    // Check if it's a documentation or article link
    const isDocLink = (
        anchor.closest('p, li, td, th, dd, figcaption') !== null &&
        !anchor.closest('nav, header, footer, .navigation, .menu, .sidebar') &&
        anchor.textContent.trim().length > 0
    );
    
    return isCitation || isInlineLink || isDocLink;
}

/**
 * Checks if an element is visible in the DOM
 * Uses computed styles and element dimensions
 * 
 * @param {Element} element - The element to check
 * @returns {boolean} True if the element is visible
 */
function isVisibleElement(element) {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           element.offsetWidth > 0 &&
           element.offsetHeight > 0;
}

/**
 * Extracts visible text content from an element
 * Uses TreeWalker to get all text nodes
 * Filters out hidden text
 * 
 * @param {Element} element - The element to extract text from
 * @returns {string} The visible text content
 */
function getVisibleText(element) {
    // Get all text nodes
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );

    let text = '';
    while (walker.nextNode()) {
        const node = walker.currentNode;
        if (isVisibleElement(node.parentElement)) {
            text += node.textContent;
        }
    }
    return text;
}

/**
 * Validates URLs and filters out common resource/navigation links
 * Checks for valid protocols and excludes common non-content URLs
 * 
 * @param {string} url - The URL to validate
 * @returns {boolean} True if the URL is valid and content-relevant
 */
function isValidUrl(url) {
    try {
        const urlObj = new URL(url);
        // Only accept http/https protocols
        if (!urlObj.protocol.match(/^https?:$/)) {
            return false;
        }
        // Exclude common resource URLs and navigation links
        const excludePatterns = [
            /\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)(\?|$)/i,
            /^(javascript|mailto|tel):/i,
            /^#/,
            /^about:blank$/,
            /(login|signup|register|cart|checkout|account|profile|search)/i
        ];
        return !excludePatterns.some(pattern => pattern.test(url));
    } catch {
        return false;
    }
} 