# Tayaree Customer Web - Architecture & Implementation Guidelines

This guide defines the standards, layouts, component structure, responsive guidelines, and design tokens for the Tayaree Customer Web application. It acts as the **source of truth** for all code changes.

---

## 🎨 1. Design System & Theme Tokens

All styles must rely on the centralized CSS variables defined in [globals.css](file:///Users/mtr/Development/Tayaari%20Projects/Customer%20Web/customer-web/src/app/globals.css). Changing a theme variable here will update it app-wide.

### CSS Variables (Tokens)
```css
:root {
  /* Brand Colors */
  --primary: #D71921;
  --primary-dark: #A80E14;
  --primary-light: rgba(215, 25, 33, 0.08);

  /* Backgrounds & Surfaces */
  --bg: #F0F0F0;
  --card: #FFFFFF;
  --surface: #F7F7F7;

  /* Typography Colors */
  --text-primary: #111111;
  --text-secondary: #666666;
  --text-muted: #9E9E9E;

  /* Borders & Inputs */
  --border: #E4E4E4;
  --input-bg: #EBEBEB;

  /* State Colors */
  --success: #1A7A36;
  --amber: #C8920A;

  /* Border Radii */
  --radius-s: 6px;
  --radius-m: 14px;
  --radius-l: 18px;
  --radius-full: 999px;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05);
  --shadow-md: 0 2px 8px rgba(0,0,0,0.07), 0 12px 40px rgba(0,0,0,0.09);
  --shadow-btn: 0 4px 18px rgba(215, 25, 33, 0.35);

  /* Fonts */
  --font-poppins: 'Poppins', sans-serif;
}
```

---

## 📐 2. Global Layout & Styling Integration

The main HTML structure is wrapped inside Next.js `src/app/layout.tsx`.

### Typography (Poppins Font)
Instead of importing the Poppins font from Google CDN via `<link>`, use Next.js's optimized `next/font/google`:
```tsx
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
});
```

### Icons (Boxicons)
Integrate Boxicons globally inside `src/app/layout.tsx` by using a `<link>` in the HTML `<head>` tag:
```tsx
<link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet" />
```

---

## 🧩 3. Reusable Components & CSS Modules

To keep files structured and prevent styling contamination, all components must use **CSS Modules** (`*.module.css`).

### Directory Structure
```text
src/
├── app/                  # App Router Pages & Layouts
│   ├── layout.tsx        # Global Layout (Header, Footer, Providers)
│   ├── globals.css       # Global styles, variables, reset
│   └── page.tsx          # Homepage
├── components/           # Reusable Components (Global)
│   ├── layout/           # Layout-specific components
│   │   ├── Header.tsx    # Header / Top Bar (Centralized Navigation)
│   │   ├── Header.module.css
│   │   ├── Footer.tsx    # Global Footer
│   │   └── Footer.module.css
│   └── ui/               # Atomic components (Buttons, Inputs, Cards)
│       ├── Button.tsx
│       ├── Button.module.css
│       ├── Card.tsx
│       └── Card.module.css
└── lib/                  # Services & API Utility Client
    ├── api.ts            # Centralized API fetch handler
    └── types.ts          # TypeScript type definitions
```

---

## 📱 4. Responsiveness & Breakpoints

Always design mobile-first or write responsive styles matching these layout limits. Do not use random pixel values; stick to these standardized screen size breakpoints:

| Device Size | Screen Width Limit | Usage in Media Query |
| :--- | :--- | :--- |
| **Mobile (Small)** | up to `480px` | `@media (max-width: 480px)` |
| **Tablet** | up to `768px` | `@media (max-width: 768px)` |
| **Desktop (Small)** | up to `1024px` | `@media (max-width: 1024px)` |
| **Desktop (Large)** | up to `1200px` | `@media (max-width: 1200px)` |

Example of CSS Module layout adjustment:
```css
/* Header.module.css */
.headerInner {
  display: flex;
  justify-content: space-between;
  padding: 0 40px;
}

@media (max-width: 768px) {
  .headerInner {
    padding: 0 16px; /* Narrower padding on tablet/mobile */
  }
}
```

---

## 🔌 5. Centralized API Communication Layer

To align with the Flutter backend code and keep calls easy to manage in one place:
- Implement a single API client wrapper in `src/lib/api.ts`.
- Read base URL from `.env.local` (`process.env.NEXT_PUBLIC_API_URL`).
- Automatically add headers (like Bearer tokens stored in client cookies/localStorage) to requests.

Example client:
```typescript
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://dev-customer2.tayaree.com';

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'API request failed');
  }

  return response.json();
}
```
All feature repositories must consume this helper instead of using ad-hoc `fetch` requests directly.
