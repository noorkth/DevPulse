# DevPulse App Icons

This directory contains the DevPulse application icons in various sizes.

## Icon Sizes

- **icon-512.png** - 512x512px (macOS app icon, high resolution)
- **icon-256.png** - 256x256px (macOS app icon, standard resolution)
- **icon-128.png** - 128x128px (macOS app icon, small size)
- **devpulse-icon.png** - Main icon used in the app sidebar

## Design

The icon features a modern minimal design combining:
- Pulse waveform (representing developer activity/heartbeat)
- Subtle bug outline or data nodes (representing issue tracking)
- Color palette: Blue #4A90E2, Purple #6F42C1, Mint #2ECC71

## Usage

### In the App
The `devpulse-icon.png` is used in:
- Sidebar header
- About page
- Loading screens

### For macOS App Bundle
To create a macOS .icns file, you'll need all icon sizes. Use this command:

```bash
# Create iconset folder
mkdir DevPulse.iconset

# You'll need these sizes (generate or resize):
# icon_16x16.png
# icon_32x32.png  
# icon_128x128.png (provided)
# icon_256x256.png (provided)
# icon_512x512.png (provided)
# icon_1024x1024.png

# Convert to .icns
iconutil -c icns DevPulse.iconset -o DevPulse.icns
```

Then update `electron/main.ts` to use the icon:
```typescript
icon: path.join(__dirname, '../assets/icons/DevPulse.icns')
```
