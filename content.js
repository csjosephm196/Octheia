// Content script to apply accessibility settings to web pages

let styleElement = null;

// Color mappings
const colorMap = {
  black: '#000000',
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
  
  // Hover zoom is handled separately via JavaScript event listeners
  
  // Determine background color to apply
  let bgColorToApply = null;
  let shouldOverrideDisplayMode = false;
  
  if (settings.customColor && settings.customColor !== '#ffffff' && settings.customColor !== '#000000') {
    // Custom color takes priority
    bgColorToApply = settings.customColor;
    shouldOverrideDisplayMode = true;
  } else if (settings.backgroundColor && settings.backgroundColor !== 'default') {
    // Use preset color
    bgColorToApply = colorMap[settings.backgroundColor] || colorMap.default;
    shouldOverrideDisplayMode = true;
  }
  
  // Apply display modes (only if background color is not explicitly set)
  if (settings.displayMode && !shouldOverrideDisplayMode) {
    if (settings.displayMode === 'light') {
      css += `
        html, body {
          background-color: #ffffff !important;
        }
        body {
          color: #000000 !important;
        }
        body * {
          background-color: inherit !important;
        }
        div, section, article, main, header, footer, aside, nav {
          background-color: #ffffff !important;
        }
        img, video, canvas, svg {
          background-color: transparent !important;
        }
      `;
    } else if (settings.displayMode === 'dark') {
      css += `
        html, body {
          background-color: #1a1a1a !important;
        }
        body {
          color: #e0e0e0 !important;
        }
        body * {
          background-color: inherit !important;
          color: inherit !important;
        }
        div, section, article, main, header, footer, aside, nav {
          background-color: #1a1a1a !important;
        }
        img, video, canvas, svg {
          background-color: transparent !important;
        }
        a {
          color: #4a9eff !important;
        }
      `;
    } else if (settings.displayMode === 'night') {
      // Night mode with blue light filter (warm colors)
      css += `
        html, body {
          background-color: #2a1f1a !important;
        }
        body {
          color: #f0e6d2 !important;
          filter: sepia(20%) saturate(120%) hue-rotate(350deg) brightness(0.95) !important;
        }
        body * {
          background-color: inherit !important;
          color: inherit !important;
        }
        div, section, article, main, header, footer, aside, nav {
          background-color: #2a1f1a !important;
        }
        img, video, canvas, svg {
          background-color: transparent !important;
          filter: sepia(20%) saturate(120%) hue-rotate(350deg) brightness(0.95) !important;
        }
        a {
          color: #ffb366 !important;
        }
      `;
    }
  }
  
  // Apply background color (overrides display mode if explicitly set)
  if (bgColorToApply && bgColorToApply !== 'transparent') {
    css += `
      html, body {
        background-color: ${bgColorToApply} !important;
      }
      body * {
        background-color: inherit !important;
      }
      div, section, article, main, header, footer, aside, nav {
        background-color: ${bgColorToApply} !important;
      }
      img, video, canvas, svg, iframe {
        background-color: transparent !important;
      }
    `;
  }
  
  // Apply contrast - ONLY affects text, images, and cursor, NOT background
  if (settings.contrast && settings.contrast !== 100) {
    // Get the current background color
    let bgColorStr;
    if (settings.displayMode === 'dark') {
      bgColorStr = 'rgb(26, 26, 26)';
    } else if (settings.displayMode === 'night') {
      bgColorStr = 'rgb(42, 31, 26)';
    } else if (settings.displayMode === 'light') {
      bgColorStr = 'rgb(255, 255, 255)';
    } else if (settings.customColor) {
      bgColorStr = settings.customColor;
    } else if (settings.backgroundColor && settings.backgroundColor !== 'default') {
      bgColorStr = colorMap[settings.backgroundColor];
    } else {
      bgColorStr = getBackgroundColor(document.body);
    }
    
    const bgRgb = rgbToValues(bgColorStr);
    const contrastMultiplier = settings.contrast / 100;
    
    // Determine if background is light or dark
    const bgLum = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
    const isLightBg = bgLum > 0.5;
    
    // Apply contrast to text only (not background)
    if (isLightBg) {
      const baseDark = {r: 0, g: 0, b: 0};
      const adjustedColor = adjustColorForContrast(baseDark, bgRgb, contrastMultiplier);
      css += `
        body, p, div, span, h1, h2, h3, h4, h5, h6, li, td, th, label, input, textarea, select, button {
          color: ${adjustedColor} !important;
        }
        a {
          color: ${adjustColorForContrast({r: 0, g: 100, b: 200}, bgRgb, contrastMultiplier)} !important;
        }
      `;
    } else {
      const baseLight = {r: 255, g: 255, b: 255};
      const adjustedColor = adjustColorForContrast(baseLight, bgRgb, contrastMultiplier);
      css += `
        body, p, div, span, h1, h2, h3, h4, h5, h6, li, td, th, label, input, textarea, select, button {
          color: ${adjustedColor} !important;
        }
        a {
          color: ${adjustColorForContrast({r: 100, g: 200, b: 255}, bgRgb, contrastMultiplier)} !important;
        }
      `;
    }
    
    // Apply contrast filter to images only (cursor handled separately if needed)
    const filterContrast = Math.max(0.7, Math.min(1.5, contrastMultiplier));
    css += `
      img, video, canvas, svg, iframe {
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
    chrome.storage.local.get(['backgroundColor', 'customColor', 'contrast', 'displayMode'], (result) => {
      if (!isExtensionContextValid()) return;
      applySettings({
        backgroundColor: result.backgroundColor || 'default',
        customColor: result.customColor,
        contrast: result.contrast || 100,
        displayMode: result.displayMode
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

// Listen for storage changes to update settings in real-time
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    loadAndApplySettings();
  }
});
