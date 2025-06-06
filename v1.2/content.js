// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getLinks") {
        try {
            console.log('Content script received getLinks request');
            
            // Get all anchor elements
            const allAnchors = document.querySelectorAll('a');
            console.log('Total anchor elements found:', allAnchors.length);
            
            // Get all links with their text content
            const allLinks = Array.from(allAnchors).map(link => {
                try {
                    // Get the link text, fallback to URL if text is empty
                    let text = link.textContent.trim();
                    if (!text) {
                        // Try to get text from child elements (e.g., images with alt text)
                        const img = link.querySelector('img');
                        if (img && img.alt) {
                            text = img.alt.trim();
                        }
                    }
                    
                    // Get the full URL, handle relative URLs
                    let url;
                    try {
                        url = new URL(link.href, window.location.href).href;
                    } catch (urlError) {
                        console.warn('Invalid URL:', link.href, urlError);
                        return null;
                    }
                    
                    return {
                        url: url,
                        text: text || url
                    };
                } catch (linkError) {
                    console.warn('Error processing link:', link, linkError);
                    return null;
                }
            }).filter(link => link !== null); // Remove failed links
            
            // Filter and clean up links
            const validLinks = allLinks.filter(({ url, text }) => {
                try {
                    // Accept both http and https links
                    const isValidProtocol = url.startsWith('http://') || url.startsWith('https://');
                    // Don't filter out same-domain links anymore
                    const isNotJavaScript = !url.startsWith('javascript:');
                    const isNotEmpty = url && text;
                    
                    const isValid = isValidProtocol && isNotJavaScript && isNotEmpty;
                    
                    if (!isValid) {
                        console.log('Filtered out link:', url, {
                            reason: !isValidProtocol ? 'not http/https' :
                                    !isNotJavaScript ? 'javascript link' :
                                    !isNotEmpty ? 'empty url or text' :
                                    'unknown'
                        });
                    } else {
                        console.log('Valid link found:', url);
                    }
                    
                    return isValid;
                } catch (filterError) {
                    console.warn('Error filtering link:', { url, text }, filterError);
                    return false;
                }
            });
            
            // Remove duplicates
            const uniqueLinks = Array.from(new Set(validLinks.map(link => link.url)))
                .map(url => validLinks.find(link => link.url === url));
            
            console.log('Final valid links:', uniqueLinks);
            console.log('Current page URL:', window.location.href);
            
            if (uniqueLinks.length === 0) {
                console.log('Warning: No valid links found on the page');
            } else {
                console.log(`Found ${uniqueLinks.length} valid unique links`);
            }
            
            sendResponse({ success: true, links: uniqueLinks });
        } catch (error) {
            console.error('Content script error:', error);
            sendResponse({ 
                success: false, 
                error: error.message,
                links: []
            });
        }
    }
    return true;
}); 