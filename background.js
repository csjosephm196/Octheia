// Background service worker for Octheia extension

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Octheia extension installed');
  
  // Set default settings
  chrome.storage.local.set({
    textSize: 100,
    backgroundColor: 'default',
    contrast: 100
  });
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSettings') {
    chrome.storage.local.get(['textSize', 'backgroundColor', 'contrast'], (result) => {
      sendResponse(result);
    });
    return true;
  }
});
