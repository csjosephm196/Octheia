// Get DOM elements
const textSizeSlider = document.getElementById('textSize');
const textSizeValue = document.getElementById('textSizeValue');
const textSizeSmall = document.getElementById('textSizeSmall');
const textSizeMedium = document.getElementById('textSizeMedium');
const textSizeLarge = document.getElementById('textSizeLarge');
const textSizeReset = document.getElementById('textSizeReset');

const backgroundColorButtons = document.querySelectorAll('.color-btn');

const contrastSlider = document.getElementById('contrast');
const contrastValue = document.getElementById('contrastValue');
const contrastLow = document.getElementById('contrastLow');
const contrastNormal = document.getElementById('contrastNormal');
const contrastHigh = document.getElementById('contrastHigh');
const contrastReset = document.getElementById('contrastReset');

const resetAllBtn = document.getElementById('resetAll');
const statusDiv = document.getElementById('status');

// Load saved settings
async function loadSettings() {
  const result = await chrome.storage.local.get(['textSize', 'backgroundColor', 'contrast']);
  
  if (result.textSize) {
    textSizeSlider.value = result.textSize;
    textSizeValue.textContent = result.textSize + '%';
  }
  
  if (result.backgroundColor) {
    backgroundColorButtons.forEach(btn => {
      if (btn.dataset.color === result.backgroundColor) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
  
  if (result.contrast) {
    contrastSlider.value = result.contrast;
    contrastValue.textContent = result.contrast + '%';
  }
}

// Save settings
async function saveSettings() {
  const settings = {
    textSize: parseInt(textSizeSlider.value),
    backgroundColor: document.querySelector('.color-btn.active')?.dataset.color || 'default',
    contrast: parseInt(contrastSlider.value)
  };
  
  await chrome.storage.local.set(settings);
  
  // Apply settings to current tab
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Check if we can inject into this tab (not chrome:// pages)
    if (tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
      try {
        await chrome.tabs.sendMessage(tab.id, { action: 'applySettings', settings });
        showStatus('Settings applied!');
      } catch (error) {
        // Content script might not be ready yet, but settings are saved
        // They will be applied when the page loads or refreshes
        showStatus('Settings saved (refresh page to apply)');
      }
    } else {
      showStatus('Settings saved!');
    }
  } catch (error) {
    // Settings are still saved, just can't apply to current tab
    showStatus('Settings saved!');
  }
}

// Show status message
function showStatus(message) {
  statusDiv.textContent = message;
  statusDiv.classList.add('show');
  setTimeout(() => {
    statusDiv.classList.remove('show');
  }, 2000);
}

// Text size controls
textSizeSlider.addEventListener('input', (e) => {
  textSizeValue.textContent = e.target.value + '%';
  saveSettings();
});

textSizeSmall.addEventListener('click', () => {
  textSizeSlider.value = 75;
  textSizeValue.textContent = '75%';
  saveSettings();
});

textSizeMedium.addEventListener('click', () => {
  textSizeSlider.value = 100;
  textSizeValue.textContent = '100%';
  saveSettings();
});

textSizeLarge.addEventListener('click', () => {
  textSizeSlider.value = 150;
  textSizeValue.textContent = '150%';
  saveSettings();
});

textSizeReset.addEventListener('click', () => {
  textSizeSlider.value = 100;
  textSizeValue.textContent = '100%';
  saveSettings();
});

// Background color controls
backgroundColorButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    backgroundColorButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    saveSettings();
  });
});

// Contrast controls
contrastSlider.addEventListener('input', (e) => {
  contrastValue.textContent = e.target.value + '%';
  saveSettings();
});

contrastLow.addEventListener('click', () => {
  contrastSlider.value = 75;
  contrastValue.textContent = '75%';
  saveSettings();
});

contrastNormal.addEventListener('click', () => {
  contrastSlider.value = 100;
  contrastValue.textContent = '100%';
  saveSettings();
});

contrastHigh.addEventListener('click', () => {
  contrastSlider.value = 150;
  contrastValue.textContent = '150%';
  saveSettings();
});

contrastReset.addEventListener('click', () => {
  contrastSlider.value = 100;
  contrastValue.textContent = '100%';
  saveSettings();
});

// Reset all
resetAllBtn.addEventListener('click', async () => {
  textSizeSlider.value = 100;
  textSizeValue.textContent = '100%';
  contrastSlider.value = 100;
  contrastValue.textContent = '100%';
  backgroundColorButtons.forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.color === 'default') {
      btn.classList.add('active');
    }
  });
  
  await chrome.storage.local.clear();
  saveSettings();
  showStatus('All settings reset!');
});

// Initialize
loadSettings();
