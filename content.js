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

// Function to get the background color of an element
function getBackgroundColor(element) {
  const style = window.getComputedStyle(element);
  let bgColor = style.backgroundColor;
  
  // If background is transparent, check parent
  if (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
    if (element.parentElement && element.parentElement !== document.body) {
      return getBackgroundColor(element.parentElement);
    }
    // Default to white if we can't find a background
    return 'rgb(255, 255, 255)';
  }
  
  return bgColor;
}

// Function to convert RGB string to RGB values
function rgbToValues(rgb) {
  const match = rgb.match(/\d+/g);
  if (match && match.length >= 3) {
    return {
      r: parseInt(match[0]),
      g: parseInt(match[1]),
      b: parseInt(match[2])
    };
  }
  return { r: 255, g: 255, b: 255 }; // Default to white
}

// Function to calculate relative luminance (for contrast calculation)
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Function to calculate contrast ratio between two colors
function getContrastRatio(color1, color2) {
  const lum1 = getLuminance(color1.r, color1.g, color1.b);
  const lum2 = getLuminance(color2.r, color2.g, color2.b);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Function to adjust color to achieve target contrast
function adjustColorForContrast(baseColor, bgColor, contrastMultiplier) {
  const bgLum = getLuminance(bgColor.r, bgColor.g, bgColor.b);
  const isLightBg = bgLum > 0.5;
  
  // Calculate adjustment factor (0.5 to 2.0 range)
  // Higher multiplier = more contrast = darker text on light bg, lighter text on dark bg
  const adjustment = (contrastMultiplier - 1) * 0.6; // Scale adjustment
  
  let r, g, b;
  
  if (isLightBg) {
    // For light backgrounds: make text darker as contrast increases
    const darkenFactor = Math.max(0, Math.min(1, adjustment));
    r = Math.max(0, Math.min(255, baseColor.r * (1 - darkenFactor)));
    g = Math.max(0, Math.min(255, baseColor.g * (1 - darkenFactor)));
    b = Math.max(0, Math.min(255, baseColor.b * (1 - darkenFactor)));
  } else {
    // For dark backgrounds: make text lighter as contrast increases
    const lightenFactor = Math.max(0, Math.min(1, adjustment));
    r = Math.max(0, Math.min(255, baseColor.r + (255 - baseColor.r) * lightenFactor));
    g = Math.max(0, Math.min(255, baseColor.g + (255 - baseColor.g) * lightenFactor));
    b = Math.max(0, Math.min(255, baseColor.b + (255 - baseColor.b) * lightenFactor));
  }
  
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

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
  if (settings.textSize) {
    const zoomValue = settings.textSize / 100;
    // Use CSS zoom on html element - simple and effective
    // This scales everything proportionally including text, images, and layout
    if (zoomValue !== 1) {
      css += `
        html {
          zoom: ${zoomValue} !important;
        }
      `;
    }
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
  
  // Apply contrast based on background color
  if (settings.contrast && settings.contrast !== 100) {
    // Get the current background color (either from custom background or page default)
    let bgColorStr;
    if (settings.backgroundColor && settings.backgroundColor !== 'default') {
      bgColorStr = colorMap[settings.backgroundColor];
    } else {
      // Detect the page's actual background color
      bgColorStr = getBackgroundColor(document.body);
    }
    
    const bgRgb = rgbToValues(bgColorStr);
    const contrastMultiplier = settings.contrast / 100;
    
    // Determine if background is light or dark
    const bgLum = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
    const isLightBg = bgLum > 0.5;
    
    // Calculate text color adjustments based on contrast slider
    // Higher contrast (slider > 100): darker text on light bg, lighter text on dark bg
    // Lower contrast (slider < 100): softer, closer to background
    
    if (isLightBg) {
      // Light background - adjust text to be darker (higher contrast) or softer (lower contrast)
      const baseDark = {r: 0, g: 0, b: 0}; // Black text base
      const adjustedColor = adjustColorForContrast(baseDark, bgRgb, contrastMultiplier);
      css += `
        body, p, div, span, h1, h2, h3, h4, h5, h6, li, td, th, label {
          color: ${adjustedColor} !important;
        }
        a {
          color: ${adjustColorForContrast({r: 0, g: 100, b: 200}, bgRgb, contrastMultiplier)} !important;
        }
      `;
    } else {
      // Dark background - adjust text to be lighter (higher contrast) or softer (lower contrast)
      const baseLight = {r: 255, g: 255, b: 255}; // White text base
      const adjustedColor = adjustColorForContrast(baseLight, bgRgb, contrastMultiplier);
      css += `
        body, p, div, span, h1, h2, h3, h4, h5, h6, li, td, th, label {
          color: ${adjustedColor} !important;
        }
        a {
          color: ${adjustColorForContrast({r: 100, g: 200, b: 255}, bgRgb, contrastMultiplier)} !important;
        }
      `;
    }
    
    // Also apply subtle filter for overall visual contrast
    const filterContrast = Math.max(0.7, Math.min(1.5, contrastMultiplier));
    css += `
      body {
        filter: contrast(${filterContrast}) !important;
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
  try {
    if (!isExtensionContextValid()) {
      sendResponse({ success: false, error: 'Extension context invalidated' });
      return false;
    }
    
    if (request.action === 'applySettings') {
      applySettings(request.settings);
      sendResponse({ success: true });
    } else if (request.action === 'removeStyles') {
      removeStyles();
      sendResponse({ success: true });
    }
    return true;
  } catch (error) {
    sendResponse({ success: false, error: error.message });
    return false;
  }
});

// Function to check if extension context is valid
function isExtensionContextValid() {
  try {
    return chrome.runtime && chrome.runtime.id;
  } catch (e) {
    return false;
  }
}

// Function to load and apply settings
function loadAndApplySettings() {
  if (!isExtensionContextValid()) {
    // Extension context invalidated, page needs refresh
    return;
  }
  
  try {
    chrome.storage.local.get(['textSize', 'backgroundColor', 'contrast'], (result) => {
      if (!isExtensionContextValid()) return;
      applySettings({
        textSize: result.textSize || 100,
        backgroundColor: result.backgroundColor || 'default',
        contrast: result.contrast || 100
      });
    });
  } catch (error) {
    // Extension context invalidated - ignore silently
    console.log('Octheia: Extension context invalidated. Please refresh the page.');
  }
}

// Apply settings when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadAndApplySettings);
} else {
  // DOM is already ready
  loadAndApplySettings();
}

// Also apply on page load (for full page reloads)
window.addEventListener('load', loadAndApplySettings);

// Reapply settings when page visibility changes (for SPA navigation)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    loadAndApplySettings();
  }
});
