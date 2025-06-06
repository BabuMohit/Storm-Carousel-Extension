# Popup Interface Documentation

## Overview
The main user interface for the Link Preview Carousel extension. Implements a responsive design with carousel navigation, link management, and preview controls.

## Structure

### Core Components

1. **Controls Container**
   - Search functionality
   - Link count selector
   - View all links button
   - Link names toggle
   - Jump buttons

2. **Carousel Container**
   - Preview display
   - Navigation buttons
   - Preview counter
   - Zoom controls

3. **Resize Handle**
   - Draggable interface
   - Width adjustment
   - Smooth transitions

## Implementation Details

### Search Interface
```html
<div class="search-container">
    <input type="text" id="searchInput" class="search-input">
    <div id="searchResults" class="search-results"></div>
</div>
```
- Real-time search results
- Dynamic dropdown
- Keyboard navigation

### Link Management
```html
<select class="filter-select" id="linkCount">
    <option value="5">5 Links (Default)</option>
    <option value="10">10 Links</option>
    <option value="all">View All</option>
    <option value="custom">Custom Number...</option>
</select>
```
- Flexible link count selection
- Custom count option
- Dynamic updating

### Preview Display
```html
<div class="carousel-container">
    <div id="carousel" class="carousel">
        <div class="loading">Loading page previews...</div>
    </div>
    <button class="nav-button prev">←</button>
    <button class="nav-button next">→</button>
</div>
```
- Smooth transitions
- Loading states
- Navigation controls

## Styling Considerations

### 1. Layout Management
- Flexbox for dynamic layouts
- Grid for structured components
- Responsive dimensions

### 2. Visual Feedback
- Hover states
- Active states
- Loading indicators

### 3. Performance Optimization
- Hardware acceleration
- Efficient transitions
- Memory management

## Common Issues and Solutions

### 1. Resize Handling
**Issue**: Preview distortion during resize
- **Cause**: Transform scale conflicts
- **Solution**: Reset transforms on resize
- **Prevention**: Separate scaling and resizing logic

### 2. Scroll Management
**Issue**: Scroll position lost on preview change
- **Cause**: DOM updates affecting scroll
- **Solution**: Preserve scroll position
- **Prevention**: Handle scroll events properly

### 3. Loading States
**Issue**: UI jumps during loading
- **Cause**: Dynamic content insertion
- **Solution**: Placeholder dimensions
- **Prevention**: Pre-calculate spaces

### 4. Zoom Functionality
**Issue**: Zoom controls interfering with navigation
- **Cause**: Event bubbling
- **Solution**: Event stopPropagation
- **Prevention**: Proper event handling

## CSS Best Practices

### 1. Layout Structure
```css
body {
    width: 800px;
    height: 600px;
    margin: 0;
    padding: 20px;
    min-width: 400px;
    max-width: 1200px;
}
```
- Constrained dimensions
- Proper spacing
- Responsive limits

### 2. Component Organization
```css
.carousel-container {
    position: relative;
    width: 100%;
    height: 500px;
    overflow: hidden;
}
```
- Logical grouping
- Clear hierarchy
- Maintainable structure

### 3. Interactive Elements
```css
.nav-button {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
}
```
- Accessible positioning
- Clear visibility
- Proper layering

## Implementation History

### Version 2.0
- Added search functionality
- Improved zoom controls
- Enhanced navigation
- Better error states

### Version 1.0
- Basic carousel
- Simple navigation
- Limited controls

## Testing Guidelines

### 1. Layout Testing
- Test different window sizes
- Verify responsive behavior
- Check overflow handling

### 2. Interaction Testing
- Verify all controls work
- Test keyboard navigation
- Check touch interactions

### 3. Performance Testing
- Monitor animation smoothness
- Check memory usage
- Verify event handling

## Accessibility Considerations

### 1. Keyboard Navigation
- Tab order
- Focus states
- Keyboard shortcuts

### 2. Visual Feedback
- Loading indicators
- Error states
- Success messages

### 3. Screen Readers
- ARIA labels
- Semantic HTML
- Descriptive text

## Browser Compatibility

### Supported Browsers
- Chrome 120+
- Chromium-based browsers
- Manifest V3 compatible

### Known Issues
- Popup closing behavior (Chrome limitation)
- Memory constraints
- CSP restrictions 