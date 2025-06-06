# Link Preview Carousel Chrome Extension - Complete Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [File Structure](#file-structure)
3. [Implementation Details](#implementation-details)
4. [Error Handling](#error-handling)
5. [Setup and Installation](#setup-and-installation)
6. [Usage Guide](#usage-guide)
7. [Security and Performance](#security-and-performance)
8. [Version History](#version-history)
9. [Support and Contributing](#support-and-contributing)

## Project Overview
A Chrome extension that enhances webpage navigation by providing visual previews of referenced links in a carousel format. Version 2.0 focuses on academic and informational links, similar to Wikipedia references.

### Core Components
1. Screenshot Service (Node.js backend)
2. Chrome Extension (Frontend)
3. Link Detection System
4. Caching Mechanism

### Key Features
1. Academic/Reference Link Detection
2. Visual Link Previews
3. Screenshot Caching
4. Advanced UI Controls

## File Structure

### Core Files
1. **manifest.json**
   - Extension configuration
   - Manifest V3 implementation
   - Permission definitions
   - Security policies

2. **popup.html/js**
   - Extension UI layout
   - Carousel implementation
   - Event handling
   - User interactions

3. **content.js**
   - Link detection
   - Page analysis
   - Content filtering
   - URL validation

4. **server.js**
   - Screenshot service
   - Puppeteer implementation
   - Error handling
   - Resource management

5. **package.json**
   - Dependencies:
     - express: ^4.17.1
     - puppeteer: ^22.8.2
     - cors: ^2.8.5

6. **run_server.bat**
   - Server startup script
   - Dependency checks
   - Error handling
   - Process management

## Implementation Details

### 1. Link Detection System

#### Academic Link Detection
\`\`\`javascript
function isAcademicLink(anchor) {
  const patterns = {
    citations: /\[\d+\]|\[cite\]|reference/i,
    footnotes: /^(?:\d+|[a-z])\.?\s|footnote/i,
    academic: /doi|arxiv|isbn|pmid|scholar/i
  };
  
  return Object.values(patterns).some(pattern => 
    pattern.test(anchor.textContent) || 
    pattern.test(anchor.href)
  );
}
\`\`\`

#### Link Filtering
\`\`\`javascript
function filterLinks(links) {
  return links.filter(link => {
    if (isNavigationLink(link)) return false;
    if (isSocialMediaLink(link)) return false;
    if (isAcademicLink(link)) return true;
    return isInformationalLink(link);
  });
}
\`\`\`

### 2. Screenshot Service

#### Puppeteer Configuration
\`\`\`javascript
const browser = await puppeteer.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu'
  ],
  defaultViewport: {
    width: 1920,
    height: 1080
  }
});
\`\`\`

### 3. Caching System

#### Session Storage Implementation
\`\`\`javascript
class CacheManager {
  static async set(url, screenshot) {
    const key = this.getCacheKey(url);
    try {
      await chrome.storage.session.set({
        [key]: {
          data: screenshot,
          timestamp: Date.now()
        }
      });
    } catch (error) {
      console.error('Cache set failed:', error);
    }
  }

  static async get(url) {
    const key = this.getCacheKey(url);
    try {
      const result = await chrome.storage.session.get(key);
      return result[key]?.data;
    } catch (error) {
      console.error('Cache get failed:', error);
      return null;
    }
  }
}
\`\`\`

## Error Handling

### Critical Errors

1. **Server Connection**
\`\`\`javascript
async function checkServerHealth() {
  try {
    const response = await fetch('http://localhost:5000/health');
    return response.ok;
  } catch (error) {
    showError('Server connection failed');
    return false;
  }
}
\`\`\`

2. **Screenshot Generation**
\`\`\`javascript
app.get('/screenshot', async (req, res) => {
  try {
    // Screenshot logic
  } catch (error) {
    console.error('Screenshot failed:', error);
    res.status(500).send('Failed to generate screenshot');
  }
});
\`\`\`

### Non-Critical Errors

1. **Link Detection**
   - Dynamic content changes
   - Invalid URLs
   - Hidden elements

2. **UI Updates**
   - Animation glitches
   - Style inconsistencies
   - Layout shifts

### Skipped/Ignored Errors

1. **Console Warnings**
   - Content script timing warnings
   - Non-critical CSP violations
   - Resource usage warnings

2. **Puppeteer Warnings**
   - Protocol timeout warnings
   - Network idle warnings
   - Resource cleanup delays

## Setup and Installation

### Prerequisites
- Node.js (v14+)
- Chrome browser
- Windows OS

### Installation Steps
1. Clone repository
2. Run \`npm install\`
3. Load extension in Chrome
4. Start server with \`run_server.bat\`

### Development Setup
1. Enable Chrome developer mode
2. Load unpacked extension
3. Monitor console for errors
4. Use Chrome DevTools

## Usage Guide

### Basic Usage
1. Click extension icon
2. Wait for link detection
3. Navigate previews
4. Use zoom controls

### Advanced Features
1. Search functionality
2. Link filtering
3. Custom preview counts
4. Background tab opening

## Security and Performance

### Security Measures
1. Local server only
2. URL validation
3. Content filtering
4. Error sanitization

### Performance Metrics
- Average load time: 1-2s
- Memory usage: 100-200MB
- Cache size: 50-100MB

### Browser Compatibility
- Chrome 120+ required
- Manifest V3 compatible
- ES2021+ features used

## Version History

### Version 2.0 (Current)
- Academic link focus
- Enhanced UI
- Better performance
- Improved stability

### Version 1.0
- Basic functionality
- Simple UI
- Limited features
- Core implementation

## Support and Contributing

### Getting Help
1. Check documentation
2. Review error logs
3. Submit issues
4. Contact support

### Development Guidelines
1. Follow code style
2. Document changes
3. Test thoroughly
4. Update docs

### Testing Requirements
1. Multiple page types
2. Error conditions
3. Performance impact
4. Security implications

## Known Issues and Workarounds

### 1. Extension Popup Behavior
- Issue: Popup closes on external clicks
- Status: Chrome limitation, cannot be fixed
- Workaround: Background tab opening

### 2. Screenshot Generation
- Issue: Memory usage with many links
- Status: Partially resolved
- Solution: Link count limiting

### 3. Zoom Functionality
- Issue: Preview distortion at extremes
- Status: Fixed in v2.0
- Solution: Constrained zoom limits

## Future Improvements

### Planned Features
1. Multi-browser support
2. Enhanced caching
3. Better error recovery
4. UI customization

### Security Enhancements
1. Enhanced CSP
2. URL sanitization
3. Rate limiting
4. Access control

### Performance Optimization
1. Lazy loading
2. Image compression
3. Memory cleanup
4. Cache optimization 