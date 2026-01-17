# Octheia - Visual Accessibility Helper

A Chrome extension designed to help visually impaired users by providing easy-to-use controls for:
- **Text Resizing**: Adjust text size from 50% to 300% of original size
- **Background Colors**: Change page background to high-contrast colors (white, cream, yellow, light blue, light green)
- **Contrast Adjustment**: Fine-tune contrast levels from 50% to 200%

## Features

- 🎯 **Text Size Control**: Slider and quick buttons (Small, Medium, Large) to resize text
- 🎨 **Background Colors**: Multiple color options to make text stand out better
- 🔆 **Contrast Slider**: Adjustable contrast from 50% to 200% with quick presets
- 💾 **Persistent Settings**: Your preferences are saved and applied automatically
- 🔄 **Reset Options**: Individual and global reset buttons for easy restoration

## Installation

### Method 1: Load as Unpacked Extension (Development)

1. Open Google Chrome
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the `Octheia-1` folder (this directory)
6. The extension should now appear in your extensions list

### Method 2: Package for Distribution

1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Pack extension"
4. Select the extension directory
5. Chrome will create a `.crx` file that can be distributed

## Usage

1. Click the Octheia icon in your Chrome toolbar to open the popup
2. Adjust settings using:
   - **Text Size Slider**: Drag to resize text (50%-300%)
   - **Background Color Buttons**: Click to change page background color
   - **Contrast Slider**: Drag to adjust contrast (50%-200%)
3. Settings are automatically saved and applied to all web pages
4. Use "Reset All Settings" to restore defaults

## Quick Controls

### Text Size
- **Small**: 75% of original size
- **Medium**: 100% (default)
- **Large**: 150% of original size
- **Reset**: Returns to 100%

### Contrast
- **Low**: 75% contrast
- **Normal**: 100% (default)
- **High**: 150% contrast
- **Reset**: Returns to 100%

## File Structure

```
Octheia-1/
├── manifest.json       # Extension configuration
├── popup.html          # Extension popup interface
├── popup.css           # Popup styling
├── popup.js            # Popup functionality
├── content.js          # Script that modifies web pages
├── background.js       # Background service worker
├── icons/              # Extension icons (16x16, 48x48, 128x128)
└── README.md           # This file
```

## Icon Setup

Before loading the extension, you'll need to add icon files:
- `icons/icon16.png` (16x16 pixels)
- `icons/icon48.png` (48x48 pixels)
- `icons/icon128.png` (128x128 pixels)

See `icons/README.md` for more details.

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **Permissions**: 
  - `activeTab`: To modify the current tab's content
  - `storage`: To save user preferences
- **Content Scripts**: Injected into all web pages to apply accessibility settings
- **Storage**: Uses Chrome's local storage API for persistence

## Browser Compatibility

- Chrome 88+ (Manifest V3 support required)
- Edge 88+ (Chromium-based)

## Privacy

This extension:
- ✅ Works entirely locally (no data sent to external servers)
- ✅ Only accesses the current active tab
- ✅ Stores preferences locally in your browser
- ✅ Does not collect any personal information

## Troubleshooting

**Extension not working?**
- Make sure you've enabled "Developer mode" in `chrome://extensions/`
- Reload the extension after making changes
- Check the browser console for errors (F12)

**Settings not persisting?**
- Ensure Chrome storage permissions are granted
- Try resetting and reapplying settings

**Styles not applying?**
- Some websites may override styles with `!important` flags
- The extension uses `!important` to maximize compatibility
- Refresh the page after changing settings

## License

This project is open source and available for personal and commercial use.

## Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.

---

**Made with ❤️ for better web accessibility**
