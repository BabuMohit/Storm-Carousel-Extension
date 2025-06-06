# Screenshot Service Startup Script Documentation

## Overview
Windows batch script for starting the screenshot service. Handles dependency installation and server startup in a user-friendly way.

## Implementation Details

### Script Structure
```batch
@echo off
echo Starting screenshot service...
npm install
node server.js
pause
```

### Components
1. `@echo off`
   - Suppresses command echoing
   - Cleaner output
   - Better user experience

2. `npm install`
   - Installs dependencies
   - Updates packages
   - Ensures requirements

3. `node server.js`
   - Starts screenshot service
   - Runs in foreground
   - Enables log visibility

4. `pause`
   - Keeps window open
   - Shows error messages
   - Prevents immediate closure

## Common Issues and Solutions

### 1. Node.js Not Found
**Issue**: 'node' is not recognized
- **Cause**: Node.js not installed/in PATH
- **Solution**: Install Node.js, add to PATH
- **Prevention**: Check prerequisites

### 2. Port Conflicts
**Issue**: Port 5000 already in use
- **Cause**: Another service using port
- **Solution**: Kill existing process
- **Prevention**: Check port availability

### 3. Permission Issues
**Issue**: Access denied errors
- **Cause**: Insufficient privileges
- **Solution**: Run as administrator
- **Prevention**: Check permissions

### 4. NPM Install Failures
**Issue**: Package installation fails
- **Cause**: Network/registry issues
- **Solution**: Clear npm cache, retry
- **Prevention**: Verify connection

## Best Practices

### 1. Error Handling
- Keep window open on error
- Show descriptive messages
- Enable manual closure

### 2. User Feedback
- Show startup progress
- Indicate service status
- Clear error messages

### 3. Process Management
- Single instance running
- Clean shutdown
- Resource cleanup

## Usage Instructions

### Starting the Service
1. Double-click `run_server.bat`
2. Wait for dependencies to install
3. Service starts automatically
4. Keep window open while using extension

### Stopping the Service
1. Press Ctrl+C in terminal
2. Confirm termination
3. Close window

### Troubleshooting
1. Check Node.js installation
2. Verify port availability
3. Run as administrator if needed
4. Check network connection

## Implementation History

### Version 2.0
- Added dependency check
- Improved error messages
- Better process management

### Version 1.0
- Basic server startup
- Manual dependency management
- Limited error handling

## Testing Guidelines

### 1. Installation Testing
- Fresh system setup
- Missing dependencies
- Network issues

### 2. Process Testing
- Multiple instances
- Port conflicts
- Permission issues

### 3. Error Testing
- Network failures
- Missing files
- Invalid configurations

## Security Considerations

### 1. Process Isolation
- Run as user
- Limited permissions
- Resource constraints

### 2. Network Security
- Localhost only
- Port restrictions
- Connection limits

### 3. Error Exposure
- Limited error details
- Safe error messages
- Log management

## Performance Optimization

### 1. Startup Speed
- Efficient dependency check
- Quick process launch
- Minimal overhead

### 2. Resource Usage
- Memory management
- CPU utilization
- Network bandwidth

### 3. Error Recovery
- Automatic retry
- Graceful shutdown
- State preservation

## Known Limitations

1. Windows-specific
   - Not compatible with other OS
   - Requires batch processing
   - CMD dependencies

2. Manual Startup
   - No auto-start option
   - Requires user interaction
   - Manual process management

3. Single Instance
   - One service per system
   - No load balancing
   - Port exclusivity 