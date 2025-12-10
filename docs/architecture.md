# DevPulse Architecture Documentation

System architecture and design documentation for DevPulse.

---

## System Overview

DevPulse is an Electron-based desktop application for project management and developer performance tracking, built with:

- **Frontend**: React + TypeScript + Vite
- **Backend**: Electron Main Process + Node.js
- **Database**: SQLite + Prisma ORM
- **ML/AI**: Custom prediction and matching algorithms

---

## High-Level Architecture

```mermaid
graph TB
    subgraph "Renderer Process (Browser)"
        UI[React UI Components]
        Hooks[Custom Hooks]
        State[State Management]
    end
    
    subgraph "IPC Communication"
        Bridge[Context Bridge]
        Preload[Preload Script]
    end
    
    subgraph "Main Process (Node.js)"
        IPC[IPC Handlers]
        Cache[Cache Manager]
        ML[ML Engine]
        Email[Email Service]
    end
    
    subgraph "Data Layer"
        Prisma[Prisma ORM]
        DB[(SQLite Database)]
    end
    
    UI -->|User Actions| Bridge
    Bridge -->|window.api| Preload
    Preload -->|ipcRenderer| IPC
    IPC -->|Query| Cache
    Cache -->|Miss| Prisma
    IPC -->|Predictions| ML
    IPC --> Email
    Prisma --> DB
    ML --> Prisma
```

---

## Data Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant React
    participant IPC
    participant Cache
    participant Prisma
    participant DB

    User->>React: Click "Load Issues"
    React->>IPC: window.api.issues.getAll()
    IPC->>Cache: Check cache
    
    alt Cache Hit
        Cache-->>IPC: Cached data
        IPC-->>React: Return data
    else Cache Miss
        Cache-->>IPC: Not found
        IPC->>Prisma: Query database
        Prisma->>DB: SQL Query
        DB-->>Prisma: Result set
        Prisma-->>IPC: Mapped data
        IPC->>Cache: Store in cache
        IPC-->>React: Return data
    end
    
    React-->>User: Display issues
```

---

## Component Hierarchy

```mermaid
graph TD
    App[App.tsx]
    
    App --> Layout[Layout]
    
    Layout --> Sidebar[Sidebar]
    Layout --> Routes[Router]
    
    Routes --> Dashboard[Dashboard]
    Routes --> Issues[Issues Page]
    Routes --> Projects[Projects Page]
    Routes --> Users[Users Page]
    Routes --> Performance[Developer Performance]
    
    Issues --> IssueFilters[IssueFilters]
    Issues --> IssueList[IssueList]
    Issues --> Pagination[Pagination]
    
    IssueList --> IssueCard[IssueCard]
    IssueCard --> Button[Common/Button]
    IssueCard --> Card[Common/Card]
    
    Projects --> ProductSection[ProductSection]
    ProductSection --> ProjectList[ProjectList]
    ProjectList --> ProjectCard[ProjectCard]
    
    Performance --> PerformanceHeader[PerformanceHeader]
    Performance --> MetricsGrid[PerformanceMetricsGrid]
    Performance --> Charts[Performance Charts]
    
    Charts --> VelocityChart[VelocityChart]
    Charts --> QualityChart[QualityTrendChart]
    Charts --> TeamComparison[TeamComparisonChart]
```

---

## ML Pipeline

```mermaid
graph LR
    Input[Issue Data]
    
    Input --> Collector[Data Collector]
    
    Collector --> Historical[Historical Issues<br/>Last 6 months]
    
    Historical --> Features[Feature Engineering]
    
    Features --> F1[Severity Encoding]
    Features --> F2[Project Match]
    Features --> F3[Developer Experience]
    Features --> F4[Feature Similarity]
    
    F1 --> KNN[K-NN Algorithm<br/>K=10]
    F2 --> KNN
    F3 --> KNN
    F4 --> KNN
    
    KNN --> Similarity[Similarity Calculation<br/>Cosine Distance]
    
    Similarity --> Prediction[Weighted Average<br/>Prediction]
    
    Prediction --> Confidence[Confidence Score<br/>Based on Variance]
    
    Confidence --> Cache[Cache Result<br/>1 hour TTL]
    
    Cache --> Output[Prediction Output]
    
    Output --> Value[Estimated Hours]
    Output --> Score[Confidence 0-1]
    Output --> Factors[Contributing Factors]
```

---

## Database Schema

```mermaid
erDiagram
    Product ||--o{ Client : has
    Client ||--o{ Project : has
    Project ||--o{ Issue : contains
    Project ||--o{ Feature : has
    Project ||--o{ DeveloperProject : assigned
    
    Developer ||--o{ Issue : resolves
    Developer ||--o{ DeveloperProject : works_on
    Developer ||--o{ DeveloperGoal : tracks
    
    Feature ||--o{ Issue : categorizes
    
    Product {
        string id PK
        string name
        string description
    }
    
    Client {
        string id PK
        string name
        string productId FK
        string contactInfo
    }
    
    Project {
        string id PK
        string name
        string clientId FK
        string projectType
        string status
        datetime startDate
        datetime endDate
    }
    
    Issue {
        string id PK
        string title
        string severity
        string status
        string projectId FK
        string assignedToId FK
        string featureId FK
        float resolutionTime
        int fixQuality
        bool isRecurring
    }
    
    Developer {
        string id PK
        string fullName
        string email
        string skills
        string seniorityLevel
    }
```

---

## Cache Architecture

```mermaid
graph TB
    Request[IPC Request]
    
    Request --> CacheCheck[Check Cache]
    
    CacheCheck --> L1{Level 1<br/>IPC Cache<br/>TTL: 30s}
    CacheCheck --> L2{Level 2<br/>Analytics Cache<br/>TTL: 5min}
    CacheCheck --> L3{Level 3<br/>ML Cache<br/>TTL: 1hr}
    
    L1 -->|Hit| Return1[Return Cached]
    L2 -->|Hit| Return2[Return Cached]
    L3 -->|Hit| Return3[Return Cached]
    
    L1 -->|Miss| DB[Query Database]
    L2 -->|Miss| DB
    L3 -->|Miss| DB
    
    DB --> Store[Store in Cache]
    Store --> Return4[Return Fresh Data]
    
    Write[Write Operation] --> Invalidate[Invalidate Pattern]
    Invalidate --> L1
    Invalidate --> L2
    Invalidate --> L3
```

---

## Security Architecture

```mermaid
graph LR
    Request[Client Request]
    
    Request --> RateLimit[Rate Limiter]
    
    RateLimit -->|Allowed| Validate[Input Validation<br/>Zod Schemas]
    RateLimit -->|Denied| Reject[Rate Limit Error]
    
    Validate -->|Valid| Handler[IPC Handler]
    Validate -->|Invalid| ValidationError[Validation Error]
    
    Handler --> DB[Database Query]
    
    DB --> Sanitize[Output Sanitization]
    
    Sanitize --> Response[Return Response]
```

---

## Deployment Architecture

```mermaid
graph TB
    Dev[Development]
    Prod[Production]
    
    Dev --> DevServer[Vite Dev Server<br/>Hot Reload]
    Dev --> DevDB[Development DB<br/>./devpulse.db]
    
    Prod --> Build[Electron Builder]
    Build --> macOS[macOS .app]
    Build --> Windows[Windows .exe]
    Build --> Linux[Linux AppImage]
    
    macOS --> AppData1[User Data<br/>~/Library/Application Support]
    Windows --> AppData2[User Data<br/>%APPDATA%]
    Linux --> AppData3[User Data<br/>~/.config]
```

---

## Performance Optimizations

### Database
- **Indexes**: 9 strategic indexes on frequently queried fields
- **Query Optimization**: Batch queries, select only needed fields
- **Connection Pooling**: Single Prisma instance reused

### Caching
- **LRU Cache**: Automatically evicts least recently used
- **Multi-tier**: Different TTLs for different data types
- **Pattern Invalidation**: Smart cache clearing on mutations

### Frontend
- **Code Splitting**: Lazy loading for routes
- **Component Memoization**: React.memo for expensive renders
- **Virtual Scrolling**: For large lists (1000+ items)

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Desktop Framework** | Electron 28 |
| **Frontend Framework** | React 18 + TypeScript |
| **Build Tool** | Vite 5 |
| **Routing** | React Router 6 |
| **Database** | SQLite 3 |
| **ORM** | Prisma 5 |
| **State Management** | React Hooks (useState, useContext) |
| **Charts** | Recharts |
| **Styling** | Vanilla CSS |
| **Testing** | Jest + React Testing Library |
| **Validation** | Zod |
| **ML/AI** | simple-statistics (K-NN) |

---

## Development Workflow

```mermaid
graph LR
    Code[Write Code]
    
    Code --> Lint[ESLint Check]
    Lint --> Test[Jest Tests]
    Test --> DevServer[npm run dev]
    
    DevServer --> HMR[Hot Module Reload]
    HMR --> Debug[Debug in DevTools]
    
    Debug --> Fix{Issues?}
    Fix -->|Yes| Code
   Fix -->|No| Commit[Git Commit]
    
    Commit --> Push[Push to GitHub]
    Push --> Build[Electron Build]
    
    Build --> Package[Create Installers]
    Package --> Release[GitHub Release]
```

---

## Best Practices

### Code Organization
- **Feature-based structure**: Group by feature, not file type
- **Single Responsibility**: Each module has one clear purpose
- **DRY Principle**: Reusable components and utilities

### Performance
- **Lazy loading**: Load resources only when needed
- **Debouncing**: Throttle expensive operations
- **Pagination**: Always paginate large datasets

### Security
- **Input validation**: All user input validated with Zod
- **Rate limiting**: Prevent API abuse
- **SQL injection prevention**: Prisma parameterized queries

### Testing
- **Unit tests**: For pure functions and utilities
- **Integration tests**: For IPC handlers
- **Component tests**: For React components

---

**Last Updated:** 2024-12-11
