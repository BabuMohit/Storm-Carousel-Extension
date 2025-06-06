# Link Preview Carousel Chrome Extension

## Project Overview
A Chrome extension that enhances webpage navigation by providing visual previews of referenced links in a carousel format. Version 2.0 focuses on academic and informational links, similar to Wikipedia references.

## File Structure

### Core Files
- `manifest.json` - Extension configuration
- `popup.html` - Extension UI layout
- `popup.js` - UI logic and screenshot management
- `content.js` - Link detection and page analysis
- `server.js` - Screenshot service backend
- `run_server.bat` - Server startup script
- `package.json` - Node.js dependencies

### Documentation Files
- `manifest.docs.md` - Manifest configuration details
- `popup.docs.md` - UI implementation notes
- `server.docs.md` - Backend service documentation
- `package.docs.md` - Dependency management guide
- `run_server.docs.md` - Server startup documentation

### Implementation Details

#### Version 2.0 Features
1. **Link Detection**
   - Focus on academic/informational links
   - Filtering of navigational/functional links
   - Smart reference detection

2. **UI Enhancements**
   - Search functionality
   - Link name/number toggle
   - Zoom controls
   - Responsive preview sizing

3. **Performance Improvements**
   - Screenshot caching
   - Optimized link processing
   - Better error handling

#### Known Issues and Workarounds

1. **Extension Popup Behavior**
   - Issue: Popup closes on external clicks
   - Status: Chrome limitation, cannot be fixed
   - Workaround: Background tab opening

2. **Screenshot Generation**
   - Issue: Memory usage with many links
   - Status: Partially resolved
   - Solution: Link count limiting

3. **Zoom Functionality**
   - Issue: Preview distortion at extremes
   - Status: Fixed in v2.0
   - Solution: Constrained zoom limits

#### Skipped Errors/Acceptable Issues

1. **Content Script**
   - Console warnings about content script timing
   - Non-critical CSP violations for some sites
   - Dynamic content detection limitations

2. **Server**
   - Non-fatal Puppeteer warnings
   - Temporary file cleanup delays
   - Memory usage warnings

3. **UI**
   - Minor layout shifts during loading
   - Carousel transition edge cases
   - Font rendering inconsistencies

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- Chrome browser
- Windows OS (for batch script)

### Installation Steps
1. Clone repository
2. Run `npm install`
3. Load extension in Chrome
4. Start server with `run_server.bat`

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

## Error Handling

### Common Errors
1. Server connection failures
2. Screenshot generation issues
3. Link detection problems
4. Cache management errors

### Troubleshooting
1. Check server status
2. Clear extension cache
3. Reload the page
4. Check console logs

## Performance Considerations

### Memory Management
- Screenshot cleanup
- Cache size limits
- Resource monitoring

### Processing Optimization
- Link batch processing
- Efficient DOM traversal
- Smart caching strategy

## Security Notes

### Implementation Security
- Local screenshot service
- Sanitized URL handling
- CSP implementation

### Data Privacy
- No data collection
- Local storage only
- Secure communication

## Future Improvements

### Planned Features
1. Multi-browser support
2. Enhanced caching
3. Better error recovery
4. UI customization

### Known Limitations
1. Single-browser support
2. Windows dependency
3. Memory constraints

## Contributing

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

## Version History

### v2.0 (Current)
- Academic link focus
- Enhanced UI
- Better performance
- Improved stability

### v1.0
- Basic functionality
- Simple UI
- Limited features
- Core implementation

## Support

### Getting Help
1. Check documentation
2. Review error logs
3. Submit issues
4. Contact support

### Reporting Issues
1. Provide reproduction steps
2. Include error messages
3. Specify environment
4. Add screenshots 