# Icons Directory

## Quick Setup (Recommended)

**The extension works fine without icons!** Chrome will use a default icon. However, if you want custom icons:

### Method 1: Use the Icon Generator (Easiest)

1. Open `create-icons.html` in your web browser
2. The icons will be automatically generated
3. Right-click on each canvas (icon16, icon48, icon128)
4. Select "Save image as..." or "Save picture as..."
5. Save them in this `icons/` folder with these exact names:
   - `icon16.png`
   - `icon48.png`
   - `icon128.png`
6. After saving, update `manifest.json` to include the icon references (see below)

### Method 2: Use an Image Editor

Create PNG files with these dimensions:
- `icon16.png` - 16x16 pixels
- `icon48.png` - 48x48 pixels  
- `icon128.png` - 128x128 pixels

### Method 3: Use Online Tools

- Use an online icon generator
- Download free icons from icon libraries (ensure proper licensing)
- Create simple colored squares with the text "O" or an eye symbol

## Adding Icons to Manifest (Optional)

If you create the icon files, add this back to `manifest.json`:

```json
"action": {
  "default_popup": "popup.html",
  "default_icon": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
},
"icons": {
  "16": "icons/icon16.png",
  "48": "icons/icon48.png",
  "128": "icons/icon128.png"
}
```

**Note:** The extension works perfectly without custom icons - Chrome will just show a default extension icon.
