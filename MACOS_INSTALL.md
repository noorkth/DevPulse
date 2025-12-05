# macOS Installation Guide

This guide explains how to build and distribute DevPulse for macOS.

---

## 📦 Building the Installer

### Step 1: Build the App

```bash
# Build production files
npm run build

# Build macOS .dmg installer
npm run build:mac
```

This creates:
- `release/DevPulse-1.0.0.dmg` - Installable DMG file
- `release/DevPulse-1.0.0-mac.zip` - Portable ZIP version

### Step 2: Distribute

Share the `.dmg` file with users. They can:
1. Double-click the DMG
2. Drag DevPulse to Applications folder
3. Launch from Applications

---

## 💾 User Data Storage

Each user's data is stored in their own Application Support folder:

```
~/Library/Application Support/devpulse/
├── devpulse.db          # SQLite database
├── devpulse.db-journal  # SQLite journal
└── logs/                # App logs (if any)
```

**Path on macOS:**
```
/Users/<USERNAME>/Library/Application Support/devpulse/
```

### Benefits:
- ✅ Each user has their own data
- ✅ Data persists across app updates
- ✅ No permission issues
- ✅ Standard macOS practice
- ✅ Easy to backup (just copy the folder)

---

## 🔧 First Launch

When a user first launches DevPulse:

1. **Database Creation**: SQLite database created automatically in their Application Support folder
2. **Schema Migration**: Prisma runs all migrations
3. **Empty State**: Database starts clean (no sample data)
4. **Ready to Use**: User can immediately start creating products, clients, projects

---

## 📊 Data Management

### Backup User Data

Users can backup their data by copying:
```bash
cp -r ~/Library/Application\ Support/devpulse ~/Desktop/devpulse-backup
```

### Restore Data

To restore:
```bash
cp -r ~/Desktop/devpulse-backup/* ~/Library/Application\ Support/devpulse/
```

### Reset Data

To start fresh:
```bash
rm -rf ~/Library/Application\ Support/devpulse/
# Relaunch app - will create new empty database
```

---

## 🎯 Distribution Options

### Option 1: Direct DMG Distribution
- Build the .dmg file
- Share via Google Drive, Dropbox, etc.
- Users download and install manually

### Option 2: GitHub Releases
```bash
# After building
gh release create v1.0.0 release/DevPulse-1.0.0.dmg

# Or upload manually at:
# https://github.com/noorkth/DevPulse/releases/new
```

### Option 3: Internal Distribution
- Share .dmg via company intranet
- Use MDM (Mobile Device Management) for IT deployment
- Package with custom installer script

---

## 🔐 Code Signing (Optional but Recommended)

For wider distribution, sign the app:

```bash
# Get Apple Developer certificate
# Then in package.json, update:
{
  "build": {
    "mac": {
      "identity": "Developer ID Application: Your Name (TEAMID)"
    }
  }
}
```

Without signing:
- Users will see "unidentified developer" warning
- They'll need to right-click → Open to launch first time

---

## 📝 Release Checklist

Before distributing:

- [ ] Test the app thoroughly
- [ ] Bump version in `package.json`
- [ ] Update CHANGELOG.md (if you have one)
- [ ] Run `npm run build:mac`
- [ ] Test the .dmg installer
- [ ] Create GitHub release
- [ ] Share download link with users

---

## 🚀 Automatic Updates (Future)

To add auto-updates, integrate:
- **electron-updater** package
- Configure update server
- Users get notified of new versions automatically

---

## 💡 Tips

1. **Version Numbering**: Use semantic versioning (1.0.0, 1.1.0, 2.0.0)
2. **Testing**: Test on a clean Mac before distributing
3. **Documentation**: Include QUICKSTART.md with the DMG
4. **Support**: Provide contact info for user issues

---

**Your app will be installed to:**
```
/Applications/DevPulse.app
```

**User data will be stored at:**
```
~/Library/Application Support/devpulse/
```

This ensures each user has their own isolated data!
