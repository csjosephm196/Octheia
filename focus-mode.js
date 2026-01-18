// Focus Mode - Screen Masking Feature
// Dims the screen except for a bright area around the cursor

let focusModeEnabled = false;
let focusOverlay = null;
let maskRadius = 150; // Radius of the bright area around cursor

function createFocusOverlay() {
  if (focusOverlay) {
    focusOverlay.remove();
  }
  
  focusOverlay = document.createElement('div');
  focusOverlay.id = 'octheia-focus-overlay';
  focusOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: radial-gradient(circle ${maskRadius}px at 0px 0px, transparent 0%, rgba(0, 0, 0, 0.85) 100%);
    pointer-events: none;
    z-index: 999998;
    transition: background 0.1s ease-out;
  `;
  document.body.appendChild(focusOverlay);
}

function updateFocusMask(x, y) {
  if (!focusOverlay || !focusModeEnabled) return;
  
  // Update the radial gradient to center on cursor
  focusOverlay.style.background = `radial-gradient(circle ${maskRadius}px at ${x}px ${y}px, transparent 0%, rgba(0, 0, 0, 0.85) 100%)`;
}

function handleFocusMouseMove(event) {
  if (!focusModeEnabled) return;
  updateFocusMask(event.clientX, event.clientY);
}

function initializeFocusMode(enabled) {
  focusModeEnabled = enabled;
  
  if (enabled) {
    createFocusOverlay();
    document.addEventListener('mousemove', handleFocusMouseMove, { passive: true });
    // Initialize at current mouse position if available
    updateFocusMask(window.innerWidth / 2, window.innerHeight / 2);
  } else {
    if (focusOverlay) {
      focusOverlay.remove();
      focusOverlay = null;
    }
    document.removeEventListener('mousemove', handleFocusMouseMove);
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
    if (areaName === 'local' && changes.focusModeEnabled) {
      try {
        chrome.storage.local.get(['focusModeEnabled'], (result) => {
          initializeFocusMode(result.focusModeEnabled || false);
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
        chrome.storage.local.get(['focusModeEnabled'], (result) => {
          initializeFocusMode(result.focusModeEnabled || false);
        });
      } catch (e) {
        console.error('Octheia: Error accessing storage', e);
      }
    });
  } else {
    try {
      chrome.storage.local.get(['focusModeEnabled'], (result) => {
        initializeFocusMode(result.focusModeEnabled || false);
      });
    } catch (e) {
      console.error('Octheia: Error accessing storage', e);
    }
  }
}
