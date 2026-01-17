// Get DOM elements
const textSizeSlider = document.getElementById('textSize');
const textSizeValue = document.getElementById('textSizeValue');
const textSizeSmall = document.getElementById('textSizeSmall');
const textSizeMedium = document.getElementById('textSizeMedium');
const textSizeLarge = document.getElementById('textSizeLarge');
const textSizeReset = document.getElementById('textSizeReset');

const backgroundColorButtons = document.querySelectorAll('.color-btn');
const customColorPicker = document.getElementById('customColorPicker');

const contrastSlider = document.getElementById('contrast');
const contrastValue = document.getElementById('contrastValue');
const contrastLow = document.getElementById('contrastLow');
const contrastNormal = document.getElementById('contrastNormal');
const contrastHigh = document.getElementById('contrastHigh');
const contrastReset = document.getElementById('contrastReset');

const lightModeBtn = document.getElementById('lightMode');
const darkModeBtn = document.getElementById('darkMode');
const nightModeBtn = document.getElementById('nightMode');

const aiCommandInput = document.getElementById('aiCommand');
const aiOptimizeBtn = document.getElementById('aiOptimizeBtn');

const resetAllBtn = document.getElementById('resetAll');
const statusDiv = document.getElementById('status');

// Load saved settings
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get([
      'textSize', 'backgroundColor', 'customColor', 'contrast', 
      'displayMode', 'aiOptimized'
    ]);
    
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
    
    if (result.customColor) {
      customColorPicker.value = result.customColor;
    }
    
    if (result.contrast) {
      contrastSlider.value = result.contrast;
      contrastValue.textContent = result.contrast + '%';
    }
    
    if (result.displayMode) {
      [lightModeBtn, darkModeBtn, nightModeBtn].forEach(btn => {
        if (btn.dataset.mode === result.displayMode) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }
  } catch (error) {
    console.error('Octheia: Could not load settings', error);
  }
}

// Save settings
async function saveSettings() {
  const activeColorBtn = document.querySelector('.color-btn.active');
  const settings = {
    textSize: parseInt(textSizeSlider.value),
    backgroundColor: activeColorBtn?.dataset.color || 'default',
    customColor: customColorPicker.value,
    contrast: parseInt(contrastSlider.value),
    displayMode: document.querySelector('.btn-mode.active')?.dataset.mode || 'none'
  };
  
  try {
    await chrome.storage.local.set(settings);
  } catch (error) {
    if (error.message && error.message.includes('Extension context invalidated')) {
      showStatus('Please reload the extension');
      return;
    }
    throw error;
  }
  
  // Apply settings to current tab
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
      try {
        await chrome.tabs.sendMessage(tab.id, { action: 'applySettings', settings });
        showStatus('Settings applied!');
      } catch (error) {
        if (error.message && error.message.includes('Extension context invalidated')) {
          showStatus('Please refresh the page');
        } else {
          showStatus('Settings saved (refresh page to apply)');
        }
      }
    } else {
      showStatus('Settings saved!');
    }
  } catch (error) {
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

// AI Optimizer - interprets natural language and optimizes settings
async function optimizeWithAI(command) {
  const lowerCommand = command.toLowerCase();
  
  // Get current settings
  const currentSettings = await chrome.storage.local.get([
    'textSize', 'backgroundColor', 'contrast', 'displayMode'
  ]);
  
  let optimized = { ...currentSettings };
  
  // Parse commands
  if (lowerCommand.includes('pretty') || lowerCommand.includes('beautiful') || 
      lowerCommand.includes('nice') || lowerCommand.includes('aesthetic')) {
    // Optimize for visual appeal
    optimized.contrast = 120; // Slightly higher contrast
    optimized.textSize = Math.max(100, Math.min(120, currentSettings.textSize || 100));
    showStatus('Optimized for visual appeal!');
  } else if (lowerCommand.includes('readable') || lowerCommand.includes('read')) {
    // Optimize for readability
    optimized.contrast = 150;
    optimized.textSize = Math.max(120, currentSettings.textSize || 100);
    showStatus('Optimized for readability!');
  } else if (lowerCommand.includes('comfortable') || lowerCommand.includes('comfort')) {
    // Optimize for comfort
    optimized.contrast = 110;
    optimized.textSize = Math.max(100, Math.min(110, currentSettings.textSize || 100));
    showStatus('Optimized for comfort!');
  } else if (lowerCommand.includes('high contrast') || lowerCommand.includes('highcontrast')) {
    optimized.contrast = 180;
    showStatus('High contrast applied!');
  } else if (lowerCommand.includes('low contrast') || lowerCommand.includes('lowcontrast')) {
    optimized.contrast = 80;
    showStatus('Low contrast applied!');
  } else if (lowerCommand.includes('bigger') || lowerCommand.includes('larger')) {
    optimized.textSize = Math.min(200, (currentSettings.textSize || 100) + 20);
    showStatus('Text size increased!');
  } else if (lowerCommand.includes('smaller')) {
    optimized.textSize = Math.max(80, (currentSettings.textSize || 100) - 20);
    showStatus('Text size decreased!');
  } else {
    showStatus('AI optimization applied!');
  }
  
  // Apply optimized settings
  await chrome.storage.local.set(optimized);
  
  // Update UI
  if (optimized.textSize) {
    textSizeSlider.value = optimized.textSize;
    textSizeValue.textContent = optimized.textSize + '%';
  }
  if (optimized.contrast) {
    contrastSlider.value = optimized.contrast;
    contrastValue.textContent = optimized.contrast + '%';
  }
  
  // Save and apply
  await saveSettings();
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
    customColorPicker.value = '#ffffff'; // Reset custom picker
    saveSettings();
  });
});

// Custom color picker
customColorPicker.addEventListener('change', (e) => {
  backgroundColorButtons.forEach(b => b.classList.remove('active'));
  saveSettings();
});

customColorPicker.addEventListener('input', (e) => {
  backgroundColorButtons.forEach(b => b.classList.remove('active'));
  saveSettings();
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

// Display mode controls
[lightModeBtn, darkModeBtn, nightModeBtn].forEach(btn => {
  btn.addEventListener('click', () => {
    [lightModeBtn, darkModeBtn, nightModeBtn].forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    saveSettings();
  });
});

// AI Optimizer
aiOptimizeBtn.addEventListener('click', async () => {
  const command = aiCommandInput.value.trim();
  if (command) {
    await optimizeWithAI(command);
    aiCommandInput.value = '';
  } else {
    showStatus('Please enter a command');
  }
});

aiCommandInput.addEventListener('keypress', async (e) => {
  if (e.key === 'Enter') {
    const command = aiCommandInput.value.trim();
    if (command) {
      await optimizeWithAI(command);
      aiCommandInput.value = '';
    }
  }
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
  customColorPicker.value = '#ffffff';
  [lightModeBtn, darkModeBtn, nightModeBtn].forEach(btn => btn.classList.remove('active'));
  
  await chrome.storage.local.clear();
  saveSettings();
  showStatus('All settings reset!');
});

// Initialize
loadSettings();
