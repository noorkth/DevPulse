# Export/Import Data Feature Documentation

## Overview

DevPulse now includes comprehensive data management features accessible from the Settings page.

## Features

### 📦 Export Data

**What it does:**
- Exports ALL application data to a JSON file
- Includes: Products, Clients, Projects, Developers, Issues, Features, and relationships
- Shows save dialog to choose export location
- Default filename: `devpulse-backup-YYYY-MM-DD.json`

**How to use:**
1. Navigate to Settings → Data Management
2. Click "Export Data" button
3. Choose save location
4. Wait for confirmation message

**Export file format:**
```json
{
  "version": "1.0",
  "exportedAt": "2025-12-07T...",
  "data": {
    "products": [...],
    "clients": [...],
    "projects": [...],
    "developers": [...],
    "issues": [...],
    "features": [...],
    "developerProjects": [...]
  },
  "stats": {
    "totalProducts": 5,
    "totalClients": 10,
    ...
  }
}
```

---

### 📥 Import Data

**What it does:**
- Imports data from a previously exported JSON file
- Two import modes:
  - **Merge**: Adds data without deleting existing records
  - **Replace All**: Deletes all existing data first, then imports
- Shows confirmation dialog before importing
- Validates file format before import
- Auto-refreshes the app after successful import

**How to use:**
1. Navigate to Settings → Data Management
2. Click "Import Data" button
3. Select a DevPulse backup JSON file
4. Choose import mode (Merge or Replace All)
5. Wait for import to complete
6. App will refresh automatically

**Import modes:**

#### Merge Mode (Recommended)
- Adds new data
- Updates existing records (matched by ID)
- Keeps existing records not in import file
- Safe for adding data from another instance

#### Replace All Mode (Destructive)
- ⚠️ **Deletes ALL existing data**
- Imports fresh data from file
- Use for restoring from backup
- **Cannot be undone!**

---

### 🧹 Clear Cache

**What it does:**
- Clears Electron session cache
- Clears storage data
- Shows confirmation dialog
- Refreshes the app after clearing

**How to use:**
1. Navigate to Settings →Data Management  
2. Click "Clear Cache" button
3. Confirm the action
4. App will refresh automatically

**When to use:**
- App behaving strangely
- UI not updating properly
- After major updates
- Troubleshooting issues

---

## Use Cases

### Backup Your Data
```
1. Export Data → Save to safe location
2. Do this regularly (weekly/monthly)
3. Keep multiple backups
```

### Transfer Data Between Machines
```
Machine A:
1. Export Data → Save to USB/Cloud

Machine B:
1. Import Data → Select file → Choose "Merge" or "Replace"
```

### Restore From Backup
```
1. Import Data → Select backup file
2. Choose "Replace All" mode
3. Confirm and wait
4. App refreshes with backup data
```

### Share Test Data
```
Developer 1: Export Data → Share JSON file
Developer 2: Import Data → Merge mode
```

---

## Technical Details

### IPC Handlers

**`data:export`**
- Returns: `{ success, message, filePath, stats }`
- Shows native save dialog
- Exports all tables with relationships

**`data:import`**
- Returns: `{ success, message, mode, stats }`
- Shows native open dialog
- Shows native message box for mode selection
- Uses `upsert` for merge mode
- Uses `deleteMany` + `create` for replace mode

**`data:clearCache`**
- Returns: `{ success, message }`
- Shows native message box confirmation
- Clears session cache and storage

### Security Considerations

1. **Validation**: Import validates file format before processing
2. **Confirmation**: Destructive actions require user confirmation
3. **Error Handling**: All operations have try-catch error handling
4. **User Feedback**: Clear success/error messages

### File Format

- **Format**: JSON
- **Encoding**: UTF-8
- **Size**: Varies (typically 10KB - 10MB)
- **Compatibility**: v1.0 format (forward compatible)

---

## Error Handling

### Export Errors
- **File write permission denied**: Check folder permissions
- **Disk full**: Free up space
- **Database locked**: Close other instances

### Import Errors
- **Invalid file format**: Select a valid DevPulse backup
- **Corrupted JSON**: Re-export from source
- **Missing relationships**: May skip invalid relationships
- **Database locked**: Close other instances

### Cache Clear Errors
- **Session clear failed**: Restart app manually
- **Storage clear failed**: Check app permissions

---

## Best Practices

### Backup Strategy
1. **Regular exports**: Weekly or monthly
2. **Multiple locations**: Local + Cloud
3. **Version naming**: Include date in filename
4. **Test restores**: Verify backups work

### Import Safety
1. **Always backup before importing**
2. **Use Merge mode** for adding data
3. **Use Replace mode** only for full restores
4. **Review import confirmation** carefully

### Troubleshooting
1. **Before clearing cache**, try refreshing first
2. **Before importing**, backup current data
3. **Keep original export files** until verified

---

## Future Enhancements

Potential improvements:
- [ ] Auto-backup scheduling
- [ ] Incremental backups
- [ ] Export filters (select specific data)
- [ ] CSV export option
- [ ] Cloud backup integration
- [ ] Compression for large exports
- [ ] Export encryption
- [ ] Import progress bar

---

## Testing

### Test Export
1. Create some test data
2. Export to file
3. Verify JSON contains all data
4. Check stats match actual counts

### Test Import (Merge)
1. Export current data
2. Modify data in app
3. Import old export (Merge mode)
4. Verify both old and new data exist

### Test Import (Replace)
1. Export data as backup
2. Create new test data
3. Import backup (Replace mode)
4. Verify only backup data exists

### Test Clear Cache
1. Clear cache
2. Verify app refreshes
3. Verify data still intact

---

## API Reference

### Frontend (Settings.tsx)

```typescript
// Export data
const result = await window.api.data.export();

// Import data
const result = await window.api.data.import();

// Clear cache
const result = await window.api.data.clearCache();
```

### Backend (electron/ipc/data.ts)

```typescript
// Export handler
ipcMain.handle('data:export', async (event) => { ... });

// Import handler
ipcMain.handle('data:import', async (event) => { ... });

// Clear cache handler
ipcMain.handle('data:clearCache', async (event) => { ... });
```

---

## Support

For issues or questions:
- Check console for error messages
- Verify file permissions
- Ensure app is not running multiple instances
- Test with small export/import first
- Create GitHub issue with error logs

---

**Version:** 1.0.31  
**Last Updated:** 2025-12-07  
**Feature Status:** ✅ Production Ready
