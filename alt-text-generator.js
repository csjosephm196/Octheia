// Alt-Text Generator for Images
// Uses region selection to select images and generate descriptions

let altTextModeEnabled = false;
let isSelectingImage = false;
let selectionStartX = 0;
let selectionStartY = 0;
let selectionOverlay = null;
let selectedImage = null;

// Simple image description generator (lightweight, no external API needed)
// In a real implementation, you'd use an AI API like OpenAI, Google Vision, etc.
async function generateImageDescription(image) {
  // For now, extract basic information from the image
  const alt = image.alt || '';
  const title = image.title || '';
  const src = image.src || '';
  
  // Extract filename as fallback
  const filename = src.split('/').pop().split('?')[0];
  
  // Try to infer from existing attributes
  if (alt && alt.trim().length > 0) {
    return alt;
  }
  
  if (title && title.trim().length > 0) {
    return title;
  }
  
  // Generate basic description from image properties
  const width = image.naturalWidth || image.width || 0;
  const height = image.naturalHeight || image.height || 0;
  const aspectRatio = width > 0 ? (height / width).toFixed(2) : 1;
  
  let description = `Image`;
  
  // Add size information
  if (width > 0 && height > 0) {
    description += ` (${width}x${height}px)`;
  }
  
  // Try to infer type from filename
  if (filename) {
    const lowerFilename = filename.toLowerCase();
    if (lowerFilename.includes('photo') || lowerFilename.includes('image') || lowerFilename.includes('img')) {
      description += ' - Photo';
    } else if (lowerFilename.includes('logo')) {
      description += ' - Logo';
    } else if (lowerFilename.includes('icon')) {
      description += ' - Icon';
    } else if (lowerFilename.includes('diagram') || lowerFilename.includes('chart')) {
      description += ' - Diagram';
    }
  }
  
  // For a real implementation, you would:
  // 1. Send image to an AI vision API (OpenAI, Google Vision, etc.)
  // 2. Get a detailed description
  // 3. Set it as the alt text
  
  return description;
}

function createSelectionOverlay() {
  if (selectionOverlay) {
    selectionOverlay.remove();
  }
  
  selectionOverlay = document.createElement('div');
  selectionOverlay.id = 'octheia-image-selection-overlay';
  selectionOverlay.style.cssText = `
    position: fixed;
    border: 3px solid #00ff00;
    background: rgba(0, 255, 0, 0.1);
    backdrop-filter: blur(1px);
    box-shadow: 0 0 15px rgba(0, 255, 0, 0.5);
    pointer-events: none;
    z-index: 999999;
    display: none;
    transition: none;
  `;
  document.body.appendChild(selectionOverlay);
}

function findImageInRegion(left, top, right, bottom) {
  const centerX = (left + right) / 2;
  const centerY = (top + bottom) / 2;
  
  // Find all images
  const images = document.querySelectorAll('img');
  
  for (let img of images) {
    const rect = img.getBoundingClientRect();
    
    // Check if image intersects with selection region
    if (rect.left <= right && rect.right >= left && 
        rect.top <= bottom && rect.bottom >= top) {
      return img;
    }
  }
  
  return null;
}

function handleImageSelectionMouseDown(event) {
  if (!altTextModeEnabled || isSelectingImage) return;
  
  isSelectingImage = true;
  selectionStartX = event.clientX;
  selectionStartY = event.clientY;
  
  if (!selectionOverlay) {
    createSelectionOverlay();
  }
  
  selectionOverlay.style.display = 'block';
  selectionOverlay.style.left = selectionStartX + 'px';
  selectionOverlay.style.top = selectionStartY + 'px';
  selectionOverlay.style.width = '0px';
  selectionOverlay.style.height = '0px';
  
  event.preventDefault();
}

function handleImageSelectionMouseMove(event) {
  if (!altTextModeEnabled || !isSelectingImage) return;
  
  const currentX = event.clientX;
  const currentY = event.clientY;
  
  const left = Math.min(selectionStartX, currentX);
  const top = Math.min(selectionStartY, currentY);
  const width = Math.abs(currentX - selectionStartX);
  const height = Math.abs(currentY - selectionStartY);
  
  selectionOverlay.style.left = left + 'px';
  selectionOverlay.style.top = top + 'px';
  selectionOverlay.style.width = width + 'px';
  selectionOverlay.style.height = height + 'px';
}

async function handleImageSelectionMouseUp(event) {
  if (!altTextModeEnabled || !isSelectingImage) return;
  
  isSelectingImage = false;
  
  if (selectionOverlay) {
    selectionOverlay.style.display = 'none';
  }
  
  const endX = event.clientX;
  const endY = event.clientY;
  
  const left = Math.min(selectionStartX, endX);
  const top = Math.min(selectionStartY, endY);
  const right = Math.max(selectionStartX, endX);
  const bottom = Math.max(selectionStartY, endY);
  
  // Find image in selected region
  const image = findImageInRegion(left, top, right, bottom);
  
  if (image) {
    selectedImage = image;
    
    // Show loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'octheia-alt-text-loading';
    loadingIndicator.textContent = 'Generating alt-text...';
    loadingIndicator.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 20px 30px;
      border-radius: 8px;
      z-index: 1000000;
      font-family: Arial, sans-serif;
      font-size: 14px;
    `;
    document.body.appendChild(loadingIndicator);
    
    try {
      // Generate alt-text description
      const description = await generateImageDescription(image);
      
      // Set the alt text
      image.alt = description;
      
      // Also set aria-label for screen readers
      image.setAttribute('aria-label', description);
      
      // Show success message
      loadingIndicator.textContent = `Alt-text added: "${description}"`;
      loadingIndicator.style.background = 'rgba(0, 200, 0, 0.9)';
      
      setTimeout(() => {
        loadingIndicator.remove();
      }, 3000);
      
    } catch (error) {
      loadingIndicator.textContent = 'Error generating alt-text';
      loadingIndicator.style.background = 'rgba(200, 0, 0, 0.9)';
      setTimeout(() => {
        loadingIndicator.remove();
      }, 2000);
    }
  }
  
  event.preventDefault();
}

function initializeAltTextMode(enabled) {
  altTextModeEnabled = enabled;
  
  if (enabled) {
    createSelectionOverlay();
    document.addEventListener('mousedown', handleImageSelectionMouseDown, { passive: false });
    document.addEventListener('mousemove', handleImageSelectionMouseMove, { passive: true });
    document.addEventListener('mouseup', handleImageSelectionMouseUp, { passive: false });
  } else {
    if (selectionOverlay) {
      selectionOverlay.remove();
      selectionOverlay = null;
    }
    document.removeEventListener('mousedown', handleImageSelectionMouseDown);
    document.removeEventListener('mousemove', handleImageSelectionMouseMove);
    document.removeEventListener('mouseup', handleImageSelectionMouseUp);
  }
}

// Check if extension context is valid
function isExtensionContextValid() {
  try {
    return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
  } catch (e) {
    return false;
  }
}

// Listen for settings changes
if (isExtensionContextValid()) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.altTextModeEnabled) {
      try {
        chrome.storage.local.get(['altTextModeEnabled'], (result) => {
          initializeAltTextMode(result.altTextModeEnabled || false);
        });
      } catch (e) {
        console.error('Octheia: Error accessing storage', e);
      }
    }
  });

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      try {
        chrome.storage.local.get(['altTextModeEnabled'], (result) => {
          initializeAltTextMode(result.altTextModeEnabled || false);
        });
      } catch (e) {
        console.error('Octheia: Error accessing storage', e);
      }
    });
  } else {
    try {
      chrome.storage.local.get(['altTextModeEnabled'], (result) => {
        initializeAltTextMode(result.altTextModeEnabled || false);
      });
    } catch (e) {
      console.error('Octheia: Error accessing storage', e);
    }
  }
}
