// Content script to apply accessibility settings to web pages

let styleElement = null;

// Color mappings
const colorMap = {
  white: '#ffffff',
  cream: '#f5f5dc',
  yellow: '#ffffcc',
  blue: '#e6f3ff',
  green: '#e6ffe6',
  default: 'transparent'
};

// Apply settings to the page
function applySettings(settings) {
  // Remove existing style element if present
  if (styleElement) {
    styleElement.remove();
  }
  
  // Create new style element
  styleElement = document.createElement('style');
  styleElement.id = 'octheia-accessibility-styles';
  
  let css = '';
  
  // Apply text size
  if (settings.textSize && settings.textSize !== 100) {
    const multiplier = settings.textSize / 100;
    css += `
      body, body * {
        font-size: calc(1em * ${multiplier}) !important;
      }
    `;
  }
  
  // Apply background color
  if (settings.backgroundColor && settings.backgroundColor !== 'default') {
    const bgColor = colorMap[settings.backgroundColor] || colorMap.default;
    css += `
      body {
        background-color: ${bgColor} !important;
      }
      body * {
        background-color: inherit !important;
      }
      img, video, canvas, svg {
        background-color: transparent !important;
      }
    `;
  }
  
  // Apply contrast
  if (settings.contrast && settings.contrast !== 100) {
    const contrastValue = settings.contrast / 100;
    css += `
      body, body * {
        filter: contrast(${contrastValue}) !important;
      }
    `;
  }
  
  styleElement.textContent = css;
  document.head.appendChild(styleElement);
}

// Remove all styles
function removeStyles() {
  if (styleElement) {
    styleElement.remove();
    styleElement = null;
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'applySettings') {
    applySettings(request.settings);
    sendResponse({ success: true });
  } else if (request.action === 'removeStyles') {
    removeStyles();
    sendResponse({ success: true });
  }
  return true;
});

// Load and apply saved settings on page load
chrome.storage.local.get(['textSize', 'backgroundColor', 'contrast'], (result) => {
  if (result.textSize || result.backgroundColor || result.contrast) {
    applySettings({
      textSize: result.textSize || 100,
      backgroundColor: result.backgroundColor || 'default',
      contrast: result.contrast || 100
    });
  }
});

// Reapply settings when page visibility changes (for SPA navigation)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    chrome.storage.local.get(['textSize', 'backgroundColor', 'contrast'], (result) => {
      if (result.textSize || result.backgroundColor || result.contrast) {
        applySettings({
          textSize: result.textSize || 100,
          backgroundColor: result.backgroundColor || 'default',
          contrast: result.contrast || 100
        });
      }
    });
  }
});
