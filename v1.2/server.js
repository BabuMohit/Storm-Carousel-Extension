const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Root endpoint
app.get('/', (req, res) => {
    res.send('Screenshot service is running. Use /screenshot?url=YOUR_URL to capture screenshots.');
});

// Health check endpoint
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

// Screenshot endpoint
app.get('/screenshot', async (req, res) => {
    const url = req.query.url;
    if (!url) {
        return res.status(400).send('URL parameter required');
    }

    console.log(`Generating screenshot for: ${url}`);
    let browser = null;

    try {
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

        const page = await browser.newPage();
        
        // Set viewport size
        await page.setViewport({
            width: 1280,
            height: 800,
            deviceScaleFactor: 1,
        });

        // Set headers to look more like a real browser
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36');
        
        console.log(`Navigating to: ${url}`);
        // Navigate to the page with a longer timeout
        const response = await page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        if (!response.ok()) {
            throw new Error(`Failed to load page: ${response.status()} ${response.statusText()}`);
        }

        // Wait for any remaining network activity to settle
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('Taking screenshot...');
        // Take the screenshot
        const screenshot = await page.screenshot({
            fullPage: true,
            type: 'png'
        });

        console.log(`Screenshot generated successfully for: ${url}`);
        res.type('image/png').send(screenshot);

    } catch (error) {
        console.error(`Error generating screenshot for ${url}:`, error);
        res.status(500).send(`Failed to generate screenshot: ${error.message}`);
    } finally {
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

// Handle 404 errors
app.use((req, res) => {
    console.error(`404 - Not Found: ${req.method} ${req.url}`);
    res.status(404).send('Not Found');
});

// Handle other errors
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).send('Internal Server Error');
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Screenshot service running on http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop the server');
}); 