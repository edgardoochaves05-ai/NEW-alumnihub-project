# Styling Guide

## Framework

AlumniHub uses **Tailwind CSS** for all styling. No separate CSS files per component — everything uses utility classes inline.

## Color Palette

### Primary (Blue)
Used for primary actions, active states, and key UI elements.
```
bg-blue-600   → Primary buttons, active nav items
bg-blue-700   → Button hover state
bg-blue-100   → Light badge backgrounds
text-blue-600 → Links, accent text
```

### Neutral (Gray)
Used for backgrounds, borders, text hierarchy.
```
bg-gray-900   → Sidebar background
bg-gray-50    → Page background
bg-white      → Cards, content areas
text-gray-900 → Primary text
text-gray-700 → Secondary text
text-gray-500 → Muted text / descriptions
text-gray-400 → Placeholder text, sidebar inactive
border-gray-200 → Card borders
border-gray-300 → Input borders
```

### Status Colors
```
Green  → bg-green-100 text-green-800 → Success, verified, strong match
Yellow → bg-yellow-100 text-yellow-800 → Warning, pending, good match
Red    → bg-red-100 text-red-800 → Error, danger, declined
```

## Component Classes

Defined in `client/src/styles/index.css`:

```css
.btn-primary    → Blue button with hover and focus states
.btn-secondary  → White button with border
.btn-danger     → Red button for destructive actions
.card           → White card with rounded corners, shadow, border
.input-field    → Standard text input styling
.label          → Form label styling
.badge          → Inline status badge
.badge-green    → Green status badge
.badge-blue     → Blue status badge
.badge-yellow   → Yellow status badge
.badge-red      → Red status badge
```

## Layout Patterns

### Page Layout
Every page renders inside the `Layout` component which provides the sidebar and main content area. Pages should not include their own sidebar or navigation.

```jsx
export default function MyPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Page Title</h1>
      <p className="text-gray-500 mt-1">Page description</p>

      <div className="mt-6">
        {/* Page content */}
      </div>
    </div>
  );
}
```

### Card Grid
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div className="card">...</div>
  <div className="card">...</div>
  <div className="card">...</div>
</div>
```

### Stats Row
```jsx
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <div className="card">
    <p className="text-sm text-gray-500">Total Alumni</p>
    <p className="text-3xl font-bold text-gray-900 mt-1">950</p>
  </div>
</div>
```

### Form Layout
```jsx
<div className="card max-w-2xl">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className="label">First Name</label>
      <input className="input-field" />
    </div>
    <div>
      <label className="label">Last Name</label>
      <input className="input-field" />
    </div>
  </div>
  <button className="btn-primary mt-4">Save</button>
</div>
```

### Search + Filter Bar
```jsx
<div className="flex flex-col sm:flex-row gap-3 mb-6">
  <input className="input-field flex-1" placeholder="Search..." />
  <select className="input-field w-48">
    <option value="">All Programs</option>
  </select>
  <select className="input-field w-40">
    <option value="">All Types</option>
  </select>
</div>
```

## Typography

- Font: Inter (loaded from Google Fonts)
- Page titles: `text-2xl font-bold text-gray-900`
- Section headings: `text-lg font-semibold text-gray-900`
- Body text: `text-sm text-gray-700` or default (14px)
- Muted text: `text-sm text-gray-500`
- Labels: `text-sm font-medium text-gray-700`

## Spacing

- Page padding: Handled by Layout (`p-8`)
- Section gaps: `mt-6` between major sections
- Card padding: `p-6` (built into `.card` class)
- Form field gaps: `gap-4` in grid
- Element spacing: `mt-1` for tight, `mt-2` for normal, `mt-4` for loose

## Responsive Design

- Use Tailwind breakpoints: `sm:`, `md:`, `lg:`, `xl:`
- Mobile-first approach (default styles are mobile, breakpoints add desktop)
- Sidebar collapses on mobile (TODO: implement hamburger menu)
- Cards stack vertically on mobile, grid on desktop

## Icons

Use **Lucide React** consistently. Import individual icons:
```jsx
import { Search, Filter, Plus, Edit, Trash2, ChevronRight } from "lucide-react";

<Search size={18} className="text-gray-400" />
```

Standard icon sizes: `size={16}` for inline, `size={18}` for buttons, `size={24}` for feature icons.
