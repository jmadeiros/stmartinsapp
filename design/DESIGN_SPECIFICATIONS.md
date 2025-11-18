# Complete Design Specifications - Social Homepage

**Pixel-perfect reference for colors, typography, spacing, sizing, and positioning.**

---

## 📐 Table of Contents

1. [Page Layout & Grid](#page-layout)
2. [Color System (OKLCH)](#color-system)
3. [Typography System](#typography)
4. [Spacing & Sizing](#spacing)
5. [Component Specifications](#components)
6. [Shadows & Elevation](#shadows)
7. [Animations & Transitions](#animations)
8. [Responsive Breakpoints](#responsive)

---

## 1. Page Layout & Grid {#page-layout}

### Container
```css
max-width: 1400px;
margin: 0 auto;
padding: 24px 16px;  /* py-6 px-4 */
```

### Grid Structure (Desktop > 1024px)
```css
display: grid;
grid-template-columns: 280px 1fr 320px;
gap: 24px;  /* gap-6 */
```

### Z-Index Layers
```css
z-50:  Header (sticky)
z-30:  Popovers, Dropdowns
z-20:  Modals, Dialogs
z-10:  Sidebar sticky elements
z-0:   Base content
```

---

## 2. Color System (OKLCH) {#color-system}

### Light Mode Colors

#### Base Colors
```css
--background: oklch(1 0 0);              /* #FFFFFF pure white */
--foreground: oklch(0.145 0 0);          /* #252525 near black */
--card: oklch(1 0 0);                    /* #FFFFFF white */
--card-foreground: oklch(0.145 0 0);     /* #252525 near black */
```

#### Surface & Overlay
```css
--surface: oklch(1 0 0);                 /* #FFFFFF */
--surface-secondary: oklch(0.97 0 0);    /* #F7F7F7 very light gray */
--surface-tertiary: oklch(0.94 0 0);     /* #EFEFEF light gray */
--overlay: oklch(1 0 0);                 /* #FFFFFF */
```

#### Primary (Blue)
```css
--primary: oklch(0.45 0.18 250);         /* #2463EB vibrant blue */
--primary-foreground: oklch(0.985 0 0);  /* #FAFAFA near white */
--primary/90: oklch(0.405 0.162 250);    /* Hover state - darker */
--primary/20: oklch(0.45 0.18 250 / 20%); /* 20% opacity */
--primary/10: oklch(0.45 0.18 250 / 10%); /* 10% opacity */
--primary/5: oklch(0.45 0.18 250 / 5%);   /* 5% opacity */
```

#### Accent (Purple)
```css
--accent: oklch(0.65 0.22 280);          /* #8B5CF6 purple */
--accent-foreground: oklch(0.985 0 0);   /* #FAFAFA near white */
--accent/20: oklch(0.65 0.22 280 / 20%);
--accent/10: oklch(0.65 0.22 280 / 10%);
```

#### Semantic Colors
```css
/* Success (Emerald/Green) */
--success: oklch(0.65 0.18 145);         /* #10B981 emerald */
--success-foreground: oklch(0.985 0 0);
--emerald-50: oklch(0.97 0.03 145);      /* #ECFDF5 */
--emerald-100: oklch(0.93 0.06 145);     /* #D1FAE5 */
--emerald-500: oklch(0.65 0.18 145);     /* #10B981 */
--emerald-600: oklch(0.58 0.16 145);     /* #059669 */
--emerald-700: oklch(0.50 0.14 145);     /* #047857 */

/* Destructive (Red) */
--destructive: oklch(0.577 0.245 27.325); /* #EF4444 red */
--destructive-foreground: oklch(0.985 0 0);

/* Warning (Amber) */
--warning: oklch(0.75 0.15 65);          /* #F59E0B amber */
--warning-foreground: oklch(0.145 0 0);
--amber-50: oklch(0.98 0.02 65);         /* #FFFBEB */
--amber-700: oklch(0.55 0.13 65);        /* #B45309 */

/* Info (Blue) */
--info: oklch(0.65 0.15 210);            /* #3B82F6 blue */
--blue-50: oklch(0.97 0.03 250);         /* #EFF6FF */
--blue-600: oklch(0.50 0.16 250);        /* #2563EB */
--blue-700: oklch(0.45 0.14 250);        /* #1D4ED8 */
```

#### Muted & Borders
```css
--muted: oklch(0.97 0 0);                /* #F7F7F7 */
--muted-foreground: oklch(0.556 0 0);    /* #8E8E8E */
--border: oklch(0.922 0 0);              /* #EBEBEB light gray */
--border/50: oklch(0.922 0 0 / 50%);
--input: oklch(0.922 0 0);               /* #EBEBEB */
--ring: oklch(0.45 0.18 250);            /* Matches primary */
```

#### Chart Colors (for highlights/data viz)
```css
--chart-1: oklch(0.646 0.222 41.116);    /* #F97316 orange */
--chart-2: oklch(0.6 0.118 184.704);     /* #14B8A6 teal */
--chart-3: oklch(0.398 0.07 227.392);    /* #3B82F6 blue */
--chart-4: oklch(0.828 0.189 84.429);    /* #FACC15 yellow */
--chart-5: oklch(0.769 0.188 70.08);     /* #FB923C amber */
```

### Dark Mode Colors

```css
.dark {
  --background: oklch(0.145 0 0);        /* #252525 near black */
  --foreground: oklch(0.985 0 0);        /* #FAFAFA near white */
  --card: oklch(0.205 0 0);              /* #343434 elevated */
  --surface: oklch(0.18 0 0);            /* #2E2E2E */
  --overlay: oklch(0.2 0 0);             /* #333333 */
  --primary: oklch(0.65 0.22 250);       /* Lighter blue */
  --border: oklch(1 0 0 / 10%);          /* White 10% */
  --muted: oklch(0.269 0 0);             /* #444444 */
  --muted-foreground: oklch(0.708 0 0);  /* #B5B5B5 */
}
```

---

## 3. Typography System {#typography}

### Font Families
```css
--font-sans: 'Geist Sans', ui-sans-serif, system-ui, sans-serif;
--font-mono: 'Geist Mono', ui-monospace, 'Cascadia Code', monospace;
```

### Font Features
```css
font-feature-settings: "rlig" 1, "calt" 1;  /* Ligatures & alternates */
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

### Type Scale

| Class | Size | Line Height | Use Case |
|-------|------|-------------|----------|
| `text-xs` | 12px (0.75rem) | 16px (1rem) | Helper text, labels |
| `text-sm` | 14px (0.875rem) | 20px (1.25rem) | Body text, descriptions |
| `text-base` | 16px (1rem) | 24px (1.5rem) | Default body |
| `text-lg` | 18px (1.125rem) | 28px (1.75rem) | Large body |
| `text-xl` | 20px (1.25rem) | 28px (1.75rem) | Card titles |
| `text-2xl` | 24px (1.5rem) | 32px (2rem) | Section headers |
| `text-3xl` | 30px (1.875rem) | 36px (2.25rem) | Page titles |
| `text-4xl` | 36px (2.25rem) | 40px (2.5rem) | Hero text |

### Font Weights

| Class | Weight | Numeric | Use Case |
|-------|--------|---------|----------|
| `font-normal` | Normal | 400 | Body text |
| `font-medium` | Medium | 500 | Emphasis, labels |
| `font-semibold` | Semibold | 600 | Author names, section headers |
| `font-bold` | Bold | 700 | Titles, headings |

### Specific Text Styles

**Card Title:**
```css
font-size: 20px;      /* text-xl */
font-weight: 700;     /* font-bold */
line-height: 28px;    /* leading-7 */
letter-spacing: -0.025em;  /* tracking-tight */
color: var(--foreground);
```

**Body Description:**
```css
font-size: 14px;      /* text-sm */
font-weight: 400;     /* font-normal */
line-height: 20px;    /* leading-relaxed */
color: var(--muted-foreground);
```

**Author Name:**
```css
font-size: 14px;      /* text-sm */
font-weight: 600;     /* font-semibold */
line-height: 20px;
color: var(--foreground);
```

**Metadata (time, location):**
```css
font-size: 12px;      /* text-xs */
font-weight: 400;     /* font-normal */
line-height: 16px;
color: var(--muted-foreground);
```

---

## 4. Spacing & Sizing {#spacing}

### Spacing Scale

| Class | Value | Pixels | Use Case |
|-------|-------|--------|----------|
| `gap-1` / `p-1` | 0.25rem | 4px | Tight spacing |
| `gap-2` / `p-2` | 0.5rem | 8px | Button padding |
| `gap-3` / `p-3` | 0.75rem | 12px | Small padding |
| `gap-4` / `p-4` | 1rem | 16px | Default padding |
| `gap-6` / `p-6` | 1.5rem | 24px | Card padding, grid gaps |
| `gap-8` / `p-8` | 2rem | 32px | Large padding |

### Border Radius

| Class | Value | Pixels | Use Case |
|-------|-------|--------|----------|
| `rounded-md` | 0.375rem | 6px | Small elements |
| `rounded-lg` | 0.5rem | 8px | Buttons, inputs, chips |
| `rounded-xl` | 0.75rem | 12px | Cards, popovers, boxes |
| `rounded-2xl` | 1rem | 16px | Large cards |
| `rounded-full` | 9999px | ∞ | Badges, avatars |

### Component Sizing

**Buttons:**
```css
/* Small */
height: 36px;         /* h-9 */
padding: 8px 12px;    /* px-3 py-2 */
font-size: 14px;      /* text-sm */
border-radius: 8px;   /* rounded-lg */

/* Default */
height: 40px;         /* h-10 */
padding: 8px 16px;    /* px-4 py-2 */
font-size: 14px;      /* text-sm */
border-radius: 8px;   /* rounded-lg */

/* Icon */
width: 40px;          /* w-10 */
height: 40px;         /* h-10 */
padding: 0;
```

**Avatars:**
```css
/* Small */
width: 32px;          /* w-8 h-8 */
height: 32px;

/* Default */
width: 40px;          /* w-10 h-10 */
height: 40px;

/* Large */
width: 48px;          /* w-12 h-12 */
height: 48px;

/* Welcome Card */
width: 64px;          /* w-16 h-16 */
height: 64px;
```

**Input Fields:**
```css
height: 40px;         /* h-10 */
padding: 8px 12px;    /* px-3 py-2 */
font-size: 14px;      /* text-sm */
border-radius: 8px;   /* rounded-lg */
border: 1px solid var(--border);
```

**Textarea:**
```css
min-height: 72px;     /* min-h-[72px] */
padding: 8px 12px;    /* px-3 py-2 */
font-size: 16px;      /* text-base */
line-height: 24px;    /* leading-6 */
border: none;         /* borderless in create post */
```

---

## 5. Component Specifications {#components}

### Header

**Container:**
```css
position: sticky;
top: 0;
z-index: 50;
height: 64px;          /* h-16 */
padding: 0 16px;       /* px-4 */
backdrop-filter: blur(12px);
background: var(--overlay) / 95%;
border-bottom: 1px solid var(--border) / 40%;
```

**Logo Section:**
```css
/* Logo container */
padding: 8px;          /* p-2 */
border-radius: 12px;   /* rounded-xl */
background: linear-gradient(135deg, var(--primary)/20, var(--primary)/10);

/* Logo icon */
width: 20px;           /* w-5 h-5 */
height: 20px;
color: var(--primary);
```

**Brand Text:**
```css
font-size: 20px;       /* text-xl */
font-weight: 700;      /* font-bold */
letter-spacing: -0.025em;  /* tracking-tight */
color: var(--foreground);
```

**Nav Items:**
```css
padding: 8px 12px;     /* px-3 py-2 */
font-size: 14px;       /* text-sm */
font-weight: 500;      /* font-medium */
border-radius: 8px;    /* rounded-lg */
transition: all 200ms;

/* Active state */
color: var(--primary);
border-bottom: 2px solid var(--primary);  /* Animated underline */
```

**Search Bar:**
```css
/* Default */
width: 260px;
height: 40px;          /* h-10 */
padding-left: 40px;    /* pl-10 (for icon) */
padding-right: 16px;   /* pr-4 */
border-radius: 12px;   /* rounded-xl */
border: 1px solid var(--border) / 50%;
background: var(--surface) / 80%;

/* Focused */
width: 320px;          /* Expands on focus */
border: 1px solid var(--primary) / 50%;
box-shadow: 0 0 0 2px var(--primary) / 20%, 0 8px 24px var(--primary) / 20%;
```

**Notification Button:**
```css
width: 40px;           /* w-10 h-10 */
height: 40px;
border-radius: 12px;   /* rounded-xl */

/* Badge */
position: absolute;
top: -4px;             /* -top-1 */
right: -4px;           /* -right-1 */
width: 20px;           /* w-5 h-5 */
height: 20px;
font-size: 10px;       /* text-[10px] */
font-weight: 700;      /* font-bold */
background: linear-gradient(135deg, var(--primary), var(--primary)/80);
border: 2px solid var(--overlay);
border-radius: 9999px; /* rounded-full */
box-shadow: 0 4px 6px var(--primary) / 50%;

/* Pulse animation */
animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
opacity: 0.2;
```

---

### Left Sidebar

**Container:**
```css
position: sticky;
top: 96px;             /* top-24 (64px header + 32px spacing) */
width: 280px;
display: none;         /* Hidden below lg breakpoint */

@media (min-width: 1024px) {
  display: block;
}
```

**Welcome Card:**
```css
padding: 24px;         /* p-6 */
border-radius: 16px;   /* rounded-xl */
background: linear-gradient(135deg, var(--chart-2), var(--chart-1)/80, var(--chart-5));
position: relative;
overflow: hidden;
box-shadow: var(--shadow-card);

/* Gradient overlay */
&::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, white/10, transparent);
  pointer-events: none;
}
```

**Avatar (Welcome Card):**
```css
width: 64px;           /* w-16 h-16 */
height: 64px;
margin-bottom: 16px;   /* mb-4 */
border-radius: 9999px; /* rounded-full */
border: 4px solid white / 30%;
box-shadow: 0 8px 16px rgba(0,0,0,0.15);
```

**Greeting Text:**
```css
/* "Good morning," */
font-size: 24px;       /* text-2xl */
font-weight: 700;      /* font-bold */
line-height: 32px;     /* leading-tight */
color: white;
text-wrap: balance;

/* "Michael" */
font-size: 20px;       /* text-xl */
font-weight: 600;      /* font-semibold */
color: white / 95%;
```

**My Team Card:**
```css
padding: 12px 12px 10px 12px;  /* p-3 py-2.5 */
border: 1px solid var(--border) / 50%;
border-radius: 12px;   /* rounded-xl */
background: var(--surface);
box-shadow: var(--shadow-surface);
```

**Team Section Title:**
```css
font-size: 14px;       /* text-sm */
font-weight: 600;      /* font-semibold */
color: var(--foreground);
margin-bottom: 8px;    /* mb-2 */
```

**Organization Name:**
```css
font-size: 12px;       /* text-xs */
font-weight: 400;      /* font-normal */
color: var(--muted-foreground);
margin-bottom: 12px;   /* mb-3 */
text-align: center;
```

**Avatar Stack:**
```css
display: flex;
justify-content: center;
margin-left: -10px;    /* -space-x-2.5 */
margin-bottom: 12px;   /* mb-3 */

/* Individual avatars */
width: 48px;           /* w-12 h-12 */
height: 48px;
border: 2px solid var(--card);
border-radius: 9999px; /* rounded-full */
transition: all 200ms;

&:hover {
  z-index: 20;
  transform: scale(1.1);
}
```

**Activity Badge:**
```css
position: absolute;
top: -2px;             /* -top-0.5 */
left: -2px;            /* -left-0.5 */
width: 20px;           /* w-5 h-5 */
height: 20px;
border-radius: 9999px; /* rounded-full */
border: 2px solid var(--card);
z-index: 10;
display: flex;
align-items: center;
justify-content: center;

/* Icon inside */
width: 12px;           /* w-3 h-3 */
height: 12px;
color: white;

/* Colors by activity type */
background: var(--blue-500);   /* Comment: blue */
background: var(--emerald-500); /* Post: emerald */
background: var(--purple-500);  /* Event: purple */
```

**Activity Tooltip:**
```css
position: absolute;
bottom: 100%;
left: 50%;
transform: translateX(-50%);
margin-bottom: 8px;    /* mb-2 */
z-index: 30;
pointer-events: none;

/* Container */
background: var(--card);
border: 1px solid var(--border);
border-radius: 8px;    /* rounded-lg */
padding: 12px;         /* p-3 */
min-width: 200px;
box-shadow: 0 10px 40px rgba(0,0,0,0.15);

/* Arrow */
&::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: var(--border);
}
```

**Community Highlights:**
```css
/* Section header */
display: flex;
align-items: center;
gap: 8px;              /* gap-2 */
padding: 0 4px;        /* px-1 */
margin-bottom: 12px;   /* mb-3 */

/* Icon container */
padding: 6px;          /* p-1.5 */
border-radius: 8px;    /* rounded-lg */
background: var(--primary) / 10%;

/* Icon */
width: 16px;           /* w-4 h-4 */
height: 16px;
color: var(--primary);

/* Title */
font-size: 14px;       /* text-sm */
font-weight: 600;      /* font-semibold */
color: var(--foreground);

/* Subtitle */
font-size: 12px;       /* text-xs */
color: var(--muted-foreground);
margin-top: 2px;       /* mt-0.5 */
```

**Highlight Card:**
```css
height: 208px;         /* h-52 */
padding: 16px;         /* p-4 */
border-radius: 12px;   /* rounded-xl */
border: 1px solid var(--border);
background: var(--card);
position: relative;
overflow: hidden;

/* Color variants */
/* Orange */
background: linear-gradient(135deg, orange-500/10, red-500/10);
border-color: orange-500/30;

/* Blue */
background: linear-gradient(135deg, blue-500/10, cyan-500/10);
border-color: blue-500/30;

/* Default */
background: linear-gradient(135deg, primary/10, accent/10);
border-color: primary/30;
```

---

### Main Feed

**Container:**
```css
width: 100%;
min-width: 0;          /* min-w-0 (allows flex shrink) */
```

**Create Post Card:**
```css
background: white;
border-radius: 16px;   /* rounded-2xl */
padding: 32px;         /* p-8 */
border: 1px solid rgb(243, 244, 246);  /* border-gray-100 */
box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);

&:hover {
  box-shadow: 0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05);
}
```

**Welcome Header:**
```css
display: flex;
align-items: start;
gap: 16px;             /* gap-4 */
margin-bottom: 24px;   /* mb-6 */

/* Icon container */
padding: 8px;          /* p-2 */
border-radius: 12px;   /* rounded-xl */
background: linear-gradient(135deg, var(--primary)/20, var(--primary)/10);
flex-shrink: 0;

/* Icon */
width: 20px;           /* w-5 h-5 */
height: 20px;
color: var(--primary);

/* Title */
font-size: 24px;       /* text-2xl */
font-weight: 700;      /* font-bold */
letter-spacing: -0.025em;  /* tracking-tight */
color: rgb(17, 24, 39);    /* text-gray-900 */
margin-bottom: 8px;    /* mb-2 */

/* Description */
font-size: 14px;       /* text-sm */
color: rgb(75, 85, 99);    /* text-gray-600 */
line-height: 24px;     /* leading-relaxed */
```

**"This Week" Button:**
```css
flex-shrink: 0;
gap: 8px;              /* gap-2 */
background: linear-gradient(to right, rgb(168, 85, 247), rgb(236, 72, 153));
/* from-purple-500 to-pink-500 */
color: white;
box-shadow: 0 10px 15px rgb(168, 85, 247, 0.3);
position: relative;
overflow: hidden;

/* Shine effect (animated) */
&::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, transparent, white/40, transparent);
  animation: shine 8s ease-in-out infinite;
}

@keyframes shine {
  0% { transform: translateX(-100%); }
  20% { transform: translateX(100%); }
  100% { transform: translateX(100%); }
}
```

**Textarea (Create Post):**
```css
width: 100%;
min-height: 72px;      /* min-h-[72px] */
resize: none;
border: none;
outline: none;
font-size: 16px;       /* text-base */
line-height: 24px;     /* leading-6 */
color: transparent;    /* Text is transparent */
caret-color: rgb(17, 24, 39);  /* Visible caret */
background: transparent;

/* Highlighted overlay (for @mentions) */
position: relative;
z-index: 1;

/* Blue @mention text */
.mention {
  color: rgb(37, 99, 235);  /* text-blue-600 */
  font-weight: 500;          /* font-medium */
}
```

**Category Selector:**
```css
margin-bottom: 12px;   /* mb-3 */
padding-bottom: 12px;  /* pb-3 */
border-bottom: 1px solid rgb(229, 231, 235);  /* border-gray-200 */

/* Category chips */
display: inline-flex;
align-items: center;
gap: 6px;              /* gap-1.5 */
padding: 6px 10px;     /* px-2.5 py-1.5 */
border-radius: 8px;    /* rounded-lg */
font-size: 12px;       /* text-xs */
font-weight: 500;      /* font-medium */
border: 1px solid;
transition: all 400ms cubic-bezier(0.4, 0, 0.2, 1);

/* Selected state (example: wins) */
background: linear-gradient(to right, rgb(16, 185, 129, 0.1), rgb(20, 184, 166, 0.1));
border-color: rgb(16, 185, 129, 0.3);
color: rgb(4, 120, 87);  /* emerald-700 */
box-shadow: 0 1px 2px rgba(0,0,0,0.05);

/* Unselected */
background: white / 90%;
border-color: rgb(229, 231, 235);  /* gray-200 */
color: rgb(75, 85, 99);            /* gray-600 */

&:hover {
  background: rgb(249, 250, 251);   /* gray-50 */
  border-color: rgb(209, 213, 219); /* gray-300 */
}
```

**Attachment Buttons:**
```css
display: flex;
align-items: center;
gap: 8px;              /* gap-2 */
flex-wrap: nowrap;
overflow-x: auto;      /* Scrollable on mobile */
margin-bottom: 12px;   /* mb-3 */
padding-bottom: 12px;  /* pb-3 */
border-bottom: 1px solid rgb(229, 231, 235);

/* Individual buttons */
height: 36px;          /* h-9 */
padding: 0 12px;       /* px-3 */
gap: 8px;              /* gap-2 */
color: rgb(107, 114, 128);  /* text-gray-500 */
font-size: 14px;       /* text-sm */

&:hover {
  color: var(--primary);
  background: var(--primary) / 5%;
}

/* Icons */
width: 16px;           /* w-4 h-4 */
height: 16px;
```

**Linked Items (Chips):**
```css
display: flex;
flex-wrap: wrap;
gap: 6px;              /* gap-1.5 */
margin-bottom: 12px;   /* mb-3 */

/* Chip */
display: flex;
align-items: center;
gap: 6px;              /* gap-1.5 */
padding: 4px 8px;      /* px-2 py-1 */
border-radius: 9999px; /* rounded-full */
border: 1px solid;
font-size: 12px;       /* text-xs */
font-weight: 500;      /* font-medium */

/* Event chip (blue) */
background: rgb(239, 246, 255);    /* blue-50 */
border-color: rgb(191, 219, 254);  /* blue-200 */
color: rgb(29, 78, 216);           /* blue-700 */

/* Project chip (emerald) */
background: rgb(236, 253, 245);    /* emerald-50 */
border-color: rgb(167, 243, 208);  /* emerald-200 */
color: rgb(4, 120, 87);            /* emerald-700 */

/* Organization chip (purple) */
background: rgb(250, 245, 255);    /* purple-50 */
border-color: rgb(233, 213, 255);  /* purple-200 */
color: rgb(107, 33, 168);          /* purple-700 */

/* Icon */
width: 12px;           /* w-3 h-3 */
height: 12px;

/* X button */
width: 10px;           /* w-2.5 h-2.5 */
height: 10px;
padding: 2px;          /* p-0.5 */
border-radius: 9999px; /* rounded-full */

&:hover {
  background: black / 10%;
}
```

**Action Row (Bottom):**
```css
display: flex;
align-items: center;
justify-content: flex-end;
gap: 8px;              /* gap-2 */
padding-top: 8px;      /* pt-2 */

/* Create dropdown button */
height: 36px;          /* h-9 */
padding: 0 12px;       /* px-3 */
gap: 8px;              /* gap-2 */
border: 1px solid var(--border);
border-radius: 8px;    /* rounded-lg */

/* Post button */
height: 36px;          /* h-9 */
padding: 0 16px;       /* px-4 */
gap: 8px;              /* gap-2 */
background: var(--primary);
color: white;
border-radius: 8px;    /* rounded-lg */

&:hover {
  background: var(--primary) / 90%;
}

&:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

&:active {
  transform: scale(0.98);
}
```

---

### Filter Bar

```css
display: flex;
align-items: center;
justify-content: space-between;
gap: 16px;             /* gap-4 */
padding-bottom: 16px;  /* pb-4 */
border-bottom: 1px solid var(--border) / 50%;
margin-bottom: 24px;   /* mb-6 */

/* Filter buttons */
display: flex;
align-items: center;
gap: 8px;              /* gap-2 */

/* Individual filter */
height: 36px;          /* h-9 (text-sm) */
padding: 0 12px;       /* px-3 */
font-size: 14px;       /* text-sm */
font-weight: 500;      /* font-medium */
border-radius: 8px;    /* rounded-lg */
transition: all 200ms;

/* Active state */
background: var(--primary);
color: white;
box-shadow: 0 1px 2px rgba(0,0,0,0.05);

/* Inactive state */
background: transparent;
color: var(--muted-foreground);

&:hover {
  background: var(--muted);
}

/* Sort options (right side) */
font-size: 12px;       /* text-xs */
height: 32px;          /* Slightly smaller */
```

---

### Event Card

**Container:**
```css
border: 1px solid var(--border);
border-radius: 12px;   /* rounded-xl */
background: var(--card);
box-shadow: 0 1px 2px rgba(0,0,0,0.05);
transition: box-shadow 200ms;

&:hover {
  box-shadow: 0 4px 6px rgba(0,0,0,0.07);
}
```

**Card Inner Padding:**
```css
padding: 24px;         /* p-6 */
```

**Header Section:**
```css
display: flex;
align-items: start;
justify-content: space-between;
margin-bottom: 16px;   /* mb-4 */

/* Avatar section */
display: flex;
align-items: center;
gap: 12px;             /* gap-3 */

/* Avatar (single) */
width: 40px;           /* w-10 h-10 */
height: 40px;
border-radius: 9999px; /* rounded-full */
border: 2px solid var(--primary) / 20%;
flex-shrink: 0;

/* Overlapping avatars */
position: relative;
width: 44px;           /* w-11 h-11 */
height: 44px;
flex-shrink: 0;

.avatar-1 {
  position: absolute;
  top: 0;
  left: 0;
  width: 32px;         /* w-8 h-8 */
  height: 32px;
  z-index: 10;
  border: 2px solid var(--card);
}

.avatar-2 {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 32px;         /* w-8 h-8 */
  height: 32px;
  z-index: 0;
  border: 2px solid var(--card);
}

.counter {
  position: absolute;
  bottom: -4px;        /* -bottom-1 */
  left: -4px;          /* -left-1 */
  width: 20px;         /* w-5 h-5 */
  height: 20px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;     /* text-[10px] */
  font-weight: 600;    /* font-semibold */
  color: var(--foreground);
}

/* Text content */
/* Author name */
font-size: 14px;       /* text-sm */
font-weight: 600;      /* font-semibold */
color: var(--foreground);
line-height: 20px;     /* leading-tight */

/* Organization line */
font-size: 14px;       /* text-sm */
color: var(--foreground);
line-height: 20px;     /* leading-tight */
margin-top: 2px;       /* mt-0.5 */

/* Role and time */
font-size: 12px;       /* text-xs */
color: var(--muted-foreground);
margin-top: 4px;       /* mt-1 */
line-height: 16px;     /* leading-tight */

/* Menu button */
width: 32px;           /* w-8 h-8 */
height: 32px;
border-radius: 6px;    /* rounded-md */

/* Menu icon */
width: 16px;           /* w-4 h-4 */
height: 16px;
```

**Cause Badge:**
```css
display: inline-flex;
align-items: center;
gap: 6px;              /* gap-2 */
margin-bottom: 12px;   /* mb-3 */

/* Badge container */
display: inline-flex;
align-items: center;
gap: 6px;
padding: 4px 10px;     /* px-2.5 py-1 */
border-radius: 9999px; /* rounded-full */
font-size: 12px;       /* text-xs */
font-weight: 500;      /* font-medium */

/* Cause badge (rose/pink) */
background: linear-gradient(to right, rgb(254, 242, 242), rgb(252, 231, 243));
/* from-rose-50 to-pink-50 */
border: 1px solid rgb(251, 207, 232);  /* rose-200 */
color: rgb(159, 18, 57);                /* rose-700 */

/* Icon */
width: 14px;           /* w-3.5 h-3.5 */
height: 14px;
```

**Title:**
```css
font-size: 20px;       /* text-xl */
font-weight: 700;      /* font-bold */
letter-spacing: -0.025em;  /* tracking-tight */
color: var(--foreground);
line-height: 28px;
margin-bottom: 12px;   /* mb-3 */
```

**Description:**
```css
font-size: 14px;       /* text-sm */
font-weight: 400;      /* font-normal */
line-height: 20px;     /* leading-relaxed */
color: var(--muted-foreground);
margin-bottom: 16px;   /* mb-4 */
```

**Event Details Box:**
```css
margin-bottom: 16px;   /* mb-4 */
padding: 16px;         /* p-4 */
border-radius: 12px;   /* rounded-xl */
background: var(--muted) / 50%;
border: 1px solid var(--border) / 50%;

/* Details row */
display: flex;
align-items: center;
gap: 12px;             /* gap-3 */
font-size: 14px;       /* text-sm */
margin-bottom: 8px;    /* Last one: mb-0 */

/* Icon */
width: 16px;           /* w-4 h-4 */
height: 16px;
color: var(--primary);
flex-shrink: 0;

/* Date text */
font-weight: 500;      /* font-medium */
color: var(--foreground);

/* Time and location text */
font-weight: 400;      /* font-normal */
color: var(--muted-foreground);
```

**Parent Project Link:**
```css
margin-bottom: 16px;   /* mb-4 */
padding: 12px;         /* p-3 */
border-radius: 8px;    /* rounded-lg */
background: linear-gradient(to right, rgb(16, 185, 129, 0.05), rgb(20, 184, 166, 0.05));
/* from-emerald-500/5 to-teal-500/5 */
border: 1px solid rgb(16, 185, 129, 0.2);  /* emerald-500/20 */

/* Content */
display: flex;
align-items: center;
gap: 8px;              /* gap-2 */
font-size: 14px;       /* text-sm */

/* Icon */
width: 14px;           /* w-3.5 h-3.5 */
height: 14px;
color: rgb(5, 150, 105);  /* emerald-600 */

/* Label */
font-size: 12px;       /* text-xs */
color: var(--muted-foreground);

/* Link */
font-weight: 600;      /* font-semibold */
color: rgb(5, 150, 105);  /* emerald-600 */

&:hover {
  text-decoration: underline;
}
```

**Looking For Section:**
```css
margin-bottom: 20px;   /* mb-5 */

/* Label */
font-size: 12px;       /* text-xs */
font-weight: 600;      /* font-semibold */
text-transform: uppercase;
letter-spacing: 0.05em;  /* tracking-wide */
color: var(--muted-foreground);
margin-bottom: 8px;    /* mb-2 */

/* Chips container */
display: flex;
flex-wrap: wrap;
gap: 8px;              /* gap-2 */

/* Volunteer chip (amber) */
display: inline-flex;
align-items: center;
gap: 6px;              /* gap-1.5 */
padding: 4px 12px;     /* px-3 py-1 */
border-radius: 9999px; /* rounded-full */
font-size: 12px;       /* text-xs */
font-weight: 500;      /* font-medium */
background: rgb(255, 251, 235);    /* amber-50 */
border: 1px solid rgb(253, 230, 138);  /* amber-200 */
color: rgb(180, 83, 9);            /* amber-700 */

/* Icon */
width: 14px;           /* w-3.5 h-3.5 */
height: 14px;

/* Participants chip (blue) */
background: rgb(239, 246, 255);    /* blue-50 */
border-color: rgb(191, 219, 254);  /* blue-200 */
color: rgb(29, 78, 216);           /* blue-700 */

/* Partners chip (purple) */
background: rgb(250, 245, 255);    /* purple-50 */
border-color: rgb(233, 213, 255);  /* purple-200 */
color: rgb(107, 33, 168);          /* purple-700 */
```

**Interest Counter:**
```css
margin-bottom: 16px;   /* mb-4 */
font-size: 14px;       /* text-sm */
color: var(--muted-foreground);

/* Numbers */
font-weight: 500;      /* font-medium */
color: var(--foreground);
```

**Footer Section:**
```css
border-top: 1px solid var(--border);
padding-top: 16px;     /* pt-4 */

/* Container */
display: flex;
flex-wrap: wrap;
align-items: center;
justify-content: space-between;
gap: 12px;             /* gap-3 */

/* Left side (engagement) */
display: flex;
align-items: center;
gap: 12px;             /* gap-3 */

/* Like/Comment buttons */
display: flex;
align-items: center;
gap: 8px;              /* gap-2 */
padding: 6px 8px;      /* px-2 py-1.5 (size-sm) */
border-radius: 6px;    /* rounded-md */
color: var(--muted-foreground);
background: transparent;
transition: all 200ms;

&:hover {
  color: var(--foreground);
  background: var(--muted);
}

/* Icon */
width: 16px;           /* w-4 h-4 */
height: 16px;

/* Count */
font-size: 12px;       /* text-xs */

/* Right side (actions) */
display: flex;
align-items: center;
gap: 12px;             /* gap-3 */

/* Attend button */
display: flex;
align-items: center;
gap: 8px;              /* gap-2 */
height: 36px;          /* size-sm */
padding: 0 12px;       /* px-3 */
font-size: 14px;       /* text-sm */
font-weight: 500;      /* font-medium */
border-radius: 8px;    /* rounded-lg */
transition: all 200ms;

/* Not attending state */
background: rgb(239, 246, 255);      /* blue-50 */
border: 1px solid rgb(191, 219, 254);  /* blue-200 */
color: rgb(29, 78, 216);               /* blue-700 */

&:hover {
  background: rgb(219, 234, 254);    /* blue-100 */
}

/* Attending state */
background: rgb(37, 99, 235);        /* blue-600 */
border: 1px solid rgb(191, 219, 254);  /* blue-200 */
color: white;

&:hover {
  background: rgb(29, 78, 216);      /* blue-700 */
}

&:active {
  transform: scale(0.98);
}

/* Icon */
width: 16px;           /* w-4 h-4 */
height: 16px;

/* Count badge */
font-size: 12px;       /* text-xs */
font-weight: 400;      /* font-normal */
color: rgb(191, 219, 254);  /* blue-200 (in attending state) */

/* View event button */
gap: 8px;              /* gap-2 */
height: 36px;          /* size-sm */
padding: 0 12px;       /* px-3 */
color: rgb(37, 99, 235);  /* blue-600 */
background: transparent;

&:hover {
  color: rgb(29, 78, 216);  /* blue-700 */
  background: rgb(239, 246, 255);  /* blue-50 */
}
```

**Support Popover:**
```css
position: absolute;
z-index: 30;
width: 256px;          /* w-64 */
border-radius: 8px;    /* rounded-lg */
border: 1px solid rgb(191, 219, 254, 0.6);  /* blue-200/60 */
background: white / 98%;
backdrop-filter: blur(4px);
padding: 12px;         /* p-3 */
box-shadow: 0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05);

/* Positioned below button (default) */
top: 100%;
margin-top: 6px;       /* mt-1.5 */
left: 0;               /* or right: 0 depending on space */

/* OR positioned above button */
bottom: 100%;
margin-bottom: 6px;    /* mb-1.5 */

/* Header */
display: flex;
align-items: start;
justify-content: space-between;
gap: 8px;              /* gap-2 */
margin-bottom: 10px;   /* mb-2.5 */

/* Title */
font-size: 14px;       /* text-sm */
font-weight: 600;      /* font-semibold */
color: var(--foreground);
line-height: 20px;     /* leading-tight */

/* Subtitle */
font-size: 11px;       /* text-[11px] */
line-height: 16px;     /* leading-tight */
color: var(--muted-foreground);
margin-top: 2px;       /* mt-0.5 */

/* Cancel button */
height: 24px;          /* h-6 */
padding: 0 6px;        /* px-1.5 */
font-size: 11px;       /* text-[11px] */
color: var(--muted-foreground);
margin-top: -2px;      /* -mt-0.5 */

&:hover {
  color: var(--foreground);
}

/* Options container */
display: flex;
flex-direction: column;
gap: 6px;              /* gap-1.5 */

/* Checkbox option */
display: flex;
align-items: start;
gap: 10px;             /* gap-2.5 */
padding: 10px;         /* p-2.5 */
border-radius: 6px;    /* rounded-md */
border: 1px solid transparent;
background: rgb(239, 246, 255, 0.5);  /* blue-50/50 */
transition: all 200ms;

&:hover {
  border-color: rgb(191, 219, 254);  /* blue-200 */
  background: rgb(239, 246, 255);    /* blue-50 */
}

/* Checkbox */
width: 14px;           /* w-3.5 h-3.5 */
height: 14px;
margin-top: 2px;       /* mt-0.5 */
border-radius: 3px;
border: 1px solid rgb(191, 219, 254);  /* blue-200 */
accent-color: rgb(37, 99, 235);        /* blue-600 */

&:focus {
  outline: 2px solid rgb(147, 197, 253);  /* blue-300 */
}

/* Label container */
flex: 1;
min-width: 0;

/* Label header */
display: flex;
align-items: center;
gap: 6px;              /* gap-1.5 */

/* Icon */
width: 12px;           /* w-3 h-3 */
height: 12px;
flex-shrink: 0;

/* Amber (volunteer) */
color: rgb(217, 119, 6);  /* amber-600 */

/* Blue (participants) */
color: rgb(37, 99, 235);  /* blue-600 */

/* Purple (partner) */
color: rgb(147, 51, 234);  /* purple-600 */

/* Label text */
font-size: 12px;       /* text-xs */
font-weight: 500;      /* font-medium */
color: var(--foreground);

/* Description */
font-size: 11px;       /* text-[11px] */
color: var(--muted-foreground);
margin-top: 2px;       /* mt-0.5 */

/* Number input (if checkbox checked) */
width: 100%;
margin-top: 6px;       /* mt-1.5 */
padding: 4px 8px;      /* px-2 py-1 */
border-radius: 4px;    /* rounded */
border: 1px solid rgb(191, 219, 254);  /* blue-200 */
font-size: 11px;       /* text-[11px] */

&:focus {
  border-color: rgb(96, 165, 250);  /* blue-400 */
  outline: 1px solid rgb(191, 219, 254);  /* blue-200 */
}

/* No needs message */
padding: 8px;          /* p-2 */
border-radius: 6px;    /* rounded */
border: 1px dashed rgb(191, 219, 254);  /* blue-200 */
background: rgb(239, 246, 255, 0.4);    /* blue-50/40 */
font-size: 11px;       /* text-[11px] */
color: var(--muted-foreground);
text-align: center;

/* CTA button */
width: 100%;
height: 32px;          /* h-8 */
margin-top: 8px;       /* mt-2 */
display: flex;
align-items: center;
justify-content: center;
gap: 6px;              /* gap-1.5 */
background: rgb(37, 99, 235);  /* blue-600 */
color: white;
font-size: 12px;       /* text-xs */
font-weight: 500;      /* font-medium */
border-radius: 6px;    /* rounded-md */

&:hover {
  background: rgb(29, 78, 216);  /* blue-700 */
}

/* Icon */
width: 14px;           /* w-3.5 h-3.5 */
height: 14px;

/* Done button */
width: 100%;
height: 28px;          /* h-7 */
margin-top: 4px;       /* mt-1 */
font-size: 11px;       /* text-[11px] */
color: var(--muted-foreground);
background: transparent;

&:hover {
  color: var(--foreground);
  background: var(--muted);
}
```

---

### Project Card

**Differences from Event Card:**

**Impact Goal Box:**
```css
margin-bottom: 16px;   /* mb-4 */
padding: 16px;         /* p-4 */
border-radius: 12px;   /* rounded-xl */
background: linear-gradient(to right, var(--primary)/5, var(--accent)/5);
border: 1px solid var(--primary) / 20%;

/* Label */
font-size: 12px;       /* text-xs */
font-weight: 600;      /* font-semibold */
text-transform: uppercase;
letter-spacing: 0.05em;  /* tracking-wider */
color: var(--muted-foreground);
margin-bottom: 4px;    /* mb-1 */

/* Goal text */
font-size: 14px;       /* text-sm */
font-weight: 600;      /* font-semibold */
color: var(--foreground);
line-height: 20px;     /* leading-relaxed */
```

**Progress Bar:**
```css
margin-bottom: 16px;   /* mb-4 */

/* Header */
display: flex;
align-items: center;
justify-content: space-between;
margin-bottom: 8px;    /* mb-2 */

/* Label */
font-size: 12px;       /* text-xs */
font-weight: 500;      /* font-medium */
color: var(--muted-foreground);

/* Percentage */
font-size: 12px;       /* text-xs */
font-weight: 700;      /* font-bold */
color: var(--primary);

/* Bar container */
height: 8px;           /* h-2 */
width: 100%;
background: var(--muted);
border-radius: 9999px; /* rounded-full */
overflow: hidden;

/* Progress fill */
height: 100%;
background: linear-gradient(to right, rgb(16, 185, 129), rgb(20, 184, 166));
/* from-emerald-500 to-teal-500 */
border-radius: 9999px; /* rounded-full */
transition: width 500ms ease;

/* Subtext */
font-size: 12px;       /* text-xs */
color: var(--muted-foreground);
margin-top: 6px;       /* mt-1.5 */
```

**Details Grid:**
```css
margin-bottom: 16px;   /* mb-4 */
display: grid;
grid-template-columns: repeat(2, 1fr);
gap: 12px;             /* gap-3 */

/* Detail box */
display: flex;
align-items: center;
gap: 8px;              /* gap-2 */
padding: 12px;         /* p-3 */
border-radius: 12px;   /* rounded-xl */
background: var(--muted) / 50%;
border: 1px solid var(--border) / 50%;

/* Icon */
width: 16px;           /* w-4 h-4 */
height: 16px;
color: var(--primary);
flex-shrink: 0;

/* Text container */
/* Label */
font-size: 10px;       /* text-[10px] */
font-weight: 600;      /* font-semibold */
text-transform: uppercase;
letter-spacing: 0.05em;  /* tracking-wider */
color: var(--muted-foreground);

/* Value */
font-size: 12px;       /* text-xs */
font-weight: 600;      /* font-semibold */
color: var(--foreground);
```

**Partner Organizations:**
```css
margin-bottom: 20px;   /* mb-5 */
display: flex;
flex-wrap: wrap;
align-items: center;
gap: 12px;             /* gap-3 */

/* Avatar container */
display: flex;
margin-left: -8px;     /* -space-x-2 */

/* Avatar */
width: 32px;           /* w-8 h-8 */
height: 32px;
display: flex;
align-items: center;
justify-content: center;
border-radius: 9999px; /* rounded-full */
border: 2px solid var(--card);
background: linear-gradient(135deg, var(--primary)/15, var(--accent)/15);
font-size: 12px;       /* text-xs */
font-weight: 600;      /* font-semibold */
text-transform: uppercase;
color: var(--primary);

/* Counter */
width: 32px;           /* w-8 h-8 */
height: 32px;
background: var(--muted);
color: var(--muted-foreground);

/* Text */
font-size: 12px;       /* text-xs */
color: var(--muted-foreground);
```

**Interest Button:**
```css
/* Not interested state */
gap: 8px;              /* gap-2 */
height: 36px;          /* size-sm */
padding: 0 12px;       /* px-3 */
font-size: 14px;       /* text-sm */
font-weight: 500;      /* font-medium */
border: 1px solid transparent;
border-radius: 8px;    /* rounded-lg */
color: rgb(5, 150, 105);  /* emerald-600 */
background: transparent;
transition: all 200ms;

&:hover {
  color: rgb(4, 120, 87);  /* emerald-700 */
  background: rgb(236, 253, 245);  /* emerald-50 */
  border-color: rgb(167, 243, 208);  /* emerald-200 */
}

/* Interested state */
background: rgb(5, 150, 105);  /* emerald-600 */
border: 1px solid rgb(5, 150, 105);  /* emerald-600 */
color: white;

&:hover {
  background: rgb(4, 120, 87);  /* emerald-700 */
}
```

**Support Popover (emerald theme):**
```css
/* Same as event, but with emerald colors */
border-color: rgb(167, 243, 208, 0.6);  /* emerald-200/60 */

/* Options background */
background: rgb(236, 253, 245, 0.5);    /* emerald-50/50 */

&:hover {
  border-color: rgb(167, 243, 208);     /* emerald-200 */
  background: rgb(236, 253, 245);       /* emerald-50 */
}

/* Checkbox accent */
border-color: rgb(167, 243, 208);       /* emerald-200 */
accent-color: rgb(5, 150, 105);         /* emerald-600 */

/* No needs message */
border-color: rgb(167, 243, 208);       /* emerald-200 */
background: rgb(236, 253, 245, 0.4);    /* emerald-50/40 */

/* Note: No "Add to calendar" button for projects */
/* Just "Done for now" button */
```

---

### Post Card

**Container:**
```css
/* Same as Event/Project card */
border: 1px solid var(--border);
border-radius: 12px;   /* rounded-xl */
background: var(--card);
padding: 24px;         /* p-6 */
box-shadow: 0 1px 2px rgba(0,0,0,0.05);
overflow: hidden;

&:hover {
  box-shadow: 0 4px 6px rgba(0,0,0,0.07);
}
```

**Header (simpler):**
```css
/* Single avatar (no overlapping) */
width: 40px;           /* w-10 h-10 */
height: 40px;
border-radius: 9999px; /* rounded-full */
border: 2px solid var(--primary) / 20%;

/* Author name */
font-size: 14px;       /* text-sm */
font-weight: 600;      /* font-semibold */
color: var(--foreground);

/* Role and org (single line) */
font-size: 12px;       /* text-xs */
color: var(--muted-foreground);
```

**Category Badges:**
```css
display: flex;
flex-wrap: wrap;
gap: 8px;              /* gap-2 */
margin-bottom: 12px;   /* mb-3 */

/* Badge (example: wins) */
display: inline-flex;
align-items: center;
gap: 6px;
padding: 4px 10px;     /* px-2.5 py-1 */
border-radius: 9999px; /* rounded-full */
font-size: 12px;       /* text-xs */
font-weight: 500;      /* font-medium */

/* Wins (emerald) */
background: linear-gradient(to right, rgb(16, 185, 129, 0.1), rgb(20, 184, 166, 0.1));
border: 1px solid rgb(16, 185, 129, 0.3);
color: rgb(4, 120, 87);

/* Intros (purple) */
background: linear-gradient(to right, rgb(168, 85, 247, 0.1), rgb(192, 132, 252, 0.1));
border: 1px solid rgb(168, 85, 247, 0.3);
color: rgb(107, 33, 168);

/* Opportunities (blue) */
background: linear-gradient(to right, rgb(59, 130, 246, 0.1), rgb(96, 165, 250, 0.1));
border: 1px solid rgb(59, 130, 246, 0.3);
color: rgb(29, 78, 216);

/* Questions (amber) */
background: linear-gradient(to right, rgb(245, 158, 11, 0.1), rgb(251, 191, 36, 0.1));
border: 1px solid rgb(245, 158, 11, 0.3);
color: rgb(180, 83, 9);

/* Learnings (indigo) */
background: linear-gradient(to right, rgb(99, 102, 241, 0.1), rgb(129, 140, 248, 0.1));
border: 1px solid rgb(99, 102, 241, 0.3);
color: rgb(67, 56, 202);

/* General (gray) */
background: rgb(249, 250, 251);
border: 1px solid rgb(229, 231, 235);
color: rgb(75, 85, 99);
```

**Title (optional):**
```css
font-size: 18px;       /* text-lg */
font-weight: 700;      /* font-bold */
letter-spacing: -0.025em;  /* tracking-tight */
color: var(--foreground);
line-height: 28px;
margin-bottom: 8px;    /* mb-2 */
```

**Content:**
```css
font-size: 14px;       /* text-sm */
line-height: 20px;     /* leading-relaxed */
color: var(--foreground);
white-space: pre-wrap;
margin-bottom: 16px;   /* mb-4 */
```

**Linked Content Indicator:**
```css
margin-bottom: 16px;   /* mb-4 */
padding: 12px;         /* p-3 */
border-radius: 8px;    /* rounded-lg */
background: var(--muted) / 50%;
border: 1px solid var(--border) / 50%;

/* Content */
display: flex;
align-items: center;
gap: 8px;              /* gap-2 */
font-size: 14px;       /* text-sm */

/* Icon */
width: 14px;           /* w-3.5 h-3.5 */
height: 14px;
color: var(--muted-foreground);

/* Label */
font-size: 12px;       /* text-xs */
color: var(--muted-foreground);

/* Item name */
font-weight: 500;      /* font-medium */
color: var(--foreground);
```

**Footer:**
```css
/* Engagement only (no CTA if no links) */
display: flex;
align-items: center;
justify-content: space-between;
border-top: 1px solid var(--border);
padding-top: 16px;     /* pt-4 */

/* Left side */
display: flex;
gap: 16px;             /* gap-4 */

/* CTA (conditional) */
display: flex;
align-items: center;
gap: 8px;              /* gap-2 */
height: 36px;          /* size-sm */
padding: 0 12px;       /* px-3 */
font-size: 14px;       /* text-sm */
border: 1px solid var(--border);
border-radius: 8px;    /* rounded-lg */

&:hover {
  background: var(--muted);
}
```

---

### Right Sidebar

**Container:**
```css
display: none;         /* Hidden below lg */
width: 320px;

@media (min-width: 1024px) {
  display: block;
}
```

**Priority Alert Card:**
```css
border: 1px solid var(--border) / 50%;
border-radius: 12px;   /* rounded-xl */
background: var(--surface);
overflow: hidden;
box-shadow: var(--shadow-overlay);

/* Red header */
background: var(--destructive);
padding: 10px 16px;    /* px-4 py-2.5 */
display: flex;
align-items: center;
justify-content: space-between;

/* Badge container */
display: flex;
align-items: center;
gap: 8px;              /* gap-2 */

/* Icon */
width: 16px;           /* w-4 h-4 */
height: 16px;
color: white;
fill: currentColor;

/* Label */
font-size: 14px;       /* text-sm */
font-weight: 600;      /* font-semibold */
color: white;

/* Time */
font-size: 12px;       /* text-xs */
font-weight: 500;      /* font-medium */
color: white / 90%;

/* Audience bar */
padding: 10px 16px;    /* px-4 py-2.5 */
border-bottom: 1px solid var(--border) / 50%;
background: var(--surface-secondary);

/* Text */
font-size: 12px;       /* text-xs */
font-weight: 500;      /* font-medium */
color: var(--muted-foreground);

/* Content */
padding: 16px;         /* p-4 */

/* Author section */
display: flex;
align-items: start;
gap: 12px;             /* gap-3 */
margin-bottom: 16px;   /* mb-4 */

/* Avatar */
width: 40px;           /* w-10 h-10 */
height: 40px;
border: 2px solid var(--border) / 50%;

/* Name */
font-size: 14px;       /* text-sm */
font-weight: 600;      /* font-semibold */
color: var(--foreground);

/* Role */
font-size: 12px;       /* text-xs */
color: var(--muted-foreground);

/* Title */
font-size: 16px;       /* text-base */
font-weight: 700;      /* font-bold */
color: var(--foreground);
line-height: 24px;     /* leading-tight */
margin-bottom: 8px;    /* mb-2 */

/* Message */
font-size: 14px;       /* text-sm */
color: var(--muted-foreground);
line-height: 20px;     /* leading-relaxed */
margin-bottom: 16px;   /* mb-4 */

/* Acknowledge button */
width: 100%;
background: var(--destructive);
color: white;
border: none;
box-shadow: 0 1px 2px rgba(0,0,0,0.05);
transition: all 200ms;

&:hover {
  background: var(--destructive) / 90%;
}

&:active {
  transform: scale(0.98);
}
```

**Events Carousel:**
```css
width: 100%;
overflow: hidden;
border-radius: 12px;   /* rounded-xl */
border: 1px solid var(--border) / 50%;
background: var(--card);
box-shadow: 0 1px 2px rgba(0,0,0,0.05);

/* Container */
padding: 16px;         /* p-4 */

/* Image container */
position: relative;
height: 192px;         /* h-48 */
width: 100%;
border-radius: 12px;   /* rounded-xl */
overflow: hidden;
margin-bottom: 16px;   /* mb-4 */

/* Image */
object-fit: cover;
width: 100%;
height: 100%;

/* Gradient overlay */
position: absolute;
inset: 0;
background: linear-gradient(to top, black/70, black/10, transparent);

/* Badge */
position: absolute;
top: 12px;             /* top-3 */
left: 12px;            /* left-3 */
padding: 4px 12px;     /* px-3 py-1 */
background: var(--primary);
color: white;
font-size: 12px;       /* text-xs */
font-weight: 600;      /* font-semibold */
border-radius: 9999px; /* rounded-full */
box-shadow: 0 1px 2px rgba(0,0,0,0.1);

/* Title */
font-size: 18px;       /* text-lg */
font-weight: 600;      /* font-semibold */
color: var(--foreground);
line-height: 24px;     /* leading-tight */
margin-bottom: 4px;    /* mb-1 */

/* Description */
font-size: 14px;       /* text-sm */
color: var(--muted-foreground);
line-height: 20px;     /* leading-relaxed */
margin-bottom: 12px;   /* mb-3 */
display: -webkit-box;
-webkit-line-clamp: 2;
-webkit-box-orient: vertical;
overflow: hidden;

/* Details grid */
display: grid;
grid-template-columns: 1fr;
gap: 12px;             /* gap-3 */
font-size: 14px;       /* text-sm */
color: var(--foreground);
margin-bottom: 16px;   /* mb-4 */

/* Detail row */
display: flex;
align-items: center;
gap: 12px;             /* gap-3 */

/* Icon */
width: 16px;           /* w-4 h-4 */
height: 16px;
color: var(--primary);
flex-shrink: 0;

/* Attendee section */
display: flex;
align-items: center;
justify-content: space-between;
padding-top: 16px;     /* pt-4 */
border-top: 1px solid var(--border);

/* Avatar stack */
display: flex;
margin-left: -8px;     /* -space-x-2 */

/* Avatar */
width: 24px;           /* w-6 h-6 */
height: 24px;
border: 2px solid var(--card);
border-radius: 9999px;

/* Counter */
font-size: 12px;       /* text-xs */
font-weight: 600;      /* font-semibold */
color: var(--muted-foreground);

/* Attend button */
height: 32px;          /* h-8 */
padding: 0 12px;       /* px-3 */
font-size: 14px;       /* text-sm */
background: var(--primary);
color: white;
border-radius: 6px;    /* rounded-md */

/* Navigation buttons */
position: absolute;
bottom: 16px;          /* bottom-4 */
right: 16px;           /* right-4 */
display: flex;
gap: 8px;              /* gap-2 */

/* Button */
width: 32px;           /* w-8 h-8 */
height: 32px;
border-radius: 9999px; /* rounded-full */
background: white;
border: 1px solid var(--border);
display: flex;
align-items: center;
justify-content: center;
box-shadow: 0 1px 2px rgba(0,0,0,0.05);

&:hover {
  background: var(--muted);
}

/* Icon */
width: 16px;           /* w-4 h-4 */
height: 16px;
```

---

## 6. Shadows & Elevation {#shadows}

### Shadow System

**Light Mode:**
```css
/* Surface (subtle) */
--shadow-surface: 
  0 1px 2px 0 rgba(0, 0, 0, 0.04), 
  0 1px 3px 0 rgba(0, 0, 0, 0.08);

/* Card (default) */
--shadow-card: 
  0 2px 8px 0 rgba(0, 0, 0, 0.06);

/* Overlay (elevated) */
--shadow-overlay: 
  0 4px 16px 0 rgba(24, 24, 27, 0.08), 
  0 8px 24px 0 rgba(24, 24, 27, 0.09);

/* Hover states */
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
box-shadow: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04);
```

**Dark Mode:**
```css
/* Subtle border glow instead of shadows */
--shadow-surface: 0 0 0 1px rgba(255, 255, 255, 0.05);
--shadow-overlay: 0 0 0 1px rgba(255, 255, 255, 0.08);
--shadow-card: 0 0 0 1px rgba(255, 255, 255, 0.05);
```

### Colored Shadows (Primary elements)

```css
/* Primary button */
box-shadow: 0 4px 6px var(--primary) / 30%;

/* Notification badge */
box-shadow: 0 4px 6px var(--primary) / 50%;

/* Focus states */
box-shadow: 0 0 0 2px var(--primary) / 20%, 
            0 8px 24px var(--primary) / 20%;
```

---

## 7. Animations & Transitions {#animations}

### Standard Transitions

```css
/* Default */
transition: all 200ms ease;
transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);

/* Colors only */
transition: color 200ms, background-color 200ms, border-color 200ms;

/* Transform */
transition: transform 200ms ease;

/* Shadow */
transition: box-shadow 200ms ease;

/* Multiple properties */
transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
```

### Framer Motion Variants

**Fade + Slide Up (Cards):**
```tsx
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.4, delay: index * 0.05 }}
```

**Fade + Scale (Modals):**
```tsx
initial={{ opacity: 0, scale: 0.96 }}
animate={{ opacity: 1, scale: 1 }}
exit={{ opacity: 0, scale: 0.96 }}
transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
```

**Slide (Popovers):**
```tsx
initial={{ opacity: 0, y: -4, scale: 0.96 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
exit={{ opacity: 0, y: -4, scale: 0.96 }}
transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
```

**Stagger Children:**
```tsx
// Parent
transition={{ staggerChildren: 0.05 }}

// Children
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
```

**Width Animation (Search):**
```tsx
animate={{ width: isSearchFocused ? 320 : 260 }}
transition={{ duration: 0.3, ease: "easeOut" }}
```

**Layout Animation:**
```tsx
<motion.div layoutId="activeTab" />
transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
```

### Hover/Tap States

```tsx
whileHover={{ scale: 1.05 }}
whileTap={{ scale: 0.95 }}

whileHover={{ y: -1 }}
whileTap={{ y: 0 }}

whileHover={{ scale: 1.02 }}
transition={{ duration: 0.2 }}
```

### CSS Animations

**Ping (notification):**
```css
@keyframes ping {
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}

animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
```

**Shine (button effect):**
```css
@keyframes shine {
  0% { transform: translateX(-100%); }
  20% { transform: translateX(100%); }
  100% { transform: translateX(100%); }
}

animation: shine 8s ease-in-out infinite;
```

**Gradient (header):**
```css
@keyframes gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

animation: gradient 15s ease infinite;
background-size: 200% 200%;
```

---

## 8. Responsive Breakpoints {#responsive}

### Breakpoint Values

```css
/* Tailwind defaults */
sm: 640px;   /* @media (min-width: 640px) */
md: 768px;   /* @media (min-width: 768px) */
lg: 1024px;  /* @media (min-width: 1024px) */
xl: 1280px;  /* @media (min-width: 1280px) */
2xl: 1536px; /* @media (min-width: 1536px) */
```

### Layout Changes

**< 1024px (Tablet & Mobile):**
```css
/* Hide sidebars */
.left-sidebar,
.right-sidebar {
  display: none;
}

/* Full-width feed */
.main-feed {
  width: 100%;
}

/* Adjust header */
.header-nav {
  display: none;  /* Hide nav items */
}

.mobile-menu {
  display: block;  /* Show hamburger */
}

/* Search bar */
.search-bar {
  width: 200px;  /* Smaller on mobile */
}
```

**640px - 1024px (Tablet):**
```css
/* Single column layout */
.grid {
  grid-template-columns: 1fr;
}

/* Adjust card padding */
.card {
  padding: 20px;  /* Slightly smaller */
}
```

**< 640px (Mobile):**
```css
/* Reduce padding everywhere */
.container {
  padding: 16px 12px;  /* px-3 py-4 */
}

.card {
  padding: 16px;  /* p-4 */
}

/* Stack elements */
.card-footer {
  flex-direction: column;
  align-items: stretch;
}

/* Full-width buttons */
button {
  width: 100%;
}

/* Smaller text */
.card-title {
  font-size: 18px;  /* text-lg */
}

/* Hide less important info */
.metadata-secondary {
  display: none;
}

/* Simplify avatar stacks */
.avatar-stack {
  max-width: 3;  /* Show fewer avatars */
}
```

### Component Responsiveness

**Header:**
```css
/* < 768px */
.header {
  padding: 0 12px;  /* Reduce padding */
}

.search-bar {
  display: none;  /* Hide on small screens */
}

/* < 1024px */
.nav-items {
  display: none;  /* Hide nav, show menu */
}
```

**Create Post Card:**
```css
/* < 640px */
.welcome-header {
  flex-direction: column;
  align-items: start;
}

.ai-button span {
  display: none;  /* Hide text, keep icon */
}

.attachment-buttons {
  overflow-x: auto;  /* Allow horizontal scroll */
}
```

**Cards:**
```css
/* < 640px */
.card {
  padding: 16px;  /* p-4 instead of p-6 */
}

.card-title {
  font-size: 18px;  /* text-lg instead of text-xl */
}

.card-footer {
  flex-wrap: wrap;
  gap: 8px;
}

/* Details grid */
.details-grid {
  grid-template-columns: 1fr;  /* Single column */
}
```

---

## 📐 Quick Reference Measurements

### Common Sizes

| Element | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Container max-width | 1400px | 100% | 100% |
| Container padding | 24px | 16px | 12px |
| Card padding | 24px | 20px | 16px |
| Grid gap | 24px | 16px | 16px |
| Button height (sm) | 36px | 36px | 36px |
| Button height (default) | 40px | 40px | 40px |
| Input height | 40px | 40px | 40px |
| Avatar (default) | 40px | 40px | 32px |
| Card title | 20px | 18px | 18px |
| Body text | 14px | 14px | 14px |
| Border radius (card) | 16px | 12px | 12px |

### Z-Index Scale

| Layer | Value | Use Case |
|-------|-------|----------|
| Base | 0 | Default content |
| Sidebar sticky | 10 | Sticky sidebar elements |
| Modals | 20 | Dialog overlays |
| Popovers | 30 | Dropdowns, tooltips |
| Header | 50 | Sticky header |

---

## 🎨 Color Reference (Hex Values)

For designers who prefer hex over OKLCH:

### Primary Blue Scale
```
50:  #EFF6FF
100: #DBEAFE
200: #BFDBFE
300: #93C5FD
400: #60A5FA
500: #3B82F6  ← Primary
600: #2563EB
700: #1D4ED8
800: #1E40AF
900: #1E3A8A
```

### Emerald Scale (Projects)
```
50:  #ECFDF5
100: #D1FAE5
200: #A7F3D0
300: #6EE7B7
400: #34D399
500: #10B981  ← Success
600: #059669
700: #047857
800: #065F46
900: #064E3B
```

### Gray Scale
```
50:  #F9FAFB
100: #F3F4F6
200: #E5E7EB
300: #D1D5DB
400: #9CA3AF
500: #6B7280
600: #4B5563
700: #374151
800: #1F2937
900: #111827
```

---

**This specification ensures pixel-perfect recreation of the social homepage design.**

*Version 1.0 | November 2024*

