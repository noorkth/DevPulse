# Installed App को लागि Integration Test कसरी चलाउने?

DevPulse install गरेपछि integration test चलाउने guide.

---

## समझनुहोस्: Test Script र Installed App

**महत्वपूर्ण:**
- Test script **development project** को भाग हो
- Installed app (`.dmg` बाट install गरेको) मा test script छैन
- तर दुबै **same database** use गर्छन्!

**Database Location:**
```
~/Library/Application Support/devpulse/devpulse.db
```

---

## Method 1: Development Project राखेर Test गर्ने (Recommended)

### Step 1: App Install गर्नुहोस्
```bash
# DMG खोल्नुहोस् र drag गर्नुहोस्
open release/DevPulse-1.0.31-arm64.dmg

# Applications मा drag गर्नुहोस्
# Right-click → Open (first time)
```

### Step 2: App चलाउनुहोस्
```bash
# Installed app खोल्नुहोस्
open /Applications/DevPulse.app

# केही data बनाउनुहोस् (products, clients, projects, issues)
```

### Step 3: Development Project बाट Test चलाउनुहोस्
```bash
# Development folder मा जानुहोस्
cd ~/Documents/Personal\ project/antigravity\ projects/DevPulse

# App बन्द गर्नुहोस् (database lock नहोस् भनेर)
# Applications → DevPulse → Quit

# Test चलाउनुहोस्
npm run test:integration
```

**यसले के गर्छ:**
- Installed app को database मा test data बनाउँछ
- पूरा workflow test गर्छ
- Test data cleanup गर्छ
- तपाईंको real data safe रहन्छ

---

## Method 2: Standalone Test Script (App सँगै bundle गर्ने)

यदि तपाईं development project delete गर्न चाहनुहुन्छ भने, test script app सँगै bundle गर्न सकिन्छ।

### Setup: Test Script Bundle गर्ने

#### 1. Test Script को Executable बनाउनुहोस्

```bash
# Development folder मा
cd ~/Documents/Personal\ project/antigravity\ projects/DevPulse

# Standalone executable बनाउनुहोस्
npx esbuild scripts/test-integration.ts \
  --bundle \
  --platform=node \
  --target=node18 \
  --outfile=release/devpulse-test \
  --external:@prisma/client \
  --external:prisma
```

#### 2. Dependencies सँगै copy गर्नुहोस्

```bash
# Test resources folder बनाउनुहोस्
mkdir -p release/test-bundle

# Test script copy गर्नुहोस्
cp scripts/test-integration.ts release/test-bundle/

# Node modules copy गर्नुहोस् (Prisma चाहिन्छ)
cp -r node_modules/@prisma release/test-bundle/
cp -r node_modules/.prisma release/test-bundle/
cp package.json release/test-bundle/
```

#### 3. README बनाउनुहोस्

```bash
cat > release/test-bundle/README.md << 'EOF'
# DevPulse Integration Test

## Installation
1. Make sure DevPulse app is installed
2. Quit the DevPulse app (if running)
3. Install dependencies:
   ```bash
   npm install tsx @prisma/client
   ```

## Run Test
```bash
npx tsx test-integration.ts
```

## What it does
- Tests complete app workflow
- Creates test data
- Verifies all operations
- Cleans up after test

Your real data is safe!
EOF
```

#### 4. ZIP बनाउनुहोस्

```bash
cd release
zip -r devpulse-test-bundle.zip test-bundle/
```

---

## Method 3: App मा Built-in Test Feature (Advanced)

### Electron App मा Test Menu थप्ने

यो advanced option हो - app भित्रै test button हाल्ने।

#### `electron/main.ts` मा menu थप्नुहोस्:

```typescript
import { Menu } from 'electron';

// Create menu
const menu = Menu.buildFromTemplate([
  {
    label: 'DevPulse',
    submenu: [
      {
        label: 'Run Integration Test',
        click: async () => {
          // Run test in background
          const { exec } = require('child_process');
          exec('npx tsx scripts/test-integration.ts', (err, stdout) => {
            if (err) {
              dialog.showErrorBox('Test Failed', err.message);
            } else {
              dialog.showMessageBox({
                type: 'info',
                title: 'Test Complete',
                message: stdout
              });
            }
          });
        }
      },
      { type: 'separator' },
      { role: 'quit' }
    ]
  }
]);

Menu.setApplicationMenu(menu);
```

तर यो गर्न development dependencies चाहिन्छ installed app मा!

---

## सिफारिस गरिएको Workflow

### Daily Use:
1. **Installed App** use गर्नुहोस् (`.dmg` बाट)
2. Normal काम गर्नुहोस्

### Testing After Updates:
1. **Development project** राख्नुहोस् backup को रूपमा
2. App बन्द गर्नुहोस्
3. `npm run test:integration` चलाउनुहोस्
4. Results हेर्नुहोस्

### Clean Uninstall:
```bash
# App delete गर्नुहोस्
rm -rf /Applications/DevPulse.app

# Database delete गर्नुहोस् (optional - data हराउँछ!)
rm -rf ~/Library/Application\ Support/devpulse

# Development project delete गर्नुहोस् (optional)
rm -rf ~/Documents/Personal\ project/antigravity\ projects/DevPulse
```

---

## Quick Testing Script

Development project बाट यो script चलाउनुहोस्:

```bash
#!/bin/bash
# save as: test-installed-app.sh

echo "🧪 Testing Installed DevPulse App"
echo "=================================="

# Check if app is installed
if [ ! -d "/Applications/DevPulse.app" ]; then
  echo "❌ DevPulse not installed in /Applications"
  exit 1
fi

# Check if app is running
if pgrep -x "DevPulse" > /dev/null; then
  echo "⚠️  DevPulse is running. Please quit the app first."
  echo "   Applications → DevPulse → Quit"
  exit 1
fi

# Check if database exists
if [ ! -f "$HOME/Library/Application Support/devpulse/devpulse.db" ]; then
  echo "⚠️  Database not found. Please run the app at least once."
  exit 1
fi

echo "✅ App installed"
echo "✅ App not running"
echo "✅ Database exists"
echo ""
echo "Running integration test..."
echo ""

npm run test:integration

echo ""
echo "✅ Test complete!"
echo "You can now open DevPulse app again."
```

**Use:**
```bash
chmod +x test-installed-app.sh
./test-installed-app.sh
```

---

## Common Issues

### Issue 1: "Database is locked"
**Cause:** App चलिरहेको छ  
**Fix:** App बन्द गर्नुहोस्
```bash
killall DevPulse
```

### Issue 2: "Cannot find module @prisma/client"
**Cause:** Development dependencies छैनन्  
**Fix:** Development folder मा install गर्नुहोस्
```bash
npm install
```

### Issue 3: "Database file not found"
**Cause:** App कहिल्यै चलाएको छैन  
**Fix:** App पहिलो पटक खोल्नुहोस्, after database बन्छ

---

## सारांश

**Best Practice:**
1. ✅ Development project folder राख्नुहोस्
2. ✅ Installed app daily use को लागि
3. ✅ Test script updates पछि चलाउनुहोस्
4. ✅ Same database दुबै use गर्छन्

**तपाईंलाई चाहिएको:**
- Development folder (test script को लागि)
- Installed app (daily use को लागि)  
- Regular testing (updates पछि)

---

के test script app सँगै bundle गर्न चाहनुहुन्छ? या development folder राखेर test गर्न चाहनुहुन्छ?
