# 📋 DevPulse Documentation Index

Welcome to DevPulse! This document helps you find the right documentation for your needs.

---

## 🚀 Getting Started

**New to DevPulse? Start here:**

1. **[QUICKSTART.md](./QUICKSTART.md)** ⭐
   - Step-by-step installation
   - First-time setup workflow
   - Common commands
   - Troubleshooting

2. **[README.md](./README.md)**  
   - Project overview
   - Features list
   - Tech stack
   - Project structure

---

## 🎨 Customization

**Want to white-label or customize DevPulse?**

- **[WHITELABEL_GUIDE.md](./WHITELABEL_GUIDE.md)**
  - Dynamic product/client management
  - Branding customization
  - Multi-industry use cases
  - Clean slate setup

---

## 🔧 Technical Details

**For developers and technical users:**

- **[HIERARCHY_CHANGES.md](./HIERARCHY_CHANGES.md)**
  - Database schema changes
  - Product → Client → Project structure
  - Migration steps
  - API changes

- **[public/assets/icons/README.md](./public/assets/icons/README.md)**
  - Logo and icon specifications
  - macOS app icon creation
  - Icon sizes and usage

---

## 📚 Quick Reference

### Installation
```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run electron:dev
```

### First-Time Workflow
1. Products → 2. Clients → 3. Projects → 4. Developers → 5. Issues

### Common Commands
```bash
npm run electron:dev      # Start app
npm run build            # Build production
npm run db:studio        # View database
```

---

## 🗂️ File Structure

```
DevPulse/
├── README.md                    # Main documentation
├── QUICKSTART.md               # Setup guide
├── WHITELABEL_GUIDE.md         # Customization guide
├── HIERARCHY_CHANGES.md        # Technical implementation
│
├── electron/                    # Electron app
│   ├── main.ts
│   ├── preload.ts
│   └── ipc/                    # Backend handlers
│
├── src/                        # React frontend
│   ├── pages/                  # All pages
│   ├── components/             # UI components
│   └── types/                  # TypeScript types
│
├── prisma/                     # Database
│   ├── schema.prisma           # Database schema
│   ├── seed.ts                 # Seed script (empty)
│   └── devpulse.db             # SQLite database
│
└── public/assets/              # Logos & icons
```

---

## 💡 Need Help?

### By Task

| I want to... | Read this |
|--------------|-----------|
| **Install DevPulse** | [QUICKSTART.md](./QUICKSTART.md) |
| **Understand features** | [README.md](./README.md) |
| **Customize branding** | [WHITELABEL_GUIDE.md](./WHITELABEL_GUIDE.md) |
| **Understand the database** | [HIERARCHY_CHANGES.md](./HIERARCHY_CHANGES.md) |
| **Replace the logo** | [public/assets/icons/README.md](./public/assets/icons/README.md) |
| **Troubleshoot issues** | [QUICKSTART.md](./QUICKSTART.md) → Troubleshooting section |

---

## 🎯 Use Cases

DevPulse is perfect for:

- ✅ **Software Agencies** - Track client projects
- ✅ **Product Companies** - Manage multiple product lines
- ✅ **Consultancies** - Organize client work
- ✅ **Internal IT** - Department project tracking
- ✅ **Freelancers** - Multi-client management

---

## ⚡ Key Features at a Glance

- 📦 **Product → Client → Project** hierarchy
- 👨‍💻 **Developer productivity** tracking
- 🐛 **Issue intelligence** & recurrence detection
- 📊 **Analytics dashboard** with charts
- 🎨 **White-label** ready
- 🌓 **Dark/Light** themes
- 💾 **SQLite** database (local, secure)
- 🖥️ **Electron** desktop app

---

**Ready to start?** → [QUICKSTART.md](./QUICKSTART.md)

**Questions?** Check the relevant documentation above or contact support.
