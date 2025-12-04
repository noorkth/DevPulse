# DevPulse - Quick Start Guide

Get DevPulse up and running in 5 minutes!

---

## 📋 Prerequisites

Before you begin, ensure you have:
- ✅ **Node.js 18+** installed ([Download](https://nodejs.org/))
- ✅ **npm** (comes with Node.js)
- ✅ **macOS** (recommended) or Linux/Windows

---

## 🚀 Installation Steps

### 1. Clone & Install

```bash
# Navigate to your projects directory
cd ~/Documents/Projects

# Clone the repository (or extract from zip)
cd DevPulse

# Install all dependencies
npm install
```

This installs:
- Electron
- React & React Router
- Prisma
- Recharts
- All development tools

### 2. Set Up Database

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev
```

This creates:
- SQLite database at `prisma/devpulse.db`
- All required tables (Products, Clients, Projects, Issues, etc.)
- **Empty database** ready for your data

### 3. Start the App

```bash
npm run electron:dev
```

The DevPulse app will launch automatically! 🎉

---

## 🎯 First Steps (In Order)

### Step 1: Create Products
1. Click **Products** in the sidebar
2. Click **+ New Product**
3. Enter your product line name (e.g., "VU Gear", "Mobile Apps", "Consulting")
4. Add description (optional)
5. Click **Create**

### Step 2: Add Clients
1. Click **Clients** in the sidebar
2. Click **+ New Client**
3. Select a **Product** from dropdown
4. Enter client name (e.g., "Acme Corporation")
5. Add contact info (optional)
6. Click **Create**

### Step 3: Create Projects
1. Click **Projects** in the sidebar
2. Click **+ New Project**
3. Select **Product** → Clients list auto-filters
4. Select **Client**
5. Fill in project details:
   - Name
   - Type (Web, Mobile, Desktop, etc.)
   - Description
   - Start date
6. Click **Create**

### Step 4: Add Developers
1. Click **Developers** in the sidebar
2. Click **+ New Developer**
3. Enter developer details:
   - Full name
   - Email
   - Skills (comma-separated)
   - Seniority level
4. Click **Create**

### Step 5: Track Issues
1. Click **Issues** in the sidebar  
2. Click **+ New Issue**
3. Select project and feature
4. Enter issue details:
   - Title
   - Description
   - Severity (low/medium/high/critical)
   - Assign to developer
5. Click **Create**

---

## 📊 Understanding the Dashboard

Once you have some data, the **Dashboard** shows:

- **Active Projects** count
- **Open Issues** count  
- **Total Developers** count
- **Average Productivity** score
- **Top Developers** by productivity
- **Issue Distribution** by severity
- **Top Buggy Features**
- **Most Stable Features**

---

## 🎨 Customization (Optional)

### Change App Name
Edit `package.json`:
```json
{
  "name": "your-app-name",
  "productName": "Your App Name"
}
```

### Replace Logo
Replace files in `public/assets/`:
- `icons/devpulse-icon.png` - Sidebar logo (40x40)
- `logos/devpulse-logo.png` - Full logo with wordmark

### Customize Colors
Edit `styles/global.css`:
```css
--color-primary: #4A90E2;     /* Blue */
--color-secondary: #6F42C1;   /* Purple */
--color-accent: #2ECC71;      /* Mint */
```

---

## 🛠️ Common Commands

```bash
# Development
npm run electron:dev          # Start app in dev mode

# Database
npm run db:migrate            # Run new migrations
npm run db:generate           # Regenerate Prisma client
npm run db:studio             # Open Prisma Studio (DB viewer)
npx prisma migrate reset      # Reset database (clears all data!)

# Build
npm run build                 # Build for production
npm run build:mac             # Build macOS .dmg installer

# Clean Start
rm prisma/devpulse.db         # Delete database
npm run db:migrate            # Recreate fresh database
```

---

## 🔧 Troubleshooting

### "window.api is undefined" Error
**Cause**: Preload script not loading properly  
**Fix**: 
```bash
# Kill all processes
pkill -f electron
pkill -f vite

# Clean rebuild
rm -rf dist-electron
npm run electron:dev
```

### Database Issues
**Problem**: Schema out of sync  
**Solution**:
```bash
npx prisma migrate reset
# This clears all data and recreates tables
```

### App Won't Start
**Check**:
1. Node version: `node -v` (should be 18+)
2. Dependencies: `npm install`
3. Prisma client: `npx prisma generate`

---

## 📁 Important Files

```
DevPulse/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts                # Empty seed (clears DB)
│   └── devpulse.db            # SQLite database file
│
├── electron/
│   ├── main.ts                # Electron main process
│   └── preload.ts             # Secure IPC bridge
│
├── src/
│   ├── pages/                 # All pages (Dashboard, Projects, etc.)
│   ├── components/            # Reusable UI components
│   └── types/index.ts         # TypeScript types
│
├── public/assets/             # Logos & icons
├── package.json               # Dependencies & scripts
└── vite.config.ts             # Build configuration
```

---

## 🎯 Next Steps

1. ✅ **Add your data** following the workflow above
2. 📊 **Explore Analytics** once you have issues tracked
3. 🎨 **Customize branding** (logos, colors, name)
4. 📦 **Build production app** when ready

---

## 💡 Pro Tips

1. **Start with 1 product** to understand the structure
2. **Use descriptive names** for products/clients/projects
3. **Assign developers to projects** for productivity tracking
4. **Track fix quality** when resolving issues for better analytics
5. **Check Dashboard daily** for team productivity insights

---

## 📚 More Documentation

- **README.md** - Full project overview
- **WHITELABEL_GUIDE.md** - Detailed white-label setup
- **HIERARCHY_CHANGES.md** - Technical implementation details

---

**Need help?** Check the documentation or contact support.

🚀 **Happy tracking!**
