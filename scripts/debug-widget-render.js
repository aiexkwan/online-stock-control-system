// Debug script to check widget rendering in browser console
// Paste this in browser console after adding a widget

function debugWidgetRendering() {
  console.log('=== Widget Rendering Debug ===');
  
  // Check grid stack items
  const gridItems = document.querySelectorAll('.grid-stack-item');
  console.log(`Grid stack items: ${gridItems.length}`);
  
  gridItems.forEach((item, index) => {
    console.log(`\nWidget ${index + 1}:`);
    console.log(`  ID: ${item.getAttribute('gs-id')}`);
    console.log(`  Position: gs-x="${item.getAttribute('gs-x')}" gs-y="${item.getAttribute('gs-y')}"`);
    console.log(`  Size: gs-w="${item.getAttribute('gs-w')}" gs-h="${item.getAttribute('gs-h')}"`);
    
    // Check content structure
    const content = item.querySelector('.grid-stack-item-content');
    console.log(`  Has content container: ${content ? 'Yes' : 'No'}`);
    
    if (content) {
      console.log(`  Content children: ${content.children.length}`);
      Array.from(content.children).forEach((child, i) => {
        console.log(`    Child ${i + 1}: ${child.className || child.tagName}`);
      });
    }
    
    // Check for widget containers
    const widgetContainers = item.querySelectorAll('.widget-container');
    console.log(`  Widget containers: ${widgetContainers.length}`);
    
    // Check for duplicate React roots
    const reactRoots = item.querySelectorAll('[data-reactroot]');
    console.log(`  React roots: ${reactRoots.length}`);
  });
  
  // Check for orphaned elements
  const grid = document.querySelector('.grid-stack');
  if (grid) {
    const directChildren = Array.from(grid.children);
    const orphaned = directChildren.filter(child => 
      !child.classList.contains('grid-stack-item') && 
      !child.classList.contains('grid-stack-placeholder')
    );
    
    console.log(`\nOrphaned elements in grid: ${orphaned.length}`);
    orphaned.forEach((el, i) => {
      console.log(`  Orphan ${i + 1}: ${el.className || el.tagName}`);
    });
  }
  
  // Check React roots map
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('\nReact DevTools detected');
  }
  
  console.log('=== End Debug ===');
}

// Auto-run
debugWidgetRendering();

// Return function for manual re-run
debugWidgetRendering;