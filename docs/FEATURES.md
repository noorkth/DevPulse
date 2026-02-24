# DevPulse - Complete Feature Documentation

**Version:** 2.1.0  
**Release Date:** December 9, 2025  
**Type:** Desktop Application (Electron + React)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Core Features](#core-features)
3. [Advanced Analytics](#advanced-analytics)
4. [ML Predictive Analytics](#ml-predictive-analytics)
5. [Data Management](#data-management)
6. [System Features](#system-features)

---

## 🎯 Overview

DevPulse is a comprehensive issue tracking and project management system designed for software development teams. Built with Electron, React, and SQLite, it provides powerful analytics and ML-based insights to improve code quality and team productivity.

**Key Highlights:**
- 🏢 Complete Product → Client → Project → Issue hierarchy
- 👨‍💻 Developer management with skill tracking
- 🤖 AI-powered bug hotspot detection
- 📊 Advanced analytics dashboards
- 💾 CSV export/import with ZIP packaging
- 🎨 Modern dark/light theme UI

---

## 🏗️ Core Features

### 1. Product Management

**Purpose:** Top-level organization unit for your applications/products

**Features:**
- Create unlimited products
- Track description and metadata
- Link to multiple clients
- View complete product hierarchy

**Example Use:**
```
Product: "E-commerce Platform"
├─ Client: ABC Corp
├─ Client: XYZ Inc
└─ ...
```

---

### 2. Client Management

**Purpose:** Manage customers/clients using your products

**Features:**
- Client profiles with contact information
- Product association
- Project tracking per client
- Filtered views by product

**Hierarchy:**
```
Product
└─ Client (1:N)
   └─ Projects
```

---

### 3. Project Management

**Purpose:** Individual development projects for clients

**Features:**
- Project type classification (web, mobile, desktop, API, other)
- Status tracking (active/archived)
- Start/end date management
- Developer team assignment
- Feature and issue tracking

**Fields:**
- Name
- Description
- Project Type
- Status
- Timeline (start/end dates)
- Assigned developers

**Example:**
```
Client: ABC Corp
└─ Project: "Mobile App v2.0"
   ├─ Type: Mobile
   ├─ Status: Active
   ├─ Team: 3 developers
   └─ Issues: 15 active
```

---

### 4. Developer Management

**Purpose:** Track development team members and their work

**Features:**
- Developer profiles
- Skill set documentation
- Seniority level tracking
- Project assignments
- Performance metrics
- Issue assignment tracking

**Seniority Levels:**
- Junior
- Mid-level
- Senior
- Lead
- Principal

**Analytics:**
- Issues assigned
- Issues resolved
- Average resolution time
- Fix quality rating
- Productivity score

---

### 5. Feature Management

**Purpose:** Organize code modules/features within projects

**Features:**
- Feature categorization
- Project linkage
- Issue tracking per feature
- Bug hotspot detection per feature

**Example:**
```
Project: E-commerce Platform
├─ Feature: Authentication
│  └─ 5 issues
├─ Feature: Payment Processing
│  └─ 12 issues
└─ Feature: Shopping Cart
   └─ 3 issues
```

---

### 6. Issue Tracking

**Purpose:** Comprehensive bug and task management

**Core Fields:**
- Title & Description
- Severity (low, medium, high, critical)
- Status (open, in_progress, resolved, closed)
- Project & Feature linkage
- Developer assignment
- Notes & attachments

**Advanced Features:**
- Recurrence detection
- Resolution time tracking
- Fix quality rating (1-5 stars)
- Automatic metrics calculation

**Severity Levels:**
- 🔴 **Critical** - System down, immediate action
- 🟠 **High** - Major functionality broken
- 🟡 **Medium** - Feature impaired
- 🟢 **Low** - Minor issue

**Status Flow:**
```
Open → In Progress → Resolved → Closed
```

**Resolution Workflow:**
1. Create issue
2. Assign to developer
3. Developer works on it (in_progress)
4. Mark as resolved with quality rating
5. System calculates resolution time
6. Archive as closed

---

## 📊 Advanced Analytics

### 1. Performance Dashboard

**Location:** `/performance`

**Features:**

#### KPI Cards
- **Total Issues** - Overall count with open/closed breakdown
- **Resolution Rate** - Percentage of resolved issues
- **Avg Fix Time** - Mean time to resolution in hours
- **Recurring Issues** - Issues that reappear

#### Developer Productivity Chart
- Bar chart showing productivity scores
- Issues resolved per developer
- Top 10 performers

#### Resolution Time by Severity
- Bar chart comparing fix times
- Critical vs High vs Medium vs Low
- Pattern identification

#### Issue Status Distribution
- Pie chart of open/resolved/recurring
- Visual breakdown of current state

#### Top Performers List
- Ranked developer leaderboard
- Productivity scores
- Stats per developer

**Use Cases:**
- Sprint planning
- Resource allocation
- Performance reviews
- Bottleneck identification

---

### 2. Analytics Page

**Location:** `/analytics`

**Features:**
- Project-level statistics
- Time-based filtering
- Custom date ranges
- Trend analysis
- Exportable reports

**Metrics:**
- Issues created over time
- Resolution trends
- Developer performance
- Quality metrics

---

## 🤖 ML Predictive Analytics

**NEW in v2.1.0** - AI-powered insights using machine learning

### 1. Bug Hotspot Detection

**Location:** `/ml-insights`

**What It Does:**
Automatically identifies code areas with high bug risks using pattern analysis and statistical modeling.

**Algorithm:**
```
Risk Score (0-100) = 
  (Bug Density × 10) +
  (Recurring Rate × 30) +
  (Critical Bugs × 15) +
  (High Priority × 8) +
  (Open Ratio × 20)
```

**Detection Criteria:**
- Analyzes all features in your projects
- Calculates bug frequency (bugs per day)
- Identifies recurring patterns
- Tracks critical issue concentration
- Compares recent vs historical trends

**Trend Analysis:**
- **Increasing** 📈 - Bugs growing by 20%+ (last 30 days)
- **Stable** ➡️ - Consistent pattern
- **Decreasing** 📉 - Bugs reducing by 20%+

**Risk Levels:**
- 🟢 **0-29:** Low - Healthy code
- 🟡 **30-49:** Moderate - Monitor closely
- 🟠 **50-69:** High - Action needed
- 🔴 **70-100:** Critical - Urgent attention

**Example Output:**
```
Feature: "Payment Processing"
├─ Risk Score: 78 (Critical)
├─ Total Bugs: 15
├─ Critical: 3
├─ Bug Density: 0.5/day
├─ Recurrence: 40%
├─ Trend: Increasing
└─ Recommendation: "⚠️ High risk area. Code review required."
```

**Recommendations:**
System provides actionable suggestions:
- "🚨 URGENT: Multiple critical bugs"
- "⚠️ High risk and increasing"
- "🔄 High recurrence - root cause analysis"
- "⚡ Monitor closely"
- "✅ Acceptable risk level"

**UI Features:**
- Visual hotspot cards
- Color-coded risk badges
- Trend direction indicators
- Metrics grid (bugs, critical count, density, recurrence)
- Auto-refresh capability

**Technical Details:**
- **Library:** simple-statistics (50KB)
- **Algorithm:** Statistical pattern analysis
- **Data:** Last 6 months of issues
- **Performance:** <2s detection time
- **Auto-update:** On page load

---

### 2. Resolution Time Prediction

**Status:** Backend Complete, Frontend Pending

**What It Does:**
Predicts how long an issue will take to resolve using K-Nearest Neighbors algorithm.

**How It Works:**
1. Analyzes historical resolved issues
2. Finds 10 most similar issues using:
   - Severity level
   - Project context
   - Developer experience
   - Feature complexity
3. Calculates weighted average of their resolution times
4. Returns prediction with confidence score

**Features:**
- Prediction in hours
- Confidence percentage (30-95%)
- Contributing factors explanation
- Minimum 10 historical issues required

**Example:**
```
Issue: Critical bug in authentication
↓ ML Analysis ↓
Prediction: 18 hours (85% confident)
Factors:
- Critical severity requires immediate attention
- Based on 10 similar resolved issues
- High confidence prediction
```

**Future Integration:**
- Display on issue creation form
- Sprint planning estimates
- Deadline suggestions

---

### 3. Developer Recommendation

**Status:** Backend Complete, Frontend Pending

**What It Does:**
Suggests best developer for each issue using multi-factor scoring.

**Scoring Algorithm:**
```
Total Score (0-100):
├─ Project Familiarity:  30 points
├─ Past Performance:     25 points
├─ Current Workload:     20 points (inverse)
├─ Fix Quality:          15 points
└─ Resolution Speed:     10 points
```

**Factors Analyzed:**
- Is developer on project team?
- Has resolved similar issues before?
- Current number of active issues
- Historical fix quality ratings
- Average resolution time

**Availability Levels:**
- **High:** 0-2 active issues
- **Medium:** 3-5 active issues
- **Low:** 6+ active issues

**Example Output:**
```
Top Recommendation: John Doe (Score: 85)
Reasons:
✅ Assigned to this project
📊 Resolved 5 similar critical issues
✅ Available (1 active issue)
⭐ High quality fixes (avg 4.5/5)
⚡ Fast resolver (avg 16h)
```

**Future Integration:**
- Assignment dropdown suggestions
- Auto-assignment option
- Workload balancing alerts

---

## 💾 Data Management

### 1. CSV Export

**Feature:** Export all data to CSV format in ZIP archive

**What Gets Exported:**
- Products
- Clients
- Projects
- Developers
- Developer-Project assignments
- Features
- Issues
- Metadata (export timestamp, counts)

**Format:**
```
devpulse-export-TIMESTAMP.zip
├─ products.csv
├─ clients.csv
├─ projects.csv
├─ developers.csv
├─ developer_projects.csv
├─ features.csv
├─ issues.csv
└─ metadata.json
```

**Use Cases:**
- Backup
- Data migration
- External analysis (Excel, Google Sheets)
- Archival

**Process:**
1. Click "Export Data" in Settings
2. Select save location
3. ZIP file with all CSVs created
4. Success notification

---

### 2. CSV Import

**Feature:** Import data from exported ZIP archive

**Import Modes:**
1. **Merge Data** - Add to existing (keeps current data)
2. **Replace All** - Clear and import (warning dialog)

**Safety Features:**
- User confirmation required
- Data validation before import
- UUID preservation for relationships
- Error handling with rollback

**Process:**
1. Click "Import Data"
2. Select ZIP file
3. Choose merge/replace mode
4. Confirm action
5. Import completes
6. Success/error notification

**Supported Format:**
- Must be ZIP archive
- Must contain valid CSV files
- Must have metadata.json
- Created by DevPulse export only

---

### 3. Cache Management

**Feature:** Clear application cache

**What Gets Cleared:**
- HTTP cache
- Service workers
- Cache storage
- **NOT cleared:** localStorage, IndexedDB (preserves session)

**Safety:**
- Confirmation dialog required
- Automatic app restart offered
- Data integrity maintained

**Use Cases:**
- Performance issues
- UI glitches
- Force refresh
- Troubleshooting

---

## ⚙️ System Features

### 1. Theme Support

**Options:**
- 🌙 Dark Mode (default)
- ☀️ Light Mode

**Features:**
- System-wide theme toggle
- Persistent preference
- Smooth transitions
- All components themed

**CSS Variables:**
- `--bg-primary`
- `--text-primary`
- `--card-bg`
- `--border-color`
- Custom severity colors

---

### 2. Security Features

**Input Validation:**
- Zod schema validation
- Type safety
- SQL injection prevention
- XSS protection

**Rate Limiting:**
- Prevents API abuse
- Configurable limits
- Per-endpoint controls

**Content Security Policy:**
- Strict in production
- Developer-friendly in dev mode
- XSS mitigation
- Resource loading controls

---

### 3. Database

**Technology:** SQLite with Prisma ORM

**Location:**
- **macOS:** `~/Library/Application Support/devpulse/`
- **Windows:** `%APPDATA%/devpulse/`
- **Linux:** `~/.config/devpulse/`

**Features:**
- Automatic initialization
- Migration support
- Relationship integrity
- Transaction support
- Backup-friendly single file

**Schema:**
- 8 main tables
- Cascading deletes
- Foreign key constraints
- Indexed queries

---

## 🎨 User Interface

### Navigation

**Sidebar Menu:**
- 📊 Dashboard - Overview stats
- 📦 Products - Product management
- 👥 Clients - Client management
- 🗂️ Projects - Project tracking
- 🐛 Issues - Issue management
- 👨‍💻 Developers - Team management
- 📈 Analytics - Advanced reports
- ⚡ Performance - KPI dashboard
- 🤖 ML Insights - AI predictions
- ⚙️ Settings - Configuration

### Design System

**Components:**
- Card-based layouts
- Modal dialogs
- Form inputs with validation
- Button variants
- Loading states
- Empty states
- Toast notifications

**Responsive:**
- Desktop optimized
- Grid layouts
- Flexbox containers
- Mobile-friendly (future)

---

## 🔧 Technical Stack

**Frontend:**
- React 18
- TypeScript
- React Router
- Recharts (analytics)
- Custom CSS

**Backend:**
- Electron
- Node.js
- Prisma ORM
- SQLite database
- simple-statistics (ML)

**Build:**
- Vite bundler
- Electron Builder
- TypeScript compiler

**Dependencies:**
```json
{
  "electron": "^33.2.1",
  "react": "^18.3.1",
  "prisma": "^6.1.0",
  "recharts": "^2.15.0",
  "zod": "^3.24.1",
  "simple-statistics": "^7.8.3"
}
```

---

## 📦 Build & Development

### Development Mode

```bash
# Install dependencies
npm install

# Run in dev mode
npm run dev
```

**Features:**
- Hot reload
- DevTools enabled
- Source maps
- Fast refresh

### Production Build

```bash
# Build for macOS
npm run build:mac

# Build for Windows
npm run build:win

# Build for all platforms
npm run build
```

**Output:**
- DMG installer (macOS)
- EXE installer (Windows)
- App bundle
- Portable ZIP

---

## 🧪 Testing

**Integration Tests:**
```bash
npm run test:integration
```

**Coverage:**
- 53+ test cases
- Complete CRUD operations
- Hierarchy validation
- Export/import testing
- Data integrity checks

---

## 📈 Version History

### v2.1.0 (Current)
- ✨ ML Predictive Analytics
- 🔥 Bug Hotspot Detection
- 🤖 Resolution Time Prediction
- 👨‍💻 Developer Recommendation
- ⚡ Performance Dashboard
- 🐛 Issue creation validation fixes

### v2.0.1
- 💾 CSV Export/Import
- 🔄 Cache Management
- 🛡️ Enhanced Security
- 📊 Advanced Analytics

### v1.0.32
- 📦 Initial stable release
- 🏢 Complete hierarchy
- 🐛 Issue tracking
- 👨‍💻 Developer management

---

## 🎯 Use Cases

### For Developers
- Track assigned issues
- View resolution times
- Monitor fix quality
- Skill documentation

### For Team Leads
- Resource allocation
- Performance tracking
- Workload balancing
- Quality assurance

### For Managers
- Project health monitoring
- Risk identification
- Data-driven decisions
- Client reporting

### For Organizations
- Multi-product management
- Client relationship tracking
- Historical analysis
- Trend forecasting

---

## 🚀 Getting Started

**First Run:**
1. Launch DevPulse
2. Create your first Product
3. Add Clients
4. Create Projects
5. Assign Developers
6. Start tracking Issues

**Best Practices:**
- Regular data exports
- Use severity levels correctly
- Rate fix quality for better ML
- Review ML Insights weekly
- Keep developer profiles updated

---

## 💡 Pro Tips

1. **Use ML Insights** - Check hotspots weekly to prevent major issues
2. **Export Regularly** - Backup data monthly
3. **Quality Ratings** - Rate all fixes for better predictions
4. **Categories** - Use features to organize related issues
5. **Trends** - Watch the Performance Dashboard for patterns

---

## 📞 Support

**Documentation:** See project README
**Issues:** GitHub Issues
**Updates:** Check for new releases

---

**Built with ❤️ for development teams**  
*DevPulse - Smart Issue Tracking*
