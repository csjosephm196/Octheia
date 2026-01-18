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
const logoImg = document.getElementById('logo');

// Set logo source using extension URL
if (logoImg) {
  logoImg.src = chrome.runtime.getURL('logo.png');
  // Handle logo load error gracefully
  logoImg.onerror = function() {
    this.style.display = 'none';
  };
}

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

// AI Optimizer - intelligently parses any prompt and optimizes settings
async function optimizeWithAI(command) {
  const lowerCommand = command.toLowerCase().trim();
  
  // Get current settings
  const currentSettings = await chrome.storage.local.get([
    'textSize', 'backgroundColor', 'customColor', 'contrast', 'displayMode'
  ]);
  
  let optimized = { 
    textSize: currentSettings.textSize || 100,
    backgroundColor: currentSettings.backgroundColor || 'default',
    customColor: currentSettings.customColor,
    contrast: currentSettings.contrast || 100,
    displayMode: currentSettings.displayMode || 'none'
  };
  
  let changes = [];
  
  // Extract numbers from command
  const numbers = lowerCommand.match(/\d+/g);
  const extractedNumbers = numbers ? numbers.map(n => parseInt(n)) : [];
  
  // Parse text size commands
  if (lowerCommand.match(/\b(text|font|size|zoom)\s*(size|zoom)?\s*(to|at|is|=)?\s*(\d+)/i)) {
    const match = lowerCommand.match(/(\d+)\s*(percent|%|px)?/i);
    if (match) {
      let size = parseInt(match[1]);
      if (size < 50) size = 50;
      if (size > 300) size = 300;
      optimized.textSize = size;
      changes.push(`Text size set to ${size}%`);
    }
  } else if (lowerCommand.includes('bigger') || lowerCommand.includes('larger') || 
             lowerCommand.includes('increase') || lowerCommand.includes('zoom in')) {
    const increment = extractedNumbers[0] || 20;
    optimized.textSize = Math.min(300, optimized.textSize + increment);
    changes.push(`Text size increased to ${optimized.textSize}%`);
  } else if (lowerCommand.includes('smaller') || lowerCommand.includes('decrease') || 
             lowerCommand.includes('zoom out')) {
    const decrement = extractedNumbers[0] || 20;
    optimized.textSize = Math.max(50, optimized.textSize - decrement);
    changes.push(`Text size decreased to ${optimized.textSize}%`);
  }
  
  // Parse contrast commands
  if (lowerCommand.match(/\b(contrast)\s*(to|at|is|=)?\s*(\d+)/i)) {
    const match = lowerCommand.match(/(\d+)\s*(percent|%)?/i);
    if (match) {
      let contrast = parseInt(match[1]);
      if (contrast < 50) contrast = 50;
      if (contrast > 200) contrast = 200;
      optimized.contrast = contrast;
      changes.push(`Contrast set to ${contrast}%`);
    }
  } else if (lowerCommand.includes('high contrast') || lowerCommand.includes('more contrast') ||
             lowerCommand.includes('increase contrast') || lowerCommand.includes('stronger contrast')) {
    optimized.contrast = Math.min(200, optimized.contrast + (extractedNumbers[0] || 30));
    changes.push(`Contrast increased to ${optimized.contrast}%`);
  } else if (lowerCommand.includes('low contrast') || lowerCommand.includes('less contrast') ||
             lowerCommand.includes('decrease contrast') || lowerCommand.includes('softer contrast')) {
    optimized.contrast = Math.max(50, optimized.contrast - (extractedNumbers[0] || 30));
    changes.push(`Contrast decreased to ${optimized.contrast}%`);
  }
  
  // Parse background color commands
  const colorKeywords = {
    'black': 'black', 'dark': 'black',
    'white': 'white', 'light': 'white',
    'cream': 'cream', 'beige': 'cream',
    'yellow': 'yellow',
    'blue': 'blue',
    'green': 'green',
    'default': 'default', 'original': 'default', 'normal': 'default'
  };
  
  for (const [keyword, color] of Object.entries(colorKeywords)) {
    if (lowerCommand.includes(`background ${keyword}`) || 
        lowerCommand.includes(`${keyword} background`) ||
        (lowerCommand.includes('background') && lowerCommand.includes(keyword))) {
      optimized.backgroundColor = color;
      optimized.customColor = null;
      changes.push(`Background set to ${color}`);
      break;
    }
  }
  
  // Parse display mode commands
  if (lowerCommand.includes('light mode') || lowerCommand.includes('lightmode')) {
    optimized.displayMode = 'light';
    changes.push('Light mode enabled');
  } else if (lowerCommand.includes('dark mode') || lowerCommand.includes('darkmode')) {
    optimized.displayMode = 'dark';
    changes.push('Dark mode enabled');
  } else if (lowerCommand.includes('night mode') || lowerCommand.includes('nightmode') ||
             lowerCommand.includes('night light') || lowerCommand.includes('blue light')) {
    optimized.displayMode = 'night';
    changes.push('Night mode enabled');
  } else if (lowerCommand.includes('disable') && lowerCommand.includes('mode')) {
    optimized.displayMode = 'none';
    changes.push('Display mode disabled');
  }
  
  // Parse semantic commands (pretty, readable, comfortable, etc.)
  if (lowerCommand.includes('pretty') || lowerCommand.includes('beautiful') || 
      lowerCommand.includes('nice') || lowerCommand.includes('aesthetic')) {
    optimized.contrast = 120;
    optimized.textSize = Math.max(100, Math.min(120, optimized.textSize));
    changes.push('Optimized for visual appeal');
  }
  
  if (lowerCommand.includes('readable') || lowerCommand.includes('read') ||
      lowerCommand.includes('clear') || lowerCommand.includes('sharp')) {
    optimized.contrast = Math.max(optimized.contrast, 140);
    optimized.textSize = Math.max(optimized.textSize, 110);
    changes.push('Optimized for readability');
  }
  
  if (lowerCommand.includes('comfortable') || lowerCommand.includes('comfort') ||
      lowerCommand.includes('easy') || lowerCommand.includes('gentle')) {
    optimized.contrast = Math.min(optimized.contrast, 115);
    optimized.textSize = Math.max(100, Math.min(110, optimized.textSize));
    changes.push('Optimized for comfort');
  }
  
  if (lowerCommand.includes('bright') || lowerCommand.includes('brighter')) {
    optimized.backgroundColor = 'white';
    optimized.contrast = Math.max(optimized.contrast, 110);
    changes.push('Brightened display');
  }
  
  if (lowerCommand.includes('dim') || lowerCommand.includes('darker')) {
    optimized.backgroundColor = 'black';
    optimized.contrast = Math.max(optimized.contrast, 110);
    changes.push('Dimmed display');
  }
  
  // Apply optimized settings
  await chrome.storage.local.set(optimized);
  
  // Update UI
  if (optimized.textSize !== undefined) {
    textSizeSlider.value = optimized.textSize;
    textSizeValue.textContent = optimized.textSize + '%';
  }
  if (optimized.contrast !== undefined) {
    contrastSlider.value = optimized.contrast;
    contrastValue.textContent = optimized.contrast + '%';
  }
  if (optimized.backgroundColor) {
    backgroundColorButtons.forEach(btn => {
      if (btn.dataset.color === optimized.backgroundColor) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
  if (optimized.displayMode) {
    [lightModeBtn, darkModeBtn, nightModeBtn].forEach(btn => {
      if (btn.dataset.mode === optimized.displayMode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
  
  // Save and apply
  await saveSettings();
  
  // Show status with changes
  if (changes.length > 0) {
    showStatus(changes.join(', '));
  } else {
    showStatus('Settings optimized!');
  }
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
