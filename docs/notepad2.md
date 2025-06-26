# 3D Page Flip Animation Reference

## Animation Design Reference
Based on: https://aurachat.io/share/43LFJ96

## CSS 3D Page Flip Implementation

### Core Concepts
1. **3D Transform Setup**
   - Use `perspective` for depth effect
   - Apply `transform-style: preserve-3d` on container
   - Use `rotateY` for page flip effect

2. **Page Structure**
   ```css
   .page-container {
     perspective: 2000px;
     position: relative;
     width: 100%;
     height: 100%;
   }

   .page {
     position: absolute;
     width: 100%;
     height: 100%;
     transform-style: preserve-3d;
     transition: transform 0.6s cubic-bezier(0.645, 0.045, 0.355, 1);
     transform-origin: left center;
   }

   .page-front,
   .page-back {
     position: absolute;
     width: 100%;
     height: 100%;
     backface-visibility: hidden;
   }

   .page-back {
     transform: rotateY(180deg);
   }
   ```

3. **Flip Animation States**
   ```css
   /* Default state - showing front */
   .page {
     transform: rotateY(0deg);
   }

   /* Flipped state - showing back */
   .page.flipped {
     transform: rotateY(-180deg);
   }

   /* Active flip animation */
   .page.flipping {
     z-index: 10;
     box-shadow: 
       0 10px 40px rgba(0, 0, 0, 0.3),
       -10px 0 20px rgba(0, 0, 0, 0.1);
   }
   ```

4. **Enhanced Effects**
   - **Shadows**: Dynamic shadows during flip
   - **Gradient overlays**: Simulate lighting changes
   - **Scale effects**: Slight scaling during animation
   - **Blur effects**: Depth of field simulation

5. **Multi-page Book Effect**
   ```css
   .book {
     position: relative;
     transform-style: preserve-3d;
     perspective: 2000px;
   }

   .page-stack {
     position: absolute;
     transform-style: preserve-3d;
   }

   /* Stacking offset for thickness effect */
   .page:nth-child(1) { z-index: 7; }
   .page:nth-child(2) { z-index: 6; transform: translateZ(-1px); }
   .page:nth-child(3) { z-index: 5; transform: translateZ(-2px); }
   /* ... and so on */
   ```

6. **Performance Optimizations**
   - Use `will-change: transform` on animating elements
   - Hardware acceleration with `transform: translateZ(0)`
   - Avoid animating width/height, use transform scale instead

## Implementation Notes for NewPennine

### Widget Structure
- Container: Full analysis widget area (left side)
- Pages: 7 chart pages with front/back faces
- Navigation: Bottom page indicators + arrow buttons

### Animation Triggers
1. Click on page indicators
2. Arrow key navigation
3. Swipe gestures (touch devices)
4. Auto-play mode (optional)

### Responsive Considerations
- Adjust perspective based on viewport width
- Simplify animation on mobile devices
- Provide fallback for browsers without 3D support

### Accessibility
- Maintain keyboard navigation
- ARIA labels for page status
- Reduced motion option
- Clear focus indicators