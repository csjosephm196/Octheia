// Get DOM elements
const zoomMagnificationSlider = document.getElementById('zoomMagnification');
const zoomMagnificationValue = document.getElementById('zoomMagnificationValue');
const zoomModeCursorBtn = document.getElementById('zoomModeCursor');
const zoomModeRegionBtn = document.getElementById('zoomModeRegion');
const zoomDisableBtn = document.getElementById('zoomDisable');

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
      'hoverZoomEnabled', 'zoomMagnification', 'zoomMode', 'backgroundColor', 'customColor', 'contrast', 
      'displayMode', 'aiOptimized'
    ]);
    
    if (result.zoomMagnification || result.zoomMagnification === 0) {
      zoomMagnificationSlider.value = result.zoomMagnification || 200;
      zoomMagnificationValue.textContent = (result.zoomMagnification || 200) + '%';
    }
    
    // Set active zoom mode button
    if (result.zoomMode) {
      [zoomModeCursorBtn, zoomModeRegionBtn].forEach(btn => {
        if (btn && btn.dataset.mode === result.zoomMode) {
          btn.classList.add('active');
        } else if (btn) {
          btn.classList.remove('active');
        }
      });
    } else if (!result.hoverZoomEnabled && zoomDisableBtn) {
      zoomDisableBtn.classList.add('active');
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
  const activeZoomMode = document.querySelector('#zoomModeCursor.active') ? 'cursor' :
                         document.querySelector('#zoomModeRegion.active') ? 'region' : 'none';
  
  const settings = {
    hoverZoomEnabled: activeZoomMode !== 'none',
    zoomMagnification: parseInt(zoomMagnificationSlider.value),
    zoomMode: activeZoomMode,
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
    'hoverZoomEnabled', 'zoomMagnification', 'zoomMode', 
    'backgroundColor', 'customColor', 'contrast', 'displayMode', 'colorBlindnessType'
  ]);
  
  let optimized = { 
    hoverZoomEnabled: currentSettings.hoverZoomEnabled || false,
    zoomMagnification: currentSettings.zoomMagnification || 200,
    zoomMode: currentSettings.zoomMode || 'none',
    backgroundColor: currentSettings.backgroundColor || 'default',
    customColor: currentSettings.customColor,
    contrast: currentSettings.contrast || 100,
    displayMode: currentSettings.displayMode || 'none',
    colorBlindnessType: currentSettings.colorBlindnessType || null
  };
  
  let changes = [];
  
  // Extract numbers from command
  const numbers = lowerCommand.match(/\d+/g);
  const extractedNumbers = numbers ? numbers.map(n => parseInt(n)) : [];
  
  // Parse zoom magnification commands
  if (lowerCommand.match(/\b(zoom|magnification|magnify)\s*(to|at|is|=)?\s*(\d+)/i)) {
    const match = lowerCommand.match(/(\d+)\s*(percent|%)?/i);
    if (match) {
      let mag = parseInt(match[1]);
      if (mag < 150) mag = 150;
      if (mag > 500) mag = 500;
      optimized.zoomMagnification = mag;
      optimized.hoverZoomEnabled = true;
      if (optimized.zoomMode === 'none') optimized.zoomMode = 'none'; // Default hover mode
      changes.push(`Zoom magnification set to ${mag}%`);
    }
  } else if (lowerCommand.includes('bigger zoom') || lowerCommand.includes('more zoom') || 
             lowerCommand.includes('increase zoom') || lowerCommand.includes('zoom in more')) {
    const increment = extractedNumbers[0] || 50;
    optimized.zoomMagnification = Math.min(500, optimized.zoomMagnification + increment);
    optimized.hoverZoomEnabled = true;
    changes.push(`Zoom magnification increased to ${optimized.zoomMagnification}%`);
  } else if (lowerCommand.includes('smaller zoom') || lowerCommand.includes('less zoom') || 
             lowerCommand.includes('decrease zoom') || lowerCommand.includes('zoom out more')) {
    const decrement = extractedNumbers[0] || 50;
    optimized.zoomMagnification = Math.max(150, optimized.zoomMagnification - decrement);
    optimized.hoverZoomEnabled = true;
    changes.push(`Zoom magnification decreased to ${optimized.zoomMagnification}%`);
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
    optimized.zoomMagnification = Math.max(optimized.zoomMagnification, 200);
    optimized.hoverZoomEnabled = true;
    changes.push('Optimized for visual appeal');
  }
  
  if (lowerCommand.includes('readable') || lowerCommand.includes('read') ||
      lowerCommand.includes('clear') || lowerCommand.includes('sharp')) {
    optimized.contrast = Math.max(optimized.contrast, 140);
    optimized.zoomMagnification = Math.max(optimized.zoomMagnification, 220);
    optimized.hoverZoomEnabled = true;
    if (optimized.zoomMode === 'none') optimized.zoomMode = 'none';
    changes.push('Optimized for readability');
  }
  
  if (lowerCommand.includes('comfortable') || lowerCommand.includes('comfort') ||
      lowerCommand.includes('easy') || lowerCommand.includes('gentle')) {
    optimized.contrast = Math.min(optimized.contrast, 115);
    optimized.zoomMagnification = Math.max(150, Math.min(200, optimized.zoomMagnification));
    optimized.hoverZoomEnabled = true;
    changes.push('Optimized for comfort');
  }
  
  if (lowerCommand.includes('bright') || lowerCommand.includes('brighter')) {
    optimized.backgroundColor = 'default';
    optimized.customColor = '#ffffff';
    optimized.contrast = Math.max(optimized.contrast, 110);
    changes.push('Brightened display');
  }
  
  if (lowerCommand.includes('dim') || lowerCommand.includes('darker')) {
    optimized.backgroundColor = 'black';
    optimized.contrast = Math.max(optimized.contrast, 110);
    changes.push('Dimmed display');
  }
  
  // Colorblindness support
  if (lowerCommand.includes('colorblind') || lowerCommand.includes('color blind') || 
      lowerCommand.includes('colorblindness') || lowerCommand.includes('color blindness')) {
    
    // Protanopia (red-blind) - red-green colorblindness
    if (lowerCommand.includes('protanopia') || lowerCommand.includes('protan') || 
        lowerCommand.includes('red-green') || lowerCommand.includes('red green') ||
        lowerCommand.includes('red blind')) {
      optimized.contrast = Math.max(optimized.contrast, 150);
      optimized.backgroundColor = 'default';
      optimized.customColor = null;
      optimized.displayMode = 'light';
      optimized.colorBlindnessType = 'protanopia';
      changes.push('Optimized for protanopia (red-green colorblindness)');
    }
    // Deuteranopia (green-blind) - red-green colorblindness
    else if (lowerCommand.includes('deuteranopia') || lowerCommand.includes('deuteran') ||
             lowerCommand.includes('green blind')) {
      optimized.contrast = Math.max(optimized.contrast, 150);
      optimized.backgroundColor = 'default';
      optimized.customColor = null;
      optimized.displayMode = 'light';
      optimized.colorBlindnessType = 'deuteranopia';
      changes.push('Optimized for deuteranopia (red-green colorblindness)');
    }
    // Tritanopia (blue-blind) - blue-yellow colorblindness
    else if (lowerCommand.includes('tritanopia') || lowerCommand.includes('tritan') ||
             lowerCommand.includes('blue-yellow') || lowerCommand.includes('blue yellow') ||
             lowerCommand.includes('blue blind')) {
      optimized.contrast = Math.max(optimized.contrast, 160);
      optimized.backgroundColor = 'default';
      optimized.customColor = null;
      optimized.displayMode = 'light';
      optimized.colorBlindnessType = 'tritanopia';
      changes.push('Optimized for tritanopia (blue-yellow colorblindness)');
    }
    // General colorblindness - high contrast, light background
    else {
      optimized.contrast = Math.max(optimized.contrast, 150);
      optimized.backgroundColor = 'default';
      optimized.customColor = null;
      optimized.displayMode = 'light';
      optimized.colorBlindnessType = 'colorblind-help';
      changes.push('Optimized for colorblindness - high contrast enabled');
    }
  }
  
  // Accessibility-focused commands
  if (lowerCommand.includes('easier to see') || lowerCommand.includes('hard to see') ||
      lowerCommand.includes('difficult to see') || lowerCommand.includes('can\'t see') ||
      lowerCommand.includes('cannot see')) {
    optimized.contrast = Math.max(optimized.contrast, 160);
    optimized.zoomMagnification = Math.max(optimized.zoomMagnification, 250);
    optimized.hoverZoomEnabled = true;
    if (optimized.zoomMode === 'none') optimized.zoomMode = 'none';
    optimized.displayMode = 'light';
    changes.push('Optimized for better visibility');
  }
  
  if (lowerCommand.includes('visually impaired') || lowerCommand.includes('low vision') ||
      lowerCommand.includes('vision problem') || lowerCommand.includes('poor vision')) {
    optimized.contrast = Math.max(optimized.contrast, 170);
    optimized.zoomMagnification = Math.max(optimized.zoomMagnification, 300);
    optimized.hoverZoomEnabled = true;
    if (optimized.zoomMode === 'none') optimized.zoomMode = 'none';
    optimized.displayMode = 'light';
    changes.push('Optimized for visual impairment');
  }
  
  // Apply optimized settings
  await chrome.storage.local.set(optimized);
  
  // Update UI
  if (optimized.zoomMagnification !== undefined) {
    if (zoomMagnificationSlider) {
      zoomMagnificationSlider.value = optimized.zoomMagnification;
      zoomMagnificationValue.textContent = optimized.zoomMagnification + '%';
    }
  }
  
  if (optimized.zoomMode !== undefined && optimized.hoverZoomEnabled) {
    if (optimized.zoomMode === 'cursor' && zoomModeCursorBtn) {
      [zoomModeCursorBtn, zoomModeRegionBtn, zoomDisableBtn].forEach(b => {
        if (b) b.classList.remove('active');
      });
      zoomModeCursorBtn.classList.add('active');
    } else if (optimized.zoomMode === 'region' && zoomModeRegionBtn) {
      [zoomModeCursorBtn, zoomModeRegionBtn, zoomDisableBtn].forEach(b => {
        if (b) b.classList.remove('active');
      });
      zoomModeRegionBtn.classList.add('active');
    }
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
  
  // If no specific changes detected, try to infer intent from the command
  if (changes.length === 0) {
    // Try to extract any numbers for settings
    if (extractedNumbers.length > 0) {
      const num = extractedNumbers[0];
      if (num >= 150 && num <= 500 && (lowerCommand.includes('zoom') || lowerCommand.includes('magnif'))) {
        optimized.zoomMagnification = num;
        optimized.hoverZoomEnabled = true;
        changes.push(`Zoom set to ${num}%`);
      } else if (num >= 50 && num <= 200 && (lowerCommand.includes('contrast'))) {
        optimized.contrast = num;
        changes.push(`Contrast set to ${num}%`);
      }
    }
    
    // Generic optimization based on keywords
    if (lowerCommand.includes('better') || lowerCommand.includes('improve') || 
        lowerCommand.includes('enhance') || lowerCommand.includes('optimize')) {
      optimized.contrast = Math.max(optimized.contrast, 130);
      optimized.zoomMagnification = Math.max(optimized.zoomMagnification, 220);
      optimized.hoverZoomEnabled = true;
      changes.push('Settings optimized for better viewing');
    }
  }
  
  // Show status with changes
  if (changes.length > 0) {
    showStatus(changes.join(', '));
  } else {
    showStatus('Settings optimized!');
  }
}

// Hover zoom controls
if (zoomMagnificationSlider) {
  zoomMagnificationSlider.addEventListener('input', (e) => {
    zoomMagnificationValue.textContent = e.target.value + '%';
    saveSettings();
  });
}

if (zoomModeCursorBtn) {
  zoomModeCursorBtn.addEventListener('click', () => {
    [zoomModeCursorBtn, zoomModeRegionBtn, zoomDisableBtn].forEach(b => {
      if (b) b.classList.remove('active');
    });
    zoomModeCursorBtn.classList.add('active');
    saveSettings();
  });
}

if (zoomModeRegionBtn) {
  zoomModeRegionBtn.addEventListener('click', () => {
    [zoomModeCursorBtn, zoomModeRegionBtn, zoomDisableBtn].forEach(b => {
      if (b) b.classList.remove('active');
    });
    zoomModeRegionBtn.classList.add('active');
    saveSettings();
  });
}

if (zoomDisableBtn) {
  zoomDisableBtn.addEventListener('click', () => {
    [zoomModeCursorBtn, zoomModeRegionBtn, zoomDisableBtn].forEach(b => {
      if (b) b.classList.remove('active');
    });
    zoomDisableBtn.classList.add('active');
    saveSettings();
  });
}

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
  if (zoomMagnificationSlider) {
    zoomMagnificationSlider.value = 200;
    zoomMagnificationValue.textContent = '200%';
  }
  if (zoomDisableBtn) {
    [zoomModeCursorBtn, zoomModeRegionBtn, zoomDisableBtn].forEach(b => {
      if (b) b.classList.remove('active');
    });
    zoomDisableBtn.classList.add('active');
  }
  contrastSlider.value = 100;
  contrastValue.textContent = '100%';
  backgroundColorButtons.forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.color === 'default') {
      btn.classList.add('active');
    }
  });
  customColorPicker.value = '#ffffff';
  [lightModeBtn, darkModeBtn, nightModeBtn].forEach(btn => {
    if (btn) btn.classList.remove('active');
  });
  
  await chrome.storage.local.clear();
  saveSettings();
  showStatus('All settings reset!');
});

// Initialize
loadSettings();
