/**
 * Screenshot Service Server
 * 
 * A Node.js Express server that provides screenshot generation services using Puppeteer.
 * This service is designed to work with the Link Preview Carousel Chrome extension.
 * 
 * Key Features:
 * - Full-page screenshot generation
 * - Health monitoring
 * - Error handling and logging
 * - Cookie banner handling
 * - Dynamic content support
 */

const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());

// Middleware for request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

/**
 * Root endpoint
 * Provides basic service information
 */
app.get('/', (req, res) => {
    res.send('Screenshot service is running. Use /screenshot?url=YOUR_URL to capture screenshots.');
});

/**
 * Health Check Endpoint
 * Verifies that both the server and Puppeteer are functioning correctly
 * Tests browser launch capabilities without taking screenshots
 * 
 * @returns {string} Service status message
 * @throws {Error} If Puppeteer fails to launch
 */
app.get('/health', async (req, res) => {
    try {
        const browser = await puppeteer.launch({
            headless: "new",
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });
        await browser.close();
        res.send('Service is running and Puppeteer is working');
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(500).send(`Service is running but Puppeteer failed: ${error.message}`);
    }
});

/**
 * Screenshot Generation Endpoint
 * Captures full-page screenshots of the provided URL
 * 
 * Features:
 * - Full page capture
 * - Cookie banner handling
 * - Dynamic content waiting
 * - Error handling for various scenarios
 * 
 * @param {string} url - The URL to capture (passed as query parameter)
 * @returns {Buffer} PNG screenshot data
 * @throws {Error} Various error types with descriptive messages
 */
app.get('/screenshot', async (req, res) => {
    const url = req.query.url;
    if (!url) {
        console.error('No URL provided');
        return res.status(400).send('URL parameter required');
    }

    console.log(`\nGenerating screenshot for: ${url}`);
    console.log('Time:', new Date().toISOString());
    let browser = null;

    try {
        // Launch browser with optimized settings
        console.log('Launching browser...');
        browser = await puppeteer.launch({
            headless: "new",
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--window-size=1280,800'
            ]
        });
        console.log('Browser launched successfully');

        const page = await browser.newPage();
        console.log('New page created');
        
        // Configure viewport for consistent screenshots
        await page.setViewport({
            width: 1280,
            height: 800,
            deviceScaleFactor: 1,
        });
        console.log('Viewport set');

        // Set realistic browser headers
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36');
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        });
        console.log('Browser headers set');
        
        console.log(`Navigating to: ${url}`);
        
        // Handle page navigation with specific error cases
        try {
            const response = await page.goto(url, {
                waitUntil: 'networkidle0',
                timeout: 30000
            });
            console.log('Page loaded');

            if (!response.ok()) {
                throw new Error(`HTTP ${response.status()} - ${response.statusText()}`);
            }
        } catch (navigationError) {
            console.error('Navigation error:', navigationError);
            // Provide specific error messages for common issues
            if (navigationError.message.includes('net::ERR_CONNECTION_TIMED_OUT')) {
                throw new Error('Page load timed out');
            } else if (navigationError.message.includes('net::ERR_NAME_NOT_RESOLVED')) {
                throw new Error('Could not resolve website address');
            } else if (navigationError.message.includes('net::ERR_CONNECTION_REFUSED')) {
                throw new Error('Connection refused by website');
            } else {
                throw navigationError;
            }
        }

        // Wait for dynamic content
        console.log('Waiting for content to settle...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Handle cookie banners and popups
        try {
            console.log('Attempting to handle cookie banners...');
            await page.evaluate(() => {
                const selectors = [
                    'button[id*="cookie"][id*="accept"]',
                    'button[class*="cookie"][class*="accept"]',
                    'button[id*="consent"]',
                    'button[class*="consent"]',
                    'a[id*="cookie"][id*="accept"]',
                    'a[class*="cookie"][class*="accept"]'
                ];
                
                selectors.forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => el.click());
                });
            });
        } catch (e) {
            console.log('No cookie banners found or could not dismiss');
        }

        // Wait for network activity to settle
        try {
            await page.waitForNetworkIdle({ idleTime: 1000 });
            console.log('Network is idle');
        } catch (e) {
            console.log('Network idle timeout - proceeding with screenshot');
        }

        // Capture the screenshot
        console.log('Taking screenshot...');
        const screenshot = await page.screenshot({
            fullPage: true,
            type: 'png',
            omitBackground: true
        });
        console.log('Screenshot captured successfully');

        console.log(`Screenshot generated successfully for: ${url}`);
        res.type('image/png').send(screenshot);

    } catch (error) {
        // Detailed error logging
        console.error(`\nError generating screenshot for ${url}:`);
        console.error('Error type:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).send(`Failed to generate screenshot: ${error.message}`);
    } finally {
        // Ensure browser cleanup
        if (browser) {
            try {
                await browser.close();
                console.log('Browser closed successfully');
            } catch (error) {
                console.error('Error closing browser:', error);
            }
        }
    }
});

// 404 Error Handler
app.use((req, res) => {
    console.error(`404 - Not Found: ${req.method} ${req.url}`);
    res.status(404).send('Not Found');
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).send('Internal Server Error');
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Screenshot service running on http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop the server');
}); 