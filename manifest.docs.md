# Chrome Extension Manifest Documentation

## Overview
Configuration file that defines the extension's properties, permissions, and behavior.
Version 2.0 implements improved link detection and UI features.

## Implementation Details

### Manifest Version
- Uses Manifest V3 for improved security and performance
- Required for modern Chrome extensions
- Enables better resource management

### Permissions
1. `activeTab`
   - Required for accessing current tab content
   - More secure than broad host permissions
   - Automatically granted by users

2. `scripting`
   - Required for executing content scripts
   - Needed for link detection
   - Enables dynamic script injection

3. `tabs`
   - Required for tab manipulation
   - Enables background tab opening
   - Needed for URL validation

4. `storage`
   - Required for caching screenshots
   - Uses session storage for temporary data
   - Manages cache lifecycle

### Host Permissions
1. `http://localhost:5000/*`
   - Required for screenshot service
   - Local server communication
   - Restricted to localhost for security

2. `<all_urls>`
   - Required for accessing link targets
   - Needed for screenshot generation
   - Enables universal functionality

### Content Scripts
- Runs at `document_end`
- Ensures page is fully loaded
- Reliable link detection timing

### Content Security Policy
```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self'; connect-src 'self' http://localhost:5000"
}
```
- Restricts resource loading
- Prevents XSS attacks
- Allows localhost connection

## Common Issues and Solutions

### 1. Content Security Policy (CSP) Restrictions
**Issue**: Extension fails to connect to screenshot service
- **Cause**: Default CSP blocks external connections
- **Solution**: Add localhost to connect-src
- **Prevention**: Always check CSP when adding features

### 2. Permission Issues
**Issue**: Extension can't access page content
- **Cause**: Missing or incorrect permissions
- **Solution**: Request minimal required permissions
- **Prevention**: Test on various page contexts

### 3. Content Script Timing
**Issue**: Links not detected on some pages
- **Cause**: Script runs too early
- **Solution**: Use document_end timing
- **Prevention**: Handle dynamic content loading

### 4. Storage Limitations
**Issue**: Cache fails to save
- **Cause**: Storage quota exceeded
- **Solution**: Implement cache cleanup
- **Prevention**: Monitor storage usage

## Implementation History

### Version 2.0
- Improved link detection
- Added screenshot caching
- Enhanced error handling
- Better UI/UX features

### Version 1.0
- Basic screenshot functionality
- Simple link detection
- Limited error handling

## Best Practices

1. **Permission Management**
   - Request minimal permissions
   - Use activeTab when possible
   - Explain permission usage to users

2. **Security**
   - Strict CSP implementation
   - Local screenshot service
   - Sanitized URL handling

3. **Performance**
   - Efficient content script injection
   - Optimized permission usage
   - Smart caching strategy

## Testing Guidelines

1. **Permission Testing**
   - Test on various websites
   - Verify all features work
   - Check error handling

2. **Security Testing**
   - Validate CSP effectiveness
   - Test URL sanitization
   - Verify secure communication

3. **Performance Testing**
   - Monitor memory usage
   - Check loading times
   - Verify caching efficiency 