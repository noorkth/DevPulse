# Changelog

All notable changes to DevPulse will be documented in this file.

## [3.2.0] - 2024-12-10

### 🔥 Critical Fixes
- **Fixed blank screen in packaged application**
  - Replaced `BrowserRouter` with `HashRouter` for Electron compatibility
  - `BrowserRouter` relies on HTML5 History API which doesn't work with `file://` protocol
  - All routes now use hash-based navigation (e.g., `#/dashboard`)
  - Packaged app now loads correctly on first launch

### 🔧 Configuration Improvements
- **Vite Configuration**
  - Added `base: './'` to ensure relative asset paths for Electron
  - Ensures compatibility with both development and production modes
  
- **Electron Security & Compatibility**
  - Disabled sandbox mode to prevent preload script conflicts
  - Relaxed Content Security Policy to allow React inline scripts
  - Enhanced renderer console logging for better debugging
  - Improved error reporting for production builds

### 📝 Technical Details
- Hash-based routing uses URL fragments (e.g., `file:///.../index.html#/dashboard`)
- Transparent to end users, no functionality changes
- Development mode continues to work with Vite dev server
- All existing routes and navigation remain functional

### ⚠️ Breaking Changes
- URL structure changed from path-based to hash-based routing
  - Before: `/dashboard` (dev), `file://.../dashboard` (prod - broken)
  - After: `#/dashboard` (works in both dev and prod)
- No impact on user experience or functionality

---

## [3.1.0] - 2024-12-10

### 🎉 Added
- **CSV Bulk Import for Issues**
  - Upload multiple issues via CSV file
  - Automatic validation and error reporting
  - Downloadable CSV template with examples
  - Auto-match projects/users by name/email
  - Import results summary with success/failure counts
  
- **UI/UX Enhancements**
  - Theme Toggle component (dark/light mode switcher)
  - ConfirmDialog component for confirmation prompts
  - Enhanced chart tooltips with icons and smart formatting
  - Custom Recharts theme with vibrant colors
  
- **Chart Export Features**
  - Export charts as PNG
  - Export charts as PDF
  - Export chart data as CSV
  - Copy charts to clipboard

### 🔧 Improved
- Theme persistence with localStorage
- System theme preference detection
- Smooth theme transitions
- Improved color contrasts (WCAG AA compliant)
- Better dark mode support for charts
- Project-scoped feature lookup in CSV import

### 🐛 Fixed
- Layout scrolling issues
- Theme toggle placement (moved to top-right)
- CSV import tags format (now JSON string array)
- Feature lookup in bulk import

### 📦 Dependencies
- Added `papaparse` for CSV parsing
- Added `html2canvas` for image export
- Added `jspdf` for PDF generation
- Added `@types/papaparse`

### 🔒 Security
- Rate limiting on bulk import operations
- Input validation for CSV data
- Sanitized file uploads

---

## [3.0.1] - 2024-12-09
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [3.0.1-beta] - 2025-12-09

### Added
- **Role-Based User Management System**
  - Developers can be assigned issues
  - Project Managers cannot be assigned issues
  - Role selection during user creation
  - Separate visual sections for Developers and Project Managers
  - Role-based filtering in assignment dropdowns
  - `role` field added to Developer database schema with migration

- **Advanced Issue Filtering**
  - Filter by severity (Critical, High, Medium, Low)
  - Filter by assigned developer
  - Filter by project
  - Filter by client
  - Filter by status (Open, In Progress, Resolved)
  - Multiple filters can be combined
  - Live count of filtered results
  - Quick reset button

- **User Search Functionality**
  - Real-time search across all users
  - Search by full name
  - Search by email address
  - Search by seniority level
  - Works within role-based sections
  - Visual feedback with result counts

- **Skill-Based Issue Assignment**
  - Intelligent issue distribution based on developer skills
  - Backend issues assigned to backend developers
  - Frontend issues assigned to frontend developers
  - iOS issues assigned to iOS developers
  - Mobile issues assigned to mobile developers
  - DevOps issues assigned to DevOps engineers
  - Test data generation script with smart assignment

- **Comprehensive Integration Testing**
  - 29 automated tests covering all functionality
  - User management (Create, Read, Update, Delete)
  - Products and Clients lifecycle
  - Projects and Features
  - Issue management and resolution
  - Analytics calculations
  - Export/Import validation
  - Data cleanup verification
  - 100% test pass rate
  - ~20-25ms execution time

- **Database Scripts**
  - `scripts/integration-test.ts` - Full integration test suite
  - `scripts/generate-skill-based-issues.ts` - Smart test data generator
  - `scripts/update-roles.ts` - Role migration utility

### Changed
- **Page Renaming**
  - "Developers" page renamed to "Users"
  - Routes updated: both `/developers` and `/users` work
  - Page title changed to "Team Users"

- **User Interface Updates**
  - User creation form now includes role selection (radio buttons)
  - Seniority level options adapt based on selected role
  - Users page split into two sections with count badges
  - Added search bar above user sections
  - Issue filters displayed in organized panel

- **Data Model**
  - Developer schema updated with `role` field
  - Default role: 'developer'
  - Index added on role field for performance
  - Migration scripts provided for existing databases

- **Team Structure**
  - Noor Kayastha updated to Project Manager role
  - All existing developers default to developer role
  - Updated skills and responsibilities

### Fixed
- **Dark Mode Compatibility**
  - Fixed font colors not visible in dark mode (ML Insights)
  - Added CSS variable aliases for better theme support
  - Updated hardcoded colors to use theme variables
  - Improved contrast in dark mode

- **User Management**
  - Fixed developer edit functionality
  - Corrected skills array formatting
  - Resolved form reset issues
  - Fixed modal title and button text for edit mode

- **Database & Performance**
  - Fixed cascade delete for developer-project assignments
  - Improved query performance with proper indexes
  - Resolved migration issues for role field

### Technical
- Added TypeScript types for role-based logic
- Enhanced error handling in IPC handlers
- Improved CSS organization and theme variables
- Updated Prisma schema with role field and indexes
- Added comprehensive test coverage
- Documentation updates across all guides

---

## [2.1.0] - 2025-12-05

### Added
- ML-powered bug hotspot detection
- Performance dashboard with developer metrics
- Analytics caching for improved performance
- Recurring issue tracking
- Fix quality ratings (1-5 stars)

### Changed
- Enhanced analytics calculations
- Improved dashboard visualizations
- Updated color scheme

### Fixed
- Database initialization issues
- Prisma client generation in production builds

---

## [2.0.0] - 2025-12-04

### Added
- Complete application rebuild with Electron
- SQLite database with Prisma ORM
- Dark/Light theme support
- Hierarchical organization (Product → Client → Project)
- Developer productivity tracking
- Issue management system
- Analytics and insights
- Export/Import functionality

### Changed
- Migrated from web app to desktop application
- New modern UI design
- Improved performance

---

## [1.0.0] - Initial Release

### Added
- Basic project structure
- Initial features and pages
- Core functionality

---

## Version Format

- Major version (X.0.0): Breaking changes, major rewrites
- Minor version (0.X.0): New features, non-breaking changes
- Patch version (0.0.X): Bug fixes, minor improvements
- Beta suffix (-beta): Pre-release testing versions
