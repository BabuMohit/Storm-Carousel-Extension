# Package Configuration Documentation

## Overview
Node.js package configuration for the screenshot service. Defines dependencies and scripts for the server component of the Link Preview Carousel extension.

## Implementation Details

### Package Structure
```json
{
  "name": "screenshot-service",
  "version": "1.0.0",
  "description": "Screenshot service for Chrome extension",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.17.1",
    "puppeteer": "^22.8.2",
    "cors": "^2.8.5"
  }
}
```

### Core Dependencies

1. **Express.js** (^4.17.1)
   - Web server framework
   - Route handling
   - Middleware support
   - Error management

2. **Puppeteer** (^22.8.2)
   - Headless Chrome automation
   - Screenshot capture
   - Page navigation
   - DOM manipulation

3. **CORS** (^2.8.5)
   - Cross-origin resource sharing
   - Security middleware
   - Request validation

## Common Issues and Solutions

### 1. Dependency Conflicts
**Issue**: Version incompatibilities
- **Cause**: Mismatched versions
- **Solution**: Lock versions
- **Prevention**: Version management

### 2. Installation Failures
**Issue**: npm install errors
- **Cause**: Network/permission issues
- **Solution**: Clear cache, retry
- **Prevention**: Network check

### 3. Puppeteer Issues
**Issue**: Chrome binary problems
- **Cause**: Missing dependencies
- **Solution**: Install prerequisites
- **Prevention**: System check

### 4. Express Configuration
**Issue**: Server startup fails
- **Cause**: Port conflicts
- **Solution**: Configure port
- **Prevention**: Environment check

## Best Practices

### 1. Version Management
- Use exact versions
- Regular updates
- Security patches

### 2. Script Definition
- Clear naming
- Proper documentation
- Error handling

### 3. Dependency Management
- Minimal dependencies
- Regular audits
- Security checks

## Implementation History

### Version 2.0
- Updated Puppeteer
- Added CORS
- Better error handling

### Version 1.0
- Basic dependencies
- Simple configuration
- Limited scripts

## Testing Guidelines

### 1. Installation Testing
- Clean install
- Update testing
- Conflict checking

### 2. Dependency Testing
- Version compatibility
- Security vulnerabilities
- Performance impact

### 3. Script Testing
- Command execution
- Error scenarios
- Output validation

## Security Considerations

### 1. Dependency Security
- Regular audits
- Version updates
- Vulnerability checks

### 2. Script Safety
- Input validation
- Error handling
- Resource limits

### 3. Environment Security
- Configuration management
- Access control
- Resource isolation

## Performance Optimization

### 1. Installation Speed
- Package caching
- Parallel installation
- Minimal dependencies

### 2. Runtime Performance
- Efficient imports
- Resource management
- Memory optimization

### 3. Update Management
- Scheduled updates
- Version control
- Compatibility checks

## Known Limitations

1. **Puppeteer Dependencies**
   - Large installation size
   - System requirements
   - Memory usage

2. **Version Constraints**
   - Express compatibility
   - Node.js version requirements
   - System dependencies

3. **Platform Specifics**
   - Windows compatibility
   - Chrome requirements
   - Network dependencies

## Troubleshooting Guide

### Installation Issues
1. Clear npm cache
   ```bash
   npm cache clean --force
   ```

2. Remove node_modules
   ```bash
   rm -rf node_modules
   ```

3. Reinstall dependencies
   ```bash
   npm install
   ```

### Runtime Issues
1. Check port availability
2. Verify Chrome installation
3. Confirm network access

### Update Issues
1. Check version compatibility
2. Update dependencies gradually
3. Test after updates

## Development Setup

### Initial Setup
1. Install Node.js
2. Clone repository
3. Install dependencies

### Development Process
1. Check dependencies
2. Run tests
3. Start server

### Deployment Process
1. Update versions
2. Build package
3. Deploy service 