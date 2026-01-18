// Hover Zoom functionality for Octheia
// This script handles smooth hover-to-zoom with cursor lock and region lock modes

let hoverZoomEnabled = false;
let zoomMagnification = 2.0; // 200% default
let zoomMode = 'none'; // 'none', 'cursor', 'region'
let hoveredElement = null;
let regionSelection = null;
let rafId = null;

// Smooth zoom using requestAnimationFrame for jitter-free performance
function applyZoomToElement(element, scale, centerX, centerY) {
  if (!element) return;
  
  // Cancel previous animation frame if any
  if (rafId) {
    cancelAnimationFrame(rafId);
  }
  
  const rect = element.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Calculate where the element will be after zoom
  const scaledWidth = rect.width * scale;
  const scaledHeight = rect.height * scale;
  
  // Calculate the offset from original position
  const offsetX = (scaledWidth - rect.width) * (centerX / rect.width);
  const offsetY = (scaledHeight - rect.height) * (centerY / rect.height);
  
  // Calculate new position after zoom
  const newLeft = rect.left - offsetX;
  const newTop = rect.top - offsetY;
  const newRight = newLeft + scaledWidth;
  const newBottom = newTop + scaledHeight;
  
  // Adjust transform origin to keep element within viewport
  let adjustedCenterX = centerX;
  let adjustedCenterY = centerY;
  
  // If element would overflow right, adjust origin left
  if (newRight > viewportWidth) {
    const overflow = newRight - viewportWidth;
    adjustedCenterX = Math.max(0, centerX - (overflow / (scale - 1)));
  }
  
  // If element would overflow left, adjust origin right
  if (newLeft < 0) {
    const overflow = Math.abs(newLeft);
    adjustedCenterX = Math.min(rect.width, centerX + (overflow / (scale - 1)));
  }
  
  // If element would overflow bottom, adjust origin up
  if (newBottom > viewportHeight) {
    const overflow = newBottom - viewportHeight;
    adjustedCenterY = Math.max(0, centerY - (overflow / (scale - 1)));
  }
  
  // If element would overflow top, adjust origin down
  if (newTop < 0) {
    const overflow = Math.abs(newTop);
    adjustedCenterY = Math.min(rect.height, centerY + (overflow / (scale - 1)));
  }
  
  // Ensure the zoomed element stays within bounds using CSS
  element.style.transition = 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)';
  element.style.transformOrigin = `${adjustedCenterX}px ${adjustedCenterY}px`;
  element.style.zIndex = '999998'; // Ensure it's above other content
  element.style.position = 'relative'; // Help with stacking context
  
  rafId = requestAnimationFrame(() => {
    element.style.transform = `scale(${scale})`;
    element.style.willChange = 'transform'; // Optimize for smooth performance
  });
}

function removeZoomFromElement(element) {
  if (!element) return;
  
  if (rafId) {
    cancelAnimationFrame(rafId);
  }
  
  rafId = requestAnimationFrame(() => {
    element.style.transition = 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)';
    element.style.transform = 'scale(1)';
    element.style.willChange = 'auto';
    element.style.zIndex = '';
    element.style.position = '';
  });
}

// Check if element contains text or is a text element
function isTextElement(element) {
  if (!element) return false;
  
  // Skip non-text elements
  const tagName = element.tagName?.toLowerCase();
  if (['img', 'video', 'canvas', 'svg', 'iframe', 'embed', 'object', 'input', 'button', 'select', 'textarea'].includes(tagName)) {
    return false;
  }
  
  // Skip if element is body, html, or script/style
  if (element === document.body || element === document.documentElement || 
      tagName === 'script' || tagName === 'style') {
    return false;
  }
  
  // Check if element has text content
  const text = element.textContent?.trim() || '';
  
  // Check if element or its children have text nodes
  if (text.length > 0) {
    // Make sure it's actual text, not just whitespace or structure
    const hasRealText = /[a-zA-Z0-9]/.test(text);
    if (hasRealText) {
      return true;
    }
  }
  
  // Check for text nodes in children
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  let node;
  while (node = walker.nextNode()) {
    if (node.textContent?.trim().length > 0 && /[a-zA-Z0-9]/.test(node.textContent)) {
      return true;
    }
  }
  
  return false;
}

// Get text element at point (closest parent with text)
function getTextElementAtPoint(x, y) {
  let element = document.elementFromPoint(x, y);
  
  // Walk up the DOM tree to find the best text-containing element
  while (element && element !== document.body && element !== document.documentElement) {
    if (isTextElement(element)) {
      return element;
    }
    element = element.parentElement;
  }
  
  return null;
}

// Handle mouse move for cursor lock mode
function handleMouseMove(event) {
  if (!hoverZoomEnabled || zoomMode !== 'cursor') return;
  
  const x = event.clientX;
  const y = event.clientY;
  
  // Find text element under cursor
  const element = getTextElementAtPoint(x, y);
  
  if (element && element !== hoveredElement) {
    // Remove zoom from previous element
    if (hoveredElement) {
      removeZoomFromElement(hoveredElement);
      hoveredElement = null;
    }
    
    // Apply zoom to text element at cursor position
    if (element) {
      const rect = element.getBoundingClientRect();
      const centerX = x - rect.left;
      const centerY = y - rect.top;
      
      applyZoomToElement(element, zoomMagnification, centerX, centerY);
      hoveredElement = element;
    }
  } else if (!element && hoveredElement) {
    // No text element at cursor, remove zoom
    removeZoomFromElement(hoveredElement);
    hoveredElement = null;
  }
}

// Handle mouse out for cursor lock mode
function handleMouseOut(event) {
  if (!hoverZoomEnabled || zoomMode !== 'cursor') return;
  
  // Always remove zoom when mouse leaves the document
  if (hoveredElement) {
    removeZoomFromElement(hoveredElement);
    hoveredElement = null;
  }
}

// Handle mouse enter for hover mode (default)
function handleMouseEnter(event) {
  if (!hoverZoomEnabled || zoomMode !== 'none') return;
  
  const element = event.target;
  
  // Only zoom text elements
  if (!isTextElement(element)) return;
  
  const rect = element.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  
  applyZoomToElement(element, zoomMagnification, centerX, centerY);
}

// Handle mouse leave for hover mode
function handleMouseLeave(event) {
  if (!hoverZoomEnabled || zoomMode !== 'none') return;
  
  const element = event.target;
  removeZoomFromElement(element);
}

// Region lock mode - select region on click and drag
let isSelectingRegion = false;
let regionStartX = 0;
let regionStartY = 0;
let regionOverlay = null;

function createRegionOverlay() {
  if (regionOverlay) {
    regionOverlay.remove();
  }
  
  regionOverlay = document.createElement('div');
  regionOverlay.id = 'octheia-region-overlay';
  regionOverlay.style.cssText = `
    position: fixed;
    border: 3px solid rgba(102, 126, 234, 0.8);
    background: rgba(102, 126, 234, 0.15);
    backdrop-filter: blur(1px);
    box-shadow: 0 0 10px rgba(102, 126, 234, 0.3);
    pointer-events: none;
    z-index: 999999;
    display: none;
    transition: none;
  `;
  document.body.appendChild(regionOverlay);
}

function handleRegionMouseDown(event) {
  if (!hoverZoomEnabled || zoomMode !== 'region') return;
  
  isSelectingRegion = true;
  regionStartX = event.clientX;
  regionStartY = event.clientY;
  
  if (!regionOverlay) {
    createRegionOverlay();
  }
  
  regionOverlay.style.display = 'block';
  regionOverlay.style.left = regionStartX + 'px';
  regionOverlay.style.top = regionStartY + 'px';
  regionOverlay.style.width = '0px';
  regionOverlay.style.height = '0px';
  
  event.preventDefault();
}

function handleRegionMouseMove(event) {
  if (!hoverZoomEnabled || zoomMode !== 'region' || !isSelectingRegion) return;
  
  const currentX = event.clientX;
  const currentY = event.clientY;
  
  const left = Math.min(regionStartX, currentX);
  const top = Math.min(regionStartY, currentY);
  const width = Math.abs(currentX - regionStartX);
  const height = Math.abs(currentY - regionStartY);
  
  regionOverlay.style.left = left + 'px';
  regionOverlay.style.top = top + 'px';
  regionOverlay.style.width = width + 'px';
  regionOverlay.style.height = height + 'px';
}

function handleRegionMouseUp(event) {
  if (!hoverZoomEnabled || zoomMode !== 'region' || !isSelectingRegion) return;
  
  isSelectingRegion = false;
  
  if (regionOverlay) {
    regionOverlay.style.display = 'none';
  }
  
  const endX = event.clientX;
  const endY = event.clientY;
  
  const left = Math.min(regionStartX, endX);
  const top = Math.min(regionStartY, endY);
  const right = Math.max(regionStartX, endX);
  const bottom = Math.max(regionStartY, endY);
  const centerX = (left + right) / 2;
  const centerY = (top + bottom) / 2;
  
  // Clear previous region selection
  if (regionSelection) {
    removeZoomFromElement(regionSelection);
    regionSelection = null;
  }
  
  // Find text element in the center of selected region
  const element = getTextElementAtPoint(centerX, centerY);
  
  if (element && isTextElement(element)) {
    const rect = element.getBoundingClientRect();
    const elementCenterX = rect.width / 2;
    const elementCenterY = rect.height / 2;
    
    applyZoomToElement(element, zoomMagnification, elementCenterX, elementCenterY);
    regionSelection = element;
  }
  
  event.preventDefault();
}

// Handle keyboard events to undo region selection
function handleKeyDown(event) {
  // Escape key to undo region selection zoom
  if (event.key === 'Escape' && hoverZoomEnabled && zoomMode === 'region' && regionSelection) {
    removeZoomFromElement(regionSelection);
    regionSelection = null;
    event.preventDefault();
  }
}

// Initialize hover zoom
function initializeHoverZoom(settings) {
  const enabled = settings.hoverZoomEnabled || false;
  const mag = (settings.zoomMagnification || 200) / 100;
  const mode = settings.zoomMode || 'none';
  
  // Clean up previous setup
  cleanupHoverZoom();
  
  if (!enabled) {
    return;
  }
  
  hoverZoomEnabled = enabled;
  zoomMagnification = mag;
  zoomMode = mode;
  
  // Add keyboard listener for Escape key (always active when zoom is enabled)
  document.addEventListener('keydown', handleKeyDown, { passive: false });
  
  if (mode === 'cursor') {
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseout', handleMouseOut, { passive: true });
  } else if (mode === 'region') {
    document.addEventListener('mousedown', handleRegionMouseDown, { passive: false });
    document.addEventListener('mousemove', handleRegionMouseMove, { passive: true });
    document.addEventListener('mouseup', handleRegionMouseUp, { passive: false });
    createRegionOverlay();
  } else {
    // Default hover mode - zoom on hover
    document.addEventListener('mouseenter', handleMouseEnter, { passive: true, capture: true });
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true, capture: true });
  }
}

// Cleanup hover zoom
function cleanupHoverZoom() {
  hoverZoomEnabled = false;
  
  // Remove all event listeners
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseout', handleMouseOut);
  document.removeEventListener('mouseenter', handleMouseEnter, { capture: true });
  document.removeEventListener('mouseleave', handleMouseLeave, { capture: true });
  document.removeEventListener('mousedown', handleRegionMouseDown);
  document.removeEventListener('mousemove', handleRegionMouseMove);
  document.removeEventListener('mouseup', handleRegionMouseUp);
  document.removeEventListener('keydown', handleKeyDown);
  
  // Reset zoom on all elements
  if (hoveredElement) {
    removeZoomFromElement(hoveredElement);
    hoveredElement = null;
  }
  
  if (regionSelection) {
    removeZoomFromElement(regionSelection);
    regionSelection = null;
  }
  
  if (regionOverlay) {
    regionOverlay.remove();
    regionOverlay = null;
  }
  
  // Cancel any pending animation frames
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

// Listen for settings changes
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && (changes.hoverZoomEnabled || changes.zoomMagnification || changes.zoomMode)) {
    chrome.storage.local.get(['hoverZoomEnabled', 'zoomMagnification', 'zoomMode'], (result) => {
      initializeHoverZoom({
        hoverZoomEnabled: result.hoverZoomEnabled || false,
        zoomMagnification: result.zoomMagnification || 200,
        zoomMode: result.zoomMode || 'none'
      });
    });
  }
});

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['hoverZoomEnabled', 'zoomMagnification', 'zoomMode'], (result) => {
      initializeHoverZoom(result);
    });
  });
} else {
  chrome.storage.local.get(['hoverZoomEnabled', 'zoomMagnification', 'zoomMode'], (result) => {
    initializeHoverZoom(result);
  });
}
