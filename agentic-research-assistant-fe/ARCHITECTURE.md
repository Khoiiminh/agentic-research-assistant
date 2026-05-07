# Frontend Architecture Guide

Hướng dẫn chi tiết về cấu trúc thư mục và cách sử dụng từng phần trong ứng dụng.

## 📁 Cấu Trúc Thư Mục

```
src/
├── app/                      # Next.js App Router + Routes
├── providers/                # Global Providers
├── store/                    # State Management
├── features/                 # Feature Modules
├── shared/                   # Shared Code
├── layouts/                  # Layout Components
├── services/                 # Backend Integration
└── theme/                    # Design Tokens
```

---

## 📌 Chi Tiết Từng Folder

### 1. `src/app/` - Next.js App Router & Routes

**Mục đích:** Định nghĩa routes và layouts của ứng dụng theo Next.js 13+ App Router pattern.

**Cấu trúc:**
```
app/
├── (dashboard)/              # Route group (không ảnh hưởng URL)
│   ├── layout.tsx           # Dashboard layout
│   └── page.tsx             # Dashboard home
├── search/
│   └── page.tsx             # /search route
├── results/
│   └── page.tsx             # /results route
├── settings/
│   └── page.tsx             # /settings route
├── layout.tsx               # Root layout
└── page.tsx                 # Home page (/)
```

**Route Group `(dashboard)/`:**
- Là folder đặc biệt của Next.js, không ảnh hưởng URL
- Dùng để tổ chức các pages liên quan (ví dụ dashboard features)
- Có thể có layout riêng cho group

**Ví dụ sử dụng:**
```tsx
// src/app/page.tsx - Home page
export default function Home() {
  return <div>Welcome to Agentic Research Assistant</div>;
}

// src/app/layout.tsx - Root layout
export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

---

### 2. `src/providers/` - Global Providers

**Mục đích:** Quản lý tập trung các Context Providers và global setup.

**Các file chính:**
- `RootProvider.tsx` - Combines all providers
- `ThemeProvider.tsx` - Theme context
- `index.ts` - Exports

**Cách sử dụng:**
```tsx
// src/app/layout.tsx
import { RootProvider } from '@/providers';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <RootProvider>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
```

**Thêm Provider mới:**
```tsx
// src/providers/SearchProvider.tsx
'use client';
export function SearchProvider({ children }) {
  return <>{children}</>;
}

// src/providers/RootProvider.tsx
import { SearchProvider } from './SearchProvider';

export function RootProvider({ children }) {
  return (
    <SearchProvider>
      {children}
    </SearchProvider>
  );
}
```

---

### 3. `src/store/` - State Management

**Mục đích:** Quản lý global state (Redux, Zustand, hay Context).

**Khuyến nghị:**
- Nếu state đơn giản: dùng Context (trong `src/providers/`)
- Nếu state phức tạp: dùng Redux hay Zustand

**Cấu trúc Redux (ví dụ):**
```
store/
├── search/
│   ├── searchSlice.ts       # Search state + reducers
│   ├── searchAPI.ts         # Async thunks
│   └── index.ts
├── auth/
│   ├── authSlice.ts
│   ├── authAPI.ts
│   └── index.ts
├── rootReducer.ts           # Combine all slices
└── index.ts                 # configureStore
```

**Ví dụ Redux setup:**
```tsx
// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import searchReducer from './search/searchSlice';
import authReducer from './auth/authSlice';

export const store = configureStore({
  reducer: {
    search: searchReducer,
    auth: authReducer,
  },
});

// Sử dụng trong app
// src/providers/RootProvider.tsx
import { Provider } from 'react-redux';
import { store } from '@/store';

export function RootProvider({ children }) {
  return <Provider store={store}>{children}</Provider>;
}
```

---

### 4. `src/features/` - Feature Modules

**Mục đích:** Tổ chức code theo nghiệp vụ (business features), mỗi feature độc lập và reusable.

**Hiện có 3 features chính:**

#### **4.1 Search Feature** (`src/features/search/`)
Quản lý tìm kiếm và các kết quả liên quan.

```
search/
├── components/              # UI components
│   ├── SearchForm.tsx       # Search input form
│   ├── SearchResults.tsx    # Results display
│   └── index.ts
├── hooks/                   # Custom hooks
│   ├── useSearch.ts         # Search logic
│   └── index.ts
├── services/                # API calls
│   ├── searchService.ts     # Backend API
│   └── index.ts
├── types/                   # TypeScript types
│   └── index.ts
├── README.md
└── index.ts
```

**Ví dụ sử dụng:**
```tsx
// src/features/search/hooks/useSearch.ts
'use client';
import { useState } from 'react';
import { searchService } from '../services/searchService';
import type { SearchQuery, SearchResponse } from '../types';

export function useSearch() {
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (query: SearchQuery) => {
    setLoading(true);
    try {
      const data = await searchService.search(query);
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, error, search };
}

// Sử dụng trong component
import { useSearch } from '@/features/search/hooks';

export function SearchPage() {
  const { results, search } = useSearch();
  
  return (
    <div>
      <SearchForm onSearch={search} />
      {results && <SearchResults results={results} />}
    </div>
  );
}
```

#### **4.2 Research Feature** (`src/features/research/`)
Quản lý research projects và analysis.

```
research/
├── components/
│   ├── ResearchList.tsx
│   ├── ResearchDetail.tsx
│   └── index.ts
├── hooks/
│   ├── useResearch.ts
│   └── index.ts
├── services/
│   ├── researchService.ts
│   └── index.ts
├── types/
│   └── index.ts
├── README.md
└── index.ts
```

#### **4.3 Auth Feature** (`src/features/auth/`)
Quản lý authentication và authorization.

```
auth/
├── components/
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   ├── ProtectedRoute.tsx
│   └── index.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useAuthGuard.ts
│   └── index.ts
├── services/
│   ├── authService.ts
│   └── index.ts
├── types/
│   └── index.ts
├── README.md
└── index.ts
```

**Quy tắc Feature:**
- Mỗi feature là **self-contained module**
- Export công khai qua `index.ts`
- Import từ features: `import { SearchForm } from '@/features/search/components'`
- Tránh import từ folder con: `❌ import from '../features/search/components/SearchForm'`
- Dùng `index.ts` để export: `✅ import from '@/features/search'`

---

### 5. `src/shared/` - Shared Code

**Mục đích:** Components, hooks, utilities, types dùng chung cho toàn app.

**Cấu trúc:**
```
shared/
├── components/
│   ├── common/               # Layout components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   ├── README.md
│   │   └── index.ts
│   └── ui/                   # Reusable UI components
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Modal.tsx
│       ├── Input.tsx
│       ├── Select.tsx
│       ├── README.md
│       └── index.ts
├── hooks/                    # Shared React hooks
│   ├── useFetch.ts
│   ├── useDebounce.ts
│   ├── useLocalStorage.ts
│   ├── usePagination.ts
│   ├── README.md
│   └── index.ts
├── utils/                    # Helper functions
│   ├── constants.ts
│   ├── helpers.ts
│   ├── formatters.ts
│   ├── validators.ts
│   ├── README.md
│   └── index.ts
├── types/                    # Global types
│   ├── common.ts
│   ├── api.ts
│   ├── README.md
│   └── index.ts
└── index.ts
```

**Ví dụ sử dụng:**

```tsx
// src/shared/hooks/useFetch.ts
'use client';
export function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [url]);

  return { data, loading, error };
}

// src/shared/utils/constants.ts
export const APP_NAME = 'Agentic Research Assistant';
export const API_TIMEOUT = 30000;

// Sử dụng
import { useFetch } from '@/shared/hooks';
import { APP_NAME } from '@/shared/utils/constants';

export function MyComponent() {
  const { data } = useFetch('/api/data');
  return <h1>{APP_NAME}</h1>;
}
```

---

### 6. `src/layouts/` - Page Layouts

**Mục đích:** Layout components cho các page groups.

**Các layout:**
- `DashboardLayout.tsx` - Sidebar, header, footer
- `AuthLayout.tsx` - Minimal, centered (login, register)
- `MainLayout.tsx` - Public pages layout

**Ví dụ:**
```tsx
// src/layouts/DashboardLayout.tsx
import { Header } from '@/shared/components/common/Header';
import { Sidebar } from '@/shared/components/common/Sidebar';

export function DashboardLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main>{children}</main>
      </div>
    </div>
  );
}

// Sử dụng trong app
// src/app/(dashboard)/layout.tsx
import { DashboardLayout } from '@/layouts';

export default function Layout({ children }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
```

---

### 7. `src/services/` - Backend Integration

**Mục đích:** Layer gọi backend API, tập trung HTTP client và endpoint definitions.

**Cấu trúc:**
```
services/
├── api/
│   ├── httpClient.ts        # Axios/Fetch wrapper
│   ├── endpoints.ts         # API constants
│   └── index.ts
├── index.ts
└── README.md
```

**Ví dụ:**

```tsx
// src/services/api/httpClient.ts
import axios from 'axios';

const httpClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
});

// Request interceptor - Add token
httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - Handle errors
httpClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Handle logout
    }
    return Promise.reject(error);
  }
);

export default httpClient;

// src/services/api/endpoints.ts
export const ENDPOINTS = {
  SEARCH: '/api/search',
  RESEARCH: '/api/research',
  RESEARCH_BY_ID: (id: string) => `/api/research/${id}`,
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
};

// src/features/search/services/searchService.ts
import httpClient from '@/services/api/httpClient';
import { ENDPOINTS } from '@/services/api/endpoints';
import type { SearchQuery, SearchResponse } from '../types';

export const searchService = {
  search: async (query: SearchQuery): Promise<SearchResponse> => {
    return httpClient.post(ENDPOINTS.SEARCH, query);
  },
};
```

---

### 8. `src/theme/` - Design Tokens & Theme

**Mục đích:** Centralized design system - colors, typography, spacing, breakpoints.

**Các file:**
```
theme/
├── colors.ts                # Color palette
├── typography.ts            # Font system
├── breakpoints.ts           # Responsive breakpoints
├── spacing.ts               # Spacing scale
├── shadows.ts               # Shadow definitions
├── index.ts
└── README.md
```

**Ví dụ sử dụng:**

```tsx
// src/theme/colors.ts
export const colors = {
  primary500: '#3B82F6',
  primary600: '#2563EB',
  gray50: '#F9FAFB',
  gray500: '#6B7280',
};

// src/theme/typography.ts
export const typography = {
  fontSize: {
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
  },
  fontWeight: {
    medium: 500,
    bold: 700,
  },
};

// src/shared/components/ui/Button.tsx
import { colors, typography } from '@/theme';

export function Button({ children }) {
  return (
    <button
      style={{
        backgroundColor: colors.primary500,
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold,
      }}
    >
      {children}
    </button>
  );
}
```

---

## 🎯 Path Aliases (tsconfig.json)

Để dễ import, tsconfig.json đã cấu hình các aliases:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/app/*": ["./src/app/*"],
      "@/features/*": ["./src/features/*"],
      "@/shared/*": ["./src/shared/*"],
      "@/services/*": ["./src/services/*"],
      "@/theme/*": ["./src/theme/*"]
    }
  }
}
```

**Sử dụng:**
```tsx
// ✅ Tốt - dùng aliases
import { Button } from '@/shared/components/ui';
import { SearchForm } from '@/features/search/components';
import { colors } from '@/theme/colors';

// ❌ Tránh - relative paths
import Button from '../../../shared/components/ui/Button';
```

---

## 📋 Quy Tắc & Best Practices

### **Import Conventions**
```tsx
// ✅ Tốt
import { Button } from '@/shared/components/ui';
import { useSearch } from '@/features/search/hooks';
import { colors } from '@/theme/colors';

// ❌ Tránh
import Button from '@/shared/components/ui/Button';
import useSearch from '@/features/search/hooks/useSearch';
```

### **Feature Module Structure**
```tsx
// ✅ Features tự chứa đầy đủ logic
features/search/
├── components/
├── hooks/
├── services/
├── types/
└── index.ts  // Export công khai

// ❌ Tránh nhập data từ features khác
// features/search/hooks.ts không nên dùng features/research
```

### **Shared vs Feature**
```tsx
// ✅ Dùng shared/ cho code dùng chung 2+ features
shared/components/ui/Button.tsx  // Dùng bởi search, research, auth

// ✅ Dùng features/ cho code chỉ liên quan 1 feature
features/search/components/SearchForm.tsx  // Chỉ dùng trong search

// ❌ Không import features từ shared
shared/hooks.ts không nên import từ features/
```

### **Server vs Client Components**
```tsx
// ✅ Page - Server Component (mặc định)
src/app/search/page.tsx

// ✅ Layout - Server Component (mặc định)
src/app/(dashboard)/layout.tsx

// ✅ Interactive components - Client Component
'use client';
src/features/search/components/SearchForm.tsx

// ✅ Hooks - Client (cần 'use client')
'use client';
src/features/search/hooks/useSearch.ts
```

---

## 🚀 Workflow Mẫu

### **Thêm Feature Mới (VD: Comment)**

1. **Tạo feature folder:**
   ```
   src/features/comment/
   ├── components/
   ├── hooks/
   ├── services/
   ├── types/
   └── index.ts
   ```

2. **Tạo types:**
   ```tsx
   // src/features/comment/types/index.ts
   export interface Comment {
     id: string;
     content: string;
     author: User;
   }
   ```

3. **Tạo hooks:**
   ```tsx
   // src/features/comment/hooks/useComments.ts
   'use client';
   export function useComments(targetId: string) { /* ... */ }
   ```

4. **Tạo components:**
   ```tsx
   // src/features/comment/components/CommentForm.tsx
   'use client';
   import { useComments } from '../hooks';
   
   export function CommentForm() { /* ... */ }
   ```

5. **Tạo services:**
   ```tsx
   // src/features/comment/services/commentService.ts
   export const commentService = {
     create: async (data) => { /* ... */ },
   };
   ```

6. **Export từ index.ts:**
   ```tsx
   // src/features/comment/index.ts
   export * from './components';
   export * from './hooks';
   export * from './types';
   ```

7. **Dùng trong pages/components:**
   ```tsx
   import { CommentForm } from '@/features/comment';
   ```

---

## 📞 Cấu Trúc Tệp Tham Khảo

Mỗi folder có `README.md` để giải thích mục đích và cách sử dụng:
- `src/features/search/README.md`
- `src/shared/components/ui/README.md`
- `src/services/api/README.md`
- `src/theme/README.md`
- `src/layouts/README.md`

---

## 🎓 Tóm Tắt

| Folder | Mục Đích | Khi Nào Dùng |
|--------|---------|-------------|
| `app/` | Routes & Layouts | Định nghĩa URL và page |
| `providers/` | Global Providers | Context, Redux, QueryClient |
| `store/` | State Management | Global state (Redux/Zustand) |
| `features/` | Business Logic | Modules độc lập (Search, Auth) |
| `shared/` | Reusable Code | Components, hooks dùng 2+ nơi |
| `layouts/` | Page Layouts | DashboardLayout, AuthLayout |
| `services/` | Backend API | HTTP client, endpoints |
| `theme/` | Design Tokens | Colors, typography, spacing |

Theo cấu trúc này, dự án sẽ dễ mở rộng, test, và maintain! 🚀
