# DevPulse v1.0.32 Release Notes

**Release Date:** December 7, 2025  
**Platform:** macOS (Apple Silicon - M1/M2/M3)  
**Build Status:** ✅ Stable Release

---

## 🎉 What's New in v1.0.32

### 📊 CSV Export/Import Feature

The flagship feature of this release! Export and import your data in Excel-friendly CSV format.

#### Export Data
- **Format**: CSV files packaged in a ZIP archive
- **Individual Files**: Each table gets its own CSV:
  - `products.csv`
  - `clients.csv`
  - `projects.csv`
  - `developers.csv`
  - `issues.csv`
  - `features.csv`
  - `developer_projects.csv`
  - `metadata.json` (backup information)
- **Easy Access**: Extract ZIP to view/edit individual CSV files in Excel, Google Sheets, or any spreadsheet application
- **Default Filename**: `devpulse-backup-YYYY-MM-DD.zip`

#### Import Data
- **Two Modes**:
  - **Merge**: Add new data without deleting existing records
  - **Replace All**: Delete all existing data first, then import (⚠️ WARNING: Destructive!)
- **Confirmation Dialogs**: Shows data preview before import
- **Auto-Refresh**: Application reloads automatically after successful import
- **Error Handling**: Validates CSV format and shows clear error messages

#### Use Cases
- 📦 **Regular Backups**: Export weekly/monthly for data safety
- 🔄 **Data Migration**: Transfer data between machines
- 📊 **Excel Analysis**: Export → Edit in Excel → Re-import
- 👥 **Team Sharing**: Share test data with team members
- 💾 **Disaster Recovery**: Restore from backup when needed

---

## 🐛 Bug Fixes

### Cache Clear Blank Screen Issue
**Problem**: Clicking "Clear Cache" resulted in a blank screen after reload.

**Solution**:
- Implemented automatic window reload with 500ms delay
- Changed to selective cache clearing (preserves important app data)
- Only clears temporary data: cookies, localStorage, cache storage
- Database and app settings remain intact

**Technical Details**:
```javascript
// Before: Too aggressive, caused blank screen
await session.clearStorageData(); // Deleted everything

// After: Selective clearing + auto-reload
await session.clearStorageData({
  storages: ['cookies', 'localstorage', 'cachestorage']
});
window.reload(); // Graceful reload
```

---

## 🧪 Testing Improvements

### Updated Integration Tests
Added comprehensive tests for new export/import functionality:

**New Test Sections**:
- **Test 9**: Data Export (CSV)
  - Creates test ZIP file
  - Validates CSV format
  - Verifies metadata inclusion
  - Tests file integrity
  
- **Test 10**: Data Import Simulation
  - CSV parsing validation
  - Upsert logic verification
  - Format compatibility checks

**Test Coverage**: 43 → **55+ tests**

**Run Tests**:
```bash
npm run test:integration
```

---

## 📦 Installation

### macOS (Apple Silicon)

**Download**:
- DMG Installer: `DevPulse-1.0.32-arm64.dmg` (147 MB)
- ZIP Archive: `DevPulse-1.0.32-arm64-mac.zip` (143 MB)

**Install via DMG**:
1. Download `DevPulse-1.0.32-arm64.dmg`
2. Open the DMG file
3. Drag DevPulse to Applications folder
4. Open DevPulse from Applications

**Install via ZIP**:
1. Download `DevPulse-1.0.32-arm64-mac.zip`
2. Extract the ZIP file
3. Move `DevPulse.app` to Applications folder
4. Open DevPulse from Applications

**First Launch**:
- Right-click → Open (for unsigned apps)
- Database will be created at: `~/Library/Application Support/devpulse/devpulse.db`

---

## 🔄 Upgrade from v1.0.31

### What's Preserved
- ✅ All existing data (products, clients, projects, developers, issues)
- ✅ Database structure and relationships
- ✅ Application settings and preferences
- ✅ All security features from v1.0.31

### Upgrade Steps
1. **Backup Your Data** (New Feature!):
   ```
   Settings → Data Management → Export Data
   Save backup to safe location
   ```

2. **Install v1.0.32**:
   - Download and install new version
   - Old database will be automatically used

3. **Verify Installation**:
   - Check version in Settings
   - Test new CSV export/import features
   - Verify all existing data is intact

### Breaking Changes
❌ **None** - Fully backward compatible with v1.0.31

---

## 📊 Version Comparison

| Feature | v1.0.31 | v1.0.32 |
|---------|---------|---------|
| **Export Format** | JSON | **CSV (ZIP)** |
| **Import Format** | JSON | **CSV (ZIP)** |
| **Excel Compatible** | ❌ | **✅** |
| **Manual Data Edit** | ❌ | **✅** |
| **Cache Clear Bug** | 🐛 Blank screen | **✅ Fixed** |
| **Integration Tests** | 43 tests | **55+ tests** |
| **Security Features** | Full | **Full** |
| **Database** | SQLite | **SQLite** |

---

## 🔒 Security Features (Maintained)

All security improvements from v1.0.31 are included:

### Input Validation
- ✅ Zod schema validation for all IPC data
- ✅ Type-safe data structures
- ✅ Custom error messages

### Rate Limiting
- ✅ Token bucket algorithm
- ✅ Per-channel rate limits
- ✅ Automatic cleanup

### Content Security Policy
- ✅ Development mode: Relaxed (Vite HMR)
- ✅ Production mode: Strict
- ✅ Dynamic CSP headers

### Other Security
- ✅ Context isolation enabled
- ✅ Sandbox enabled
- ✅ DevTools restricted to dev mode
- ✅ Secure file permissions
- ✅ **0 vulnerabilities** (npm audit)

---

## 🛠️ Technical Details

### Dependencies Added
- `adm-zip`: ^0.5.10 (ZIP file creation/extraction)
- `@types/adm-zip`: ^0.5.5 (TypeScript definitions)

### Files Modified
- `electron/ipc/data.ts`: New CSV export/import handlers + cache fix
- `src/pages/Settings.tsx`: Updated UI for new features
- `scripts/test-integration.ts`: Added export/import tests
- `package.json`: Version bump to 1.0.32

### New Features Implementation
**CSV Conversion**:
```typescript
// Array to CSV
function arrayToCSV(data: any[]): string {
  // Header row + data rows
  // Handles escaping, null values, special characters
}

// CSV to Array
function csvToArray(csv: string): any[] {
  // Parses CSV with quoted values
  // Converts to object array
}
```

**ZIP Archive**:
```typescript
const zip = new AdmZip();
zip.addFile('products.csv', csvBuffer);
zip.addFile('metadata.json', metadataBuffer);
zip.writeZip(filePath);
```

---

## 📝 Usage Guide

### Export Data
1. Navigate to **Settings** → **Data Management**
2. Click **Export Data**
3. Choose save location
4. Wait for success message
5. Extract ZIP to view CSV files

### Import Data
1. Navigate to **Settings** → **Data Management**
2. Click **Import Data**
3. Select ZIP backup file
4. Choose import mode:
   - **Merge**: Keep existing + add new
   - **Replace All**: Delete all + import
5. Confirm action
6. Wait for import + auto-refresh

### Clear Cache
1. Navigate to **Settings** → **Data Management**
2. Click **Clear Cache**
3. Confirm action
4. Wait for auto-reload (0.5s)
5. App loads normally

---

## 🎯 Best Practices

### Backup Strategy
- **Frequency**: Export weekly or before major changes
- **Storage**: Keep backups in multiple locations (local + cloud)
- **Naming**: Include date in filename for easy tracking
- **Testing**: Periodically test restoring from backup

### Import Safety
- **Always backup before importing**
- **Use Merge mode** for adding data
- **Use Replace mode** only for full restores
- **Review confirmation dialog** carefully

### Data Management
- **Regular exports**: Create restore points
- **Version control**: Keep old backups for rollback
- **Documentation**: Note what changes were made
- **Validation**: Test imports with small datasets first

---

## 🐛 Known Issues

### Current Limitations
1. **Code Signing**: App is not code-signed (requires Apple Developer account)
   - **Workaround**: Right-click → Open on first launch
   
2. **CSV Parsing**: Basic CSV parser (doesn't handle complex edge cases)
   - **Workaround**: Avoid commas in data fields when possible
   - **Alternative**: Values with commas are automatically quoted

3. **Large Exports**: Very large datasets (10,000+ records) may take time
   - **Workaround**: Be patient, or split data into smaller exports

---

## 🔮 Future Enhancements

### Planned for v1.0.33+
- Progressive CSV parser for better edge case handling
- Export progress bar for large datasets
- Automatic backup scheduling
- Cloud backup integration
- Export filters (select specific data to export)
- Compression for large exports
- Export encryption for sensitive data

---

## 📞 Support & Feedback

### Testing Checklist
After installation, please verify:
- [ ] Version shows 1.0.32 in Settings
- [ ] All existing data is intact
- [ ] Export Data creates ZIP file
- [ ] ZIP contains CSV files
- [ ] Import Data works (test with Merge mode)
- [ ] Clear Cache reloads properly
- [ ] No blank screens or errors

### Reporting Issues
If you encounter any problems:
1. Check console for error messages (DevTools)
2. Try exporting data before reporting
3. Note the exact steps to reproduce
4. Include system info (macOS version, chip type)

---

## 📚 Additional Resources

- **Integration Test Guide**: `scripts/TESTING_INSTALLED_APP.md`
- **Export/Import Documentation**: `docs/EXPORT_IMPORT_FEATURE.md`
- **Security Summary**: `security_final_summary.md`
- **Enhancement Suggestions**: `enhancement_suggestions.md`

---

## ✅ Release Checklist

- [x] Version bumped to 1.0.32
- [x] CSV export/import implemented
- [x] Cache clear bug fixed
- [x] Integration tests updated
- [x] All tests passing (55/55)
- [x] macOS build successful
- [x] 0 vulnerabilities confirmed
- [x] Documentation updated
- [x] Release notes created

---

## 🎊 Conclusion

DevPulse v1.0.32 brings powerful data management capabilities with CSV export/import, making it easier than ever to backup, migrate, and analyze your development data. The cache clear bug fix ensures a smooth user experience throughout.

**Upgrade today to take advantage of these new features!**

**Download**: `release/DevPulse-1.0.32-arm64.dmg`

---

**Version**: 1.0.32  
**Build Date**: December 7, 2025  
**Platform**: macOS (Apple Silicon)  
**Status**: ✅ Production Ready  
**Security**: 🔒 0 Vulnerabilities
