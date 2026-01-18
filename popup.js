// Get DOM elements
const zoomMagnificationSlider = document.getElementById('zoomMagnification');
const zoomMagnificationValue = document.getElementById('zoomMagnificationValue');
const zoomModeCursorBtn = document.getElementById('zoomModeCursor');
const zoomModeRegionBtn = document.getElementById('zoomModeRegion');
const zoomDisableBtn = document.getElementById('zoomDisable');

const backgroundColorButtons = document.querySelectorAll('.color-btn');
const customColorPicker = document.getElementById('customColorPicker');

// Contrast slider removed

const lightModeBtn = document.getElementById('lightMode');
const darkModeBtn = document.getElementById('darkMode');
const nightModeBtn = document.getElementById('nightMode');

// AI Optimizer removed

// High contrast theme buttons
const highContrastYellowBtn = document.getElementById('highContrastYellow');
const highContrastWhiteBtn = document.getElementById('highContrastWhite');
const highContrastGreenBtn = document.getElementById('highContrastGreen');
const highContrastOffBtn = document.getElementById('highContrastOff');

// Focus mode toggle
const focusModeToggleBtn = document.getElementById('focusModeToggle');

// Color blindness buttons
const colorBlindProtanopiaBtn = document.getElementById('colorBlindProtanopia');
const colorBlindDeuteranopiaBtn = document.getElementById('colorBlindDeuteranopia');
const colorBlindTritanopiaBtn = document.getElementById('colorBlindTritanopia');
const colorBlindOffBtn = document.getElementById('colorBlindOff');

// Alt-text generator toggle
const altTextModeToggleBtn = document.getElementById('altTextModeToggle');

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
      'displayMode', 'highContrastTheme', 'focusModeEnabled', 'colorBlindnessType', 'altTextModeEnabled'
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
    
    // Contrast slider removed
    
    if (result.displayMode) {
      [lightModeBtn, darkModeBtn, nightModeBtn].forEach(btn => {
        if (btn && btn.dataset.mode === result.displayMode) {
          btn.classList.add('active');
        } else if (btn) {
          btn.classList.remove('active');
        }
      });
    }
    
    // Load high contrast theme
    if (result.highContrastTheme) {
      [highContrastYellowBtn, highContrastWhiteBtn, highContrastGreenBtn, highContrastOffBtn].forEach(btn => {
        if (btn && btn.dataset.theme === result.highContrastTheme) {
          btn.classList.add('active');
        } else if (btn) {
          btn.classList.remove('active');
        }
      });
    }
    
    // Load focus mode
    if (result.focusModeEnabled && focusModeToggleBtn) {
      focusModeToggleBtn.textContent = 'Disable Focus Mode';
      focusModeToggleBtn.classList.add('active');
    } else if (focusModeToggleBtn) {
      focusModeToggleBtn.textContent = 'Enable Focus Mode';
      focusModeToggleBtn.classList.remove('active');
    }
    
    // Load color blindness
    if (result.colorBlindnessType) {
      [colorBlindProtanopiaBtn, colorBlindDeuteranopiaBtn, colorBlindTritanopiaBtn, colorBlindOffBtn].forEach(btn => {
        if (btn && btn.dataset.type === result.colorBlindnessType) {
          btn.classList.add('active');
        } else if (btn) {
          btn.classList.remove('active');
        }
      });
    }
    
    // Load alt-text mode
    if (result.altTextModeEnabled && altTextModeToggleBtn) {
      altTextModeToggleBtn.textContent = 'Disable Alt-Text Mode';
      altTextModeToggleBtn.classList.add('active');
    } else if (altTextModeToggleBtn) {
      altTextModeToggleBtn.textContent = 'Enable Alt-Text Mode';
      altTextModeToggleBtn.classList.remove('active');
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
  
  const activeHighContrast = document.querySelector('[data-theme].active');
  const activeColorBlind = document.querySelector('[data-type].active');
  
  const settings = {
    hoverZoomEnabled: activeZoomMode !== 'none',
    zoomMagnification: parseInt(zoomMagnificationSlider.value),
    zoomMode: activeZoomMode,
    backgroundColor: activeColorBtn?.dataset.color || 'default',
    customColor: customColorPicker.value,
    contrast: 100, // Contrast slider removed, default to 100
    displayMode: document.querySelector('.btn-mode.active')?.dataset.mode || 'none',
    highContrastTheme: activeHighContrast?.dataset.theme || 'off',
    focusModeEnabled: focusModeToggleBtn?.classList.contains('active') || false,
    colorBlindnessType: activeColorBlind?.dataset.type === 'off' ? 'off' : (activeColorBlind?.dataset.type || 'off'),
    altTextModeEnabled: altTextModeToggleBtn?.classList.contains('active') || false
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

// AI Optimizer function removed - entire feature deleted

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

// Contrast controls removed

// Display mode controls
[lightModeBtn, darkModeBtn, nightModeBtn].forEach(btn => {
  if (btn) {
    btn.addEventListener('click', () => {
      [lightModeBtn, darkModeBtn, nightModeBtn].forEach(b => {
        if (b) b.classList.remove('active');
      });
      btn.classList.add('active');
      saveSettings();
    });
  }
});

// AI Optimizer orphaned code removed - entire block deleted (~350 lines)

// High contrast theme controls
[highContrastYellowBtn, highContrastWhiteBtn, highContrastGreenBtn, highContrastOffBtn].forEach(btn => {
  if (btn) {
    btn.addEventListener('click', () => {
      [highContrastYellowBtn, highContrastWhiteBtn, highContrastGreenBtn, highContrastOffBtn].forEach(b => {
        if (b) b.classList.remove('active');
      });
      btn.classList.add('active');
      saveSettings();
    });
  }
});

// AI Optimizer orphaned code removed - entire block deleted (~350 lines)

// Focus mode toggle
if (focusModeToggleBtn) {
  focusModeToggleBtn.addEventListener('click', () => {
    focusModeToggleBtn.classList.toggle('active');
    if (focusModeToggleBtn.classList.contains('active')) {
      focusModeToggleBtn.textContent = 'Disable Focus Mode';
    } else {
      focusModeToggleBtn.textContent = 'Enable Focus Mode';
    }
    saveSettings();
  });
}

// AI Optimizer orphaned code removed - entire block deleted (~330 lines)

// Color blindness controls
[colorBlindProtanopiaBtn, colorBlindDeuteranopiaBtn, colorBlindTritanopiaBtn, colorBlindOffBtn].forEach(btn => {
  if (btn) {
    btn.addEventListener('click', () => {
      [colorBlindProtanopiaBtn, colorBlindDeuteranopiaBtn, colorBlindTritanopiaBtn, colorBlindOffBtn].forEach(b => {
        if (b) b.classList.remove('active');
      });
      btn.classList.add('active');
      saveSettings();
    });
  }
});

// AI Optimizer orphaned code removed - entire block deleted (~330 lines)

// Alt-text mode toggle
if (altTextModeToggleBtn) {
  altTextModeToggleBtn.addEventListener('click', () => {
    altTextModeToggleBtn.classList.toggle('active');
    if (altTextModeToggleBtn.classList.contains('active')) {
      altTextModeToggleBtn.textContent = 'Disable Alt-Text Mode';
    } else {
      altTextModeToggleBtn.textContent = 'Enable Alt-Text Mode';
    }
    saveSettings();
  });
}

// AI Optimizer orphaned code removed - entire block deleted (~325 lines)

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
  // Contrast slider removed
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
  
  // Reset high contrast themes
  [highContrastYellowBtn, highContrastWhiteBtn, highContrastGreenBtn, highContrastOffBtn].forEach(btn => {
    if (btn) btn.classList.remove('active');
  });
  if (highContrastOffBtn) highContrastOffBtn.classList.add('active');
  
  // Reset focus mode
  if (focusModeToggleBtn) {
    focusModeToggleBtn.classList.remove('active');
    focusModeToggleBtn.textContent = 'Enable Focus Mode';
  }
  
  // Reset color blindness
  [colorBlindProtanopiaBtn, colorBlindDeuteranopiaBtn, colorBlindTritanopiaBtn, colorBlindOffBtn].forEach(btn => {
    if (btn) btn.classList.remove('active');
  });
  if (colorBlindOffBtn) colorBlindOffBtn.classList.add('active');
  
  // Reset alt-text mode
  if (altTextModeToggleBtn) {
    altTextModeToggleBtn.classList.remove('active');
    altTextModeToggleBtn.textContent = 'Enable Alt-Text Mode';
  }
  
  await chrome.storage.local.clear();
  saveSettings();
  showStatus('All settings reset!');
});

// Initialize
loadSettings();
