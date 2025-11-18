# Visual Spacing Guide - Pixel-Perfect Measurements

**Use this guide to see exact spacing, sizing, and positioning with visual diagrams.**

---

## 📏 Header Component (64px height)

```
┌────────────────────────────────────────────────────────────────┐
│ ← 16px → [LOGO] ← 32px → [Nav Items] ← auto → [Search] [🔔][👤] ← 16px → │
│          ↑                                                      │
│      20×20px icon                                               │
│      + 8px padding                                              │
│      = 36px total                                               │
│                                                                 │
│ Total Height: 64px (h-16)                                      │
│ Padding: 0 16px (px-4)                                         │
└────────────────────────────────────────────────────────────────┘

Logo Section:
┌──────────┐
│  ┌────┐  │ ← 8px padding (p-2)
│  │ ✨ │  │ ← 20×20px icon (w-5 h-5)
│  └────┘  │
│  Brand   │ ← 20px font-size (text-xl)
└──────────┘

Nav Item:
┌──────────┐
│   Home   │ ← 12px horizontal padding (px-3)
│          │   8px vertical padding (py-2)
│  ▔▔▔▔▔   │ ← 2px underline when active
└──────────┘
   14px font (text-sm)

Search Bar:
┌─────────────────────────────────────┐
│ 🔍 ← 12px → Search anything...     │
│ ↑                                   │
│ 40px from left (pl-10)              │
│                                     │
│ Width: 260px default                │
│        320px focused (animates)     │
│ Height: 40px (h-10)                 │
│ Padding-right: 16px (pr-4)          │
└─────────────────────────────────────┘

Notification Button:
┌────────┐
│   🔔   │ ← 40×40px (w-10 h-10)
│   ╱5╲  │ ← Badge: 20×20px at top-right
└────────┘    Offset: -4px (absolute)
```

---

## 📏 Left Sidebar (280px width)

```
┌──────────────────────────────────┐
│  Welcome Card                    │
│  ┌────────────────────────────┐  │
│  │  ← 24px padding (p-6) →    │  │
│  │  ┌─────┐                   │  │
│  │  │ 👤  │  64×64px avatar   │  │
│  │  └─────┘  (w-16 h-16)      │  │
│  │  ↓ 16px (mb-4)             │  │
│  │  Good morning, ← 24px      │  │
│  │  Michael ← 20px            │  │
│  └────────────────────────────┘  │
│  ↓ 24px gap (space-y-6)          │
│  ┌────────────────────────────┐  │
│  │  My Team                   │  │
│  │  ← 12px padding (p-3) →    │  │
│  │  ┌───┐┌───┐┌───┐┌───┐     │  │
│  │  │ A ││ B ││ C ││ D │+8    │  │
│  │  └───┘└───┘└───┘└───┘     │  │
│  │   ↑    ↑                   │  │
│  │  48×48px avatars           │  │
│  │  -10px overlap (space-x-2.5)│ │
│  │  ↓ 12px (mb-3)             │  │
│  │  See all team members →    │  │
│  └────────────────────────────┘  │
│  ↓ 24px gap                      │
│  ┌────────────────────────────┐  │
│  │  Community Highlights      │  │
│  │  208px height (h-52)       │  │
│  │  Auto-rotates 30s          │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
     280px total width
     Sticky: top-96px (top-24)
```

**Avatar Stack Detail:**
```
┌──┐      
│A │ ← 48×48px
└──┘
 ├─ 10px overlap (negative margin)
┌──┐
│B │
└──┘
 ├─ 10px overlap
┌──┐
│C │
└──┘
 ├─ 10px overlap
┌────┐
│ +8 │ ← Counter badge
└────┘
```

**Activity Badge on Avatar:**
```
┌─────────┐
│  ┌───┐  │
│  │ 💬│  │ ← 20×20px badge (w-5 h-5)
│  └───┘  │   Position: -2px top, -2px left
│  ╭───╮  │   Border: 2px solid var(--card)
│  │👤 │  │   Icon inside: 12×12px (w-3 h-3)
│  ╰───╯  │
└─────────┘
  48×48px avatar
```

---

## 📏 Main Feed (flexible width, 1fr)

### Create Post Card

```
┌──────────────────────────────────────────────────────┐
│  ← 32px padding (p-8) →                              │
│  ┌────┐ ← 16px gap (gap-4) →                        │
│  │ ✨ │ Welcome to the Community!                    │
│  └────┘ ↑                                            │
│  8px    24px font-size (text-2xl)                    │
│  padding                                             │
│                                                      │
│  ↓ 24px (mb-6)                                       │
│  ─────────────────── ← 1px border-gray-100          │
│  ↓ 24px (pt-6)                                       │
│                                                      │
│  ┌────┐ ← 16px gap (gap-4) →                        │
│  │👤  │ Share an update...                          │
│  └────┘ ↑                                            │
│  44×44px  Min-height: 72px                           │
│  (w-11)   Font: 16px (text-base)                     │
│           Line-height: 24px                          │
│                                                      │
│  [When focused, reveals:]                            │
│  ↓ 12px (mb-3)                                       │
│  ─────────────────── ← 1px border-gray-200          │
│  ↓ 12px (pb-3)                                       │
│                                                      │
│  [General][Intros][Wins]... ← Category chips        │
│  ← 6px gap between chips →                           │
│  Height: auto (dynamic)                              │
│                                                      │
│  ↓ 12px (mb-3)                                       │
│  ─────────────────── ← 1px border-gray-200          │
│  ↓ 12px (pb-3)                                       │
│                                                      │
│  [📷 Photo][📎 Attachment][📊 Poll][😊 Emoji]       │
│  ← 8px gap (gap-2) →                                 │
│  Height: 36px each (h-9)                             │
│                                    [🏷️ Tag Event/Project]│
│                                                      │
│  ↓ 8px (pt-2)                                        │
│                    [Create ▼] ← 8px gap → [Post →]  │
│                     36px high      36px high         │
└──────────────────────────────────────────────────────┘
   Border-radius: 16px (rounded-2xl)
   Shadow: 0 1px 3px rgba(0,0,0,0.1)
```

**Category Chip Measurements:**
```
┌──────────────┐
│ 🎉 ← 6px → #wins │
│ ↑            ↑   │
│ 14×14px   12px   │
│ icon      font   │
└──────────────────┘
Padding: 6px 10px (px-2.5 py-1.5)
Border-radius: 8px (rounded-lg)
Border: 1px solid
Total height: ~28px
```

**Linked Item Chip:**
```
┌────────────────────────────┐
│ 📅 ← 6px → Community Food Drive │ ✕ │
│ ↑              ↑           ↑   │
│ 12×12px     12px font   10×10px│
│ icon                    X button│
└────────────────────────────────┘
Padding: 4px 8px (px-2 py-1)
Border-radius: 9999px (rounded-full)
Border: 1px solid
Gap: 6px (gap-1.5)
Total height: ~24px
```

---

### Filter Bar

```
┌──────────────────────────────────────────────────────────┐
│ [All][Events][Projects][Posts] ← 8px gap → [Latest][Shared by]│
│  ↑                                           ↑           │
│  Active: blue bg, white text           12px font        │
│  Inactive: transparent, muted text     (text-xs)        │
│  Height: 36px (h-9)                    Height: 32px     │
│  Padding: 0 12px (px-3)                                 │
└──────────────────────────────────────────────────────────┘
   Padding-bottom: 16px (pb-4)
   Border-bottom: 1px solid var(--border)/50%
   Margin-bottom: 24px (mb-6)
```

---

### Event Card Detailed Measurements

```
┌─────────────────────────────────────────────────┐
│ ← 24px padding (p-6) →                          │
│                                                 │
│ ┌──┐ ← 12px gap → Marcus Rodriguez      [⋮ 32×32px]
│ │👤│              Hope Foundation              │
│ └──┘              Role · 3 hours ago     ↑     │
│ 40×40px                                 8px    │
│                                                 │
│ ↓ 16px (mb-4)                                   │
│ [❤️ Food Security] ← 12px height badge         │
│                                                 │
│ ↓ 12px (mb-3)                                   │
│ Community Food Drive & Distribution ← 20px font │
│                                       bold      │
│ ↓ 12px (mb-3)                                   │
│ We're organizing a major food... ← 14px font   │
│                                    400 weight   │
│ ↓ 16px (mb-4)                                   │
│ ┌───────────────────────────────┐              │
│ │ ← 16px padding (p-4) →        │              │
│ │ 📅 ← 12px → Dec 15, 2024      │              │
│ │ ↑           ↑                 │              │
│ │ 16×16px   14px font, 500 wt   │              │
│ │                               │              │
│ │ ↓ 8px gap                     │              │
│ │ 🕐 ← 12px → 9:00 AM - 3:00 PM │              │
│ │                               │              │
│ │ ↓ 8px gap                     │              │
│ │ 📍 ← 12px → Community Center  │              │
│ └───────────────────────────────┘              │
│   Border-radius: 12px (rounded-xl)             │
│   Background: var(--muted)/50%                 │
│                                                 │
│ ↓ 16px (mb-4)                                   │
│ [Part of: View Parent Project →]               │
│   Height: auto, padding: 12px (p-3)           │
│                                                 │
│ ↓ 16px (mb-4)                                   │
│ Looking for:                                    │
│ [❤️ Volunteers: 25][👥 Participants: 20]       │
│ ← 8px gap (gap-2) →                             │
│   Height: ~28px each                            │
│                                                 │
│ ↓ 20px (mb-5)                                   │
│ 3 charities interested • 12 participants referred│
│   14px font, muted color                        │
│                                                 │
│ ↓ 16px                                          │
│ ─────────────────────────── ← 1px border-top   │
│ ↓ 16px (pt-4)                                   │
│                                                 │
│ [♡ 0] [💬 0] ← 12px gap → [✓ Attend (3)][View] │
│  ↑     ↑                    ↑           ↑       │
│ 36px  36px                 36px        36px     │
│ high  high                 high       high      │
│                                                 │
└─────────────────────────────────────────────────┘
  Card width: 100% (flexible)
  Total padding: 24px all sides (p-6)
  Border: 1px solid var(--border)
  Border-radius: 12px (rounded-xl)
  Gap between sections: 12-20px
```

---

## 📏 Project Card with Progress Bar

```
┌─────────────────────────────────────────────────┐
│ ← 24px padding →                                │
│                                                 │
│ [Avatar section - same as Event Card]          │
│                                                 │
│ ↓ 16px                                          │
│ [❤️ Environment] ← Same as event                │
│                                                 │
│ ↓ 12px                                          │
│ Urban Tree Planting Initiative ← 20px, bold    │
│                                                 │
│ ↓ 12px                                          │
│ Collaborative effort to increase... ← 14px     │
│                                                 │
│ ↓ 16px                                          │
│ ┌──────────────────────────────────────┐       │
│ │ ← 16px padding (p-4) →               │       │
│ │ IMPACT GOAL ← 12px, semibold, caps  │       │
│ │ ↓ 4px (mb-1)                         │       │
│ │ Plant 5,000 trees across 10...       │       │
│ │ ↑                                     │       │
│ │ 14px font, 600 weight                │       │
│ └──────────────────────────────────────┘       │
│   Border-radius: 12px (rounded-xl)             │
│   Background: gradient primary/5 to accent/5   │
│   Border: 1px solid primary/20%                │
│                                                 │
│ ↓ 16px                                          │
│ Progress                              67%      │
│ ↑                                      ↑        │
│ 12px font, 500wt                    12px, bold │
│                                                 │
│ ↓ 8px (mb-2)                                    │
│ ┌─────────────────────────────────────┐        │
│ │████████████████████▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│        │
│ └─────────────────────────────────────┘        │
│   Height: 8px (h-2)                            │
│   Border-radius: 9999px (rounded-full)         │
│   Background: var(--muted)                     │
│   Fill: gradient emerald-500 to teal-500       │
│                                                 │
│ ↓ 6px (mt-1.5)                                  │
│ 3,350 / 5,000 trees · Updated 2 days ago       │
│ ↑                                               │
│ 12px font, muted                                │
│                                                 │
│ ↓ 16px                                          │
│ ┌──────────────┐  ┌──────────────┐            │
│ │ 📅 Target    │  │ 📅 Events    │            │
│ │ March 2025   │  │ 3 upcoming   │            │
│ └──────────────┘  └──────────────┘            │
│  ← 12px gap (gap-3) →                          │
│  Each box: padding 12px (p-3)                  │
│           radius 12px (rounded-xl)             │
│                                                 │
│ ↓ 16px                                          │
│ Looking for:                                    │
│ [❤️ Vol: 100][👥 Part: 50][📦 Resources]       │
│ [💵 Funding: $50K][🏢 Partner Collab]          │
│                                                 │
│ ↓ 20px                                          │
│ ╭───╮╭───╮╭───╮╭───╮                           │
│ │ C ││ P ││ T ││+1 │ Collaborating with...    │
│ ╰───╯╰───╯╰───╯╰───╯                           │
│ 32×32px partners, -8px overlap                 │
│                                                 │
│ ↓ 16px                                          │
│ 5 charities interested • 45 participants       │
│                                                 │
│ ↓ 16px                                          │
│ ─────────────────────────────                  │
│ ↓ 16px                                          │
│                                                 │
│ [♡ 0][💬 0] ← 12px → [Interested (5)][View →]  │
│              Emerald color theme               │
└─────────────────────────────────────────────────┘
```

**Details Box Measurements:**
```
┌────────────────────┐
│ ← 12px padding →   │
│ 📅 ← 8px → Target  │
│ ↑          ↑       │
│ 16×16px  10px font │
│          (text-[10px])
│          UPPERCASE │
│ ↓ 2px              │
│ March 2025         │
│ ↑                  │
│ 12px font, 600wt   │
└────────────────────┘
Total padding: 12px
Border-radius: 12px
Background: var(--muted)/50%
Border: 1px solid var(--border)/50%
```

---

## 📏 Post Card (Simpler)

```
┌──────────────────────────────────────────┐
│ ← 24px padding (p-6) →                   │
│                                          │
│ ┌──┐ ← 12px → David Park           [⋮]  │
│ │👤│           Program Manager           │
│ └──┘           2 hours ago               │
│ 40×40px                                  │
│                                          │
│ ↓ 16px                                   │
│ [🎉 #wins] [❤️ Food Security]           │
│  ← 8px gap →                             │
│  ~28px height each                       │
│                                          │
│ ↓ 12px (optional if title)               │
│ Amazing turnout! ← 18px font (text-lg)  │
│                                          │
│ ↓ 8px                                    │
│ Incredible turnout at today's...        │
│ ↑                                        │
│ 14px font, 400 weight, pre-wrap         │
│                                          │
│ ↓ 16px                                   │
│ ┌────────────────────────────┐          │
│ │ 🔗 About: Food Drive Event │          │
│ └────────────────────────────┘          │
│   Padding: 12px (p-3)                   │
│   Background: var(--muted)/50%          │
│                                          │
│ ↓ 16px                                   │
│ ──────────────────────────              │
│ ↓ 16px                                   │
│                                          │
│ [♡ 24][💬 8]        [View Event →]      │
└──────────────────────────────────────────┘
```

---

## 📏 Right Sidebar (320px width)

### Priority Alert

```
┌─────────────────────────────────────┐
│ RED HEADER (var(--destructive))     │
│ ← 16px padding (px-4 py-2.5) →      │
│ ⚡ ← 8px → Priority    1 hour ago   │
│ ↑           ↑          ↑            │
│ 16×16px   14px font  12px font      │
│           600wt      500wt           │
│ Height: ~44px                        │
├─────────────────────────────────────┤
│ AUDIENCE BAR (muted secondary)      │
│ ← 16px padding →                     │
│ to Blink Team ← 12px font           │
│ Height: ~40px                        │
├─────────────────────────────────────┤
│ CONTENT                              │
│ ← 16px padding (p-4) →               │
│                                      │
│ ┌──┐ ← 12px → Tyron Brown           │
│ │👤│           Facilities Manager    │
│ └──┘           ↑                     │
│ 40×40px      14px name, 12px role   │
│                                      │
│ ↓ 16px (mb-4)                        │
│ Electricity outage expected!        │
│ ↑                                    │
│ 16px font, 700 weight (text-base)   │
│                                      │
│ ↓ 8px (mb-2)                         │
│ There will be a scheduled...        │
│ ↑                                    │
│ 14px font, muted                     │
│                                      │
│ ↓ 16px (mb-4)                        │
│ ┌─────────────────────────────┐     │
│ │    Acknowledge (full-width)  │     │
│ │    40px height               │     │
│ └─────────────────────────────┘     │
│   Background: var(--destructive)    │
│   Color: white                       │
└─────────────────────────────────────┘
  Total width: 320px
  Border: 1px solid var(--border)/50%
  Border-radius: 12px (rounded-xl)
  Box-shadow: var(--shadow-overlay)
```

### Events Carousel

```
┌─────────────────────────────────────┐
│ ← 16px padding (p-4) →              │
│                                     │
│ ┌───────────────────────────┐      │
│ │      IMAGE (192px high)   │      │
│ │         ╱gradient╲         │      │
│ │      ╱ overlay  ╲         │      │
│ │    ╱             ╲        │      │
│ │  [Tomorrow] ← Badge       │      │
│ │   12px top, 12px left     │      │
│ └───────────────────────────┘      │
│   Border-radius: 12px               │
│                                     │
│ ↓ 16px (mb-4)                       │
│ Community Cleanup ← 18px, 600wt    │
│                                     │
│ ↓ 4px (mb-1)                        │
│ Join us for our monthly... ← 14px  │
│ Line-clamp: 2 lines max            │
│                                     │
│ ↓ 12px (mb-3)                       │
│ 📅 March 15, 2024                   │
│ ↑                                   │
│ 16×16px icon, 12px gap, 14px font  │
│                                     │
│ 🕐 9:00 AM - 12:00 PM              │
│                                     │
│ 📍 Central Park                     │
│                                     │
│ ↓ 16px (mb-4)                       │
│ ──────────────────────              │
│ ↓ 16px (pt-4)                       │
│                                     │
│ ╭─╮╭─╮╭─╮ ← 24 attending           │
│ │A││B││C│    12px font              │
│ ╰─╯╰─╯╰─╯    ← 8px gap →   [Attend]│
│ 24×24px avatars         32px button │
│ -8px overlap                         │
│                                     │
│                   [←][→] ← Nav      │
│                   32×32px each      │
│                   Absolute bottom-right│
└─────────────────────────────────────┘
  Total width: 320px
  Border: 1px solid var(--border)/50%
  Padding: 16px (p-4)
```

---

## 📏 Popover Positioning Details

### Support Popover (Event/Project)

```
                 [Attend Button]
                      ↓ 6px (mt-1.5)
┌────────────────────────────────────┐
│ ← 12px padding (p-3) →             │
│                                    │
│ You're in!          [Cancel]       │
│ ↑                    ↑              │
│ 14px, 600wt        11px, ghost     │
│                                    │
│ Pick ways to pitch in (optional)   │
│ ↑                                  │
│ 11px, muted                        │
│                                    │
│ ↓ 10px (mb-2.5)                    │
│ ┌────────────────────────────┐    │
│ │ ☐ ← 10px → Volunteer help  │    │
│ │ ↑          ↑               │    │
│ │ 14×14px  12px font         │    │
│ │ checkbox  500 weight       │    │
│ │                            │    │
│ │ Need 25 volunteers         │    │
│ │ ↑                          │    │
│ │ 11px, muted                │    │
│ └────────────────────────────┘    │
│   Padding: 10px (p-2.5)           │
│   Border-radius: 6px (rounded-md) │
│   Background: blue-50/50%         │
│   ↓ 6px gap (gap-1.5)             │
│                                    │
│ [More checkboxes...]               │
│                                    │
│ ↓ 10px (pt-2.5)                    │
│ ┌────────────────────────────┐    │
│ │ 📅 Add to calendar         │    │
│ │ Height: 32px (h-8)         │    │
│ └────────────────────────────┘    │
│   Full-width, 12px font           │
│   Background: blue-600            │
│                                    │
│ ↓ 4px (mt-1)                       │
│ [Done for now] ← 28px high, 11px  │
└────────────────────────────────────┘
  Width: 256px (w-64)
  Border: 1px solid blue-200/60%
  Border-radius: 8px (rounded-lg)
  Background: white/98%
  Backdrop-blur: 4px
  Box-shadow: lg
  
  Position: Absolute
  - Default: top-full mt-1.5 (below)
  - Flipped: bottom-full mb-1.5 (above)
  - Default: left-0
  - Can flip: right-0
```

**Checkbox Option Detail:**
```
┌──────────────────────────────┐
│ ☐ ← 10px → [Icon] Label      │
│ ↑           ↑     ↑          │
│ 14×14px   12×12px  12px font │
│ checkbox   icon    500wt     │
│ 2px from               ↓ 2px │
│ top        Description text  │
│           11px, muted         │
│           ↓ 6px (if input)   │
│           [Number input]     │
│           Width: 100%        │
│           Height: auto       │
└──────────────────────────────┘
Padding: 10px all sides (p-2.5)
Gap: 10px (gap-2.5)
Border-radius: 6px (rounded-md)
```

---

## 📏 Modals (Create Event/Project)

### Dialog Overlay

```css
position: fixed;
inset: 0;
z-index: 50;
background: black / 50%;
backdrop-filter: blur(4px);
```

### Dialog Content

```css
position: fixed;
left: 50%;
top: 50%;
transform: translate(-50%, -50%);
z-index: 50;
width: 100%;
max-width: 672px;     /* max-w-2xl */
max-height: 90vh;
overflow-y: auto;
padding: 24px;        /* p-6 */
border-radius: 12px;  /* rounded-xl */
border: 1px solid var(--border);
background: var(--card);
box-shadow: 0 20px 25px rgba(0,0,0,0.15);
```

**Dialog Header:**
```css
margin-bottom: 16px;  /* mb-4 */

/* Title */
display: flex;
align-items: center;
gap: 8px;             /* gap-2 */
font-size: 20px;      /* text-xl */
font-weight: 700;     /* font-bold */
color: var(--foreground);

/* Icon */
width: 20px;          /* w-5 h-5 */
height: 20px;
color: rgb(37, 99, 235);  /* blue-600 */

/* Description */
font-size: 14px;      /* text-sm */
color: var(--muted-foreground);
margin-top: 8px;      /* mt-2 */
```

**Form Section:**
```css
padding: 16px;        /* p-4 */
border-radius: 8px;   /* rounded-lg */
background: var(--muted) / 50%;
border: 1px solid var(--border);
margin-bottom: 16px;  /* mb-4 */

/* Section title */
font-size: 14px;      /* text-sm */
font-weight: 600;     /* font-semibold */
color: var(--foreground);
margin-bottom: 16px;  /* mb-4 */
```

**Input Group:**
```css
/* Label */
font-size: 14px;      /* text-sm */
font-weight: 500;     /* font-medium */
color: var(--foreground);
margin-bottom: 8px;   /* mb-2 */

/* Input */
width: 100%;
height: 40px;         /* h-10 */
padding: 8px 12px;    /* px-3 py-2 */
border-radius: 6px;   /* rounded-md */
border: 1px solid var(--input);
background: var(--background);
font-size: 14px;      /* text-sm */

&:focus {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}

/* Textarea */
min-height: 100px;
resize: vertical;

/* Spacing between inputs */
margin-bottom: 16px;  /* mb-4 */
```

**Collapsible Advanced:**
```css
/* Trigger */
display: flex;
align-items: center;
justify-content: space-between;
width: 100%;
padding: 12px 16px;   /* px-4 py-3 */
border: 1px solid var(--border);
border-radius: 8px;   /* rounded-lg */
background: var(--muted) / 30%;
font-size: 14px;      /* text-sm */
font-weight: 600;     /* font-semibold */
margin-bottom: 16px;  /* mb-4 */

&:hover {
  background: var(--muted) / 50%;
}

/* Icon (chevron) */
width: 16px;          /* w-4 h-4 */
height: 16px;
transition: transform 200ms;

/* Expanded state */
transform: rotate(180deg);

/* Content */
padding: 16px;        /* p-4 */
border: 1px solid var(--border) / 50%;
border-radius: 8px;   /* rounded-lg */
background: var(--background);
```

**Form Actions:**
```css
display: flex;
align-items: center;
justify-content: flex-end;
gap: 12px;            /* gap-3 */
margin-top: 24px;     /* mt-6 */
padding-top: 24px;    /* pt-6 */
border-top: 1px solid var(--border);

/* Cancel button */
height: 40px;         /* h-10 */
padding: 0 16px;      /* px-4 */
border: 1px solid var(--border);
border-radius: 8px;   /* rounded-lg */
background: transparent;
color: var(--foreground);

/* Submit button */
height: 40px;         /* h-10 */
padding: 0 24px;      /* px-6 */
background: var(--primary);
color: white;
border-radius: 8px;   /* rounded-lg */
gap: 8px;             /* For icon */

&:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
```

---

## 📏 @Mention Dropdown

```
┌─────────────────────────────────────────────┐
│ ← 8px padding (p-2) →                       │
│                                             │
│ Tag Event, Project, or Organization         │
│ ↑                                           │
│ 12px font, 500wt, muted, padding: 12px 8px │
│ (px-3 py-2)                                 │
│                                             │
│ ┌─────────────────────────────────────┐    │
│ │ 📅 ← 12px → Community Food Drive    │    │
│ │ ↑           ↑                       │    │
│ │ 16×16px   14px font, 500wt         │    │
│ │           Event · Dec 15           │    │
│ │           ↑                        │    │
│ │           12px, muted              │    │
│ └─────────────────────────────────────┘    │
│   Padding: 12px 8px (px-3 py-2)            │
│   Border-radius: 6px (rounded-md)          │
│   Background: transparent                   │
│   Hover: gray-50                            │
│   ↓ 4px gap                                 │
│                                             │
│ [More items...]                             │
│                                             │
└─────────────────────────────────────────────┘
  Position: Absolute (below textarea)
  Width: 100% (max-w-md = 448px)
  Max-height: 256px (max-h-64)
  Overflow-y: auto
  Background: white
  Border: 1px solid gray-200
  Border-radius: 8px (rounded-lg)
  Box-shadow: lg
  Margin-top: 4px (mt-1)
  Z-index: 50
```

---

## 🎨 Gradient Formulas

### Common Gradients

**Welcome Card (Left Sidebar):**
```css
background: linear-gradient(
  135deg,
  var(--chart-2),        /* Teal */
  var(--chart-1) / 80%,  /* Orange 80% */
  var(--chart-5)         /* Amber */
);
```

**Impact Goal Box:**
```css
background: linear-gradient(
  to right,
  var(--primary) / 5%,
  var(--accent) / 5%
);
```

**Progress Bar Fill:**
```css
background: linear-gradient(
  to right,
  rgb(16, 185, 129),    /* emerald-500 */
  rgb(20, 184, 166)     /* teal-500 */
);
```

**Category Badges:**
```css
/* Wins */
background: linear-gradient(
  to right,
  rgb(16, 185, 129, 0.1),  /* emerald-500/10% */
  rgb(20, 184, 166, 0.1)   /* teal-500/10% */
);

/* Intros */
background: linear-gradient(
  to right,
  rgb(168, 85, 247, 0.1),   /* purple-500/10% */
  rgb(192, 132, 252, 0.1)   /* purple-400/10% */
);

/* Opportunities */
background: linear-gradient(
  to right,
  rgb(59, 130, 246, 0.1),   /* blue-500/10% */
  rgb(96, 165, 250, 0.1)    /* blue-400/10% */
);
```

**"This Week" Button:**
```css
background: linear-gradient(
  to right,
  rgb(168, 85, 247),    /* purple-500 */
  rgb(236, 72, 153)     /* pink-500 */
);

/* Hover */
background: linear-gradient(
  to right,
  rgb(147, 51, 234),    /* purple-600 */
  rgb(219, 39, 119)     /* pink-600 */
);
```

**Header Animated Background:**
```css
background: linear-gradient(
  to right,
  var(--primary) / 10%,
  var(--primary) / 5%,
  transparent
);
```

---

## 📏 AI Summary Card (Orange)

```
┌─────────────────────────────────────────────┐
│ ORANGE GRADIENT HEADER                      │
│ background: linear-gradient(to right,       │
│   rgb(251, 146, 60),  /* orange-400 */      │
│   rgb(249, 115, 22),  /* orange-500 */      │
│   rgb(239, 68, 68)    /* red-500 */         │
│ )                                           │
│ ← 12px padding (p-3) →                      │
│                                             │
│ ┌──┐ ← 12px → Monday's Team Meeting Notes  │
│ │✨│           ↑                            │
│ └──┘         14px font, 600wt, white       │
│ 44×44px                                     │
│ white/20%      Friday, July 10 at 4:00 PM  │
│ background     ↑                            │
│ rounded-lg   12px font, white/90%          │
│                                      [Attend]│
│                                      ↑       │
│                                    White bg │
│                                    Orange text│
│                                    Padding: 6px 16px│
│                                    Height: auto│
├─────────────────────────────────────────────┤
│ WHITE EXPANDABLE CONTENT (if expanded)      │
│ ← 24px padding (p-6) →                      │
│ Border-top: 1px purple-200/30%              │
│                                             │
│ Your Weekly AI Summary    [✕ Close]        │
│ ↑                          ↑                │
│ 18px font, 700wt         Ghost button      │
│                          32×32px            │
│ AI-powered insights...                      │
│ ↑                                           │
│ 14px font, 600wt, gray-600                 │
│                                             │
│ ↓ 16px (mb-4)                               │
│ ┌──────────────┐  ┌──────────────┐         │
│ │ Last Week's  │  │ This Week's  │         │
│ │ Highlights   │  │ Focus        │         │
│ │ • 15 collabs │  │ • 3 events   │         │
│ │ • 200+ RSVPs │  │ • 12 signups │         │
│ └──────────────┘  └──────────────┘         │
│   Purple bg         Blue bg                │
│   Padding: 16px     Padding: 16px         │
│   Rounded: 8px      Rounded: 8px          │
└─────────────────────────────────────────────┘
```

---

## 📏 Exact Spacing Between Elements

### In Cards (Event/Project)

```
Top of card
↓ 24px padding (p-6)
Header (Avatar + Author)
↓ 16px (mb-4)
Badges
↓ 12px (mb-3)
Title
↓ 12px (mb-3)
Description
↓ 16px (mb-4)
Details box (Date/Time/Location OR Impact Goal)
↓ 16px (mb-4)
Optional: Parent project link / Progress bar
↓ 16px (mb-4)
Details grid (if present)
↓ 16px (mb-4)
Looking for section
↓ 20px (mb-5)
Partner organizations (if present)
↓ 20px (mb-5)
Interest counter
↓ 16px (mb-4)
────────── Border (1px)
↓ 16px (pt-4)
Footer (Like/Comment + CTAs)
↓ 24px padding (p-6)
Bottom of card
```

### In Main Feed

```
Top of page
↓ 64px header height
↓ 24px padding-top (py-6)
Alert Banner (if present)
↓ 24px gap (space-y-6)
Create Post Card
↓ 24px gap
Filter Bar
↓ 16px (pb-4 + border)
Event Card
↓ 24px gap (space-y-6)
Project Card
↓ 24px gap
AI Summary Card (after 2nd item)
↓ 24px gap
Post Card
↓ 24px gap
[More cards...]
↓ 24px padding-bottom
Bottom of page
```

---

## 🎯 Component Size Chart

| Component | Width | Height | Padding | Border Radius |
|-----------|-------|--------|---------|---------------|
| **Header** | 100% | 64px | 0 16px | 0 |
| **Left Sidebar** | 280px | auto | sticky | - |
| **Main Feed** | 1fr | auto | - | - |
| **Right Sidebar** | 320px | auto | sticky | - |
| **Card (default)** | 100% | auto | 24px | 12px |
| **Create Post Card** | 100% | auto | 32px | 16px |
| **Button (sm)** | auto | 36px | 0 12px | 8px |
| **Button (default)** | auto | 40px | 0 16px | 8px |
| **Input** | 100% | 40px | 8px 12px | 8px |
| **Avatar (sm)** | 32px | 32px | - | 9999px |
| **Avatar (default)** | 40px | 40px | - | 9999px |
| **Avatar (lg)** | 48px | 48px | - | 9999px |
| **Avatar (xl)** | 64px | 64px | - | 9999px |
| **Category Chip** | auto | ~28px | 6px 10px | 8px |
| **Badge (small)** | auto | ~24px | 4px 8px | 9999px |
| **Modal Content** | 672px max | 90vh max | 24px | 12px |
| **Popover** | 256px | auto | 12px | 8px |

---

## 📊 Spacing Between Text Elements

### Typography Line Heights

```
text-xs (12px):
  line-height: 16px (1.33)
  margin-bottom: 2-4px typical

text-sm (14px):
  line-height: 20px (1.43)
  margin-bottom: 4-8px typical

text-base (16px):
  line-height: 24px (1.5)
  margin-bottom: 8px typical

text-lg (18px):
  line-height: 28px (1.55)
  margin-bottom: 8-12px typical

text-xl (20px):
  line-height: 28px (1.4)
  margin-bottom: 12px typical

text-2xl (24px):
  line-height: 32px (1.33)
  margin-bottom: 16px typical
```

### Vertical Rhythm

**Inside Cards:**
- Section header to content: 8-12px
- Content to metadata: 12-16px
- Metadata to actions: 16-20px
- Between major sections: 16-24px

**In Sidebars:**
- Between cards: 16px (mobile), 24px (desktop)
- Card internal spacing: 12-16px
- Section headers: 12px below

**In Forms:**
- Label to input: 8px
- Input to input: 16px
- Section to section: 20-24px
- Form to actions: 24px + border

---

## 🔢 Exact Pixel Values Quick Lookup

### Tailwind → Pixels

```
p-0: 0px          gap-0: 0px       w-0: 0px
p-1: 4px          gap-1: 4px       w-1: 4px
p-2: 8px          gap-2: 8px       w-2: 8px
p-3: 12px         gap-3: 12px      w-4: 16px
p-4: 16px         gap-4: 16px      w-5: 20px
p-5: 20px         gap-5: 20px      w-6: 24px
p-6: 24px         gap-6: 24px      w-8: 32px
p-8: 32px         gap-8: 32px      w-10: 40px
p-10: 40px        gap-10: 40px     w-12: 48px
p-12: 48px        gap-12: 48px     w-16: 64px

Fractional:
p-0.5: 2px        gap-0.5: 2px     w-0.5: 2px
p-1.5: 6px        gap-1.5: 6px     
p-2.5: 10px       gap-2.5: 10px    
```

### Heights

```
h-7: 28px
h-8: 32px
h-9: 36px
h-10: 40px
h-11: 44px
h-12: 48px
h-16: 64px
h-48: 192px
h-52: 208px
```

### Common Combinations

```
py-1 px-2: 4px 8px (vertical × horizontal)
py-1.5 px-3: 6px 12px
py-2 px-4: 8px 16px
py-2.5 px-4: 10px 16px
py-3 px-4: 12px 16px
```

---

## 📐 Grid & Flex Gaps

### Main Layout Grid
```
Grid: 280px (left) | 1fr (center) | 320px (right)
Gap: 24px between columns
Max-width: 1400px
Padding: 24px 16px (container)
```

### Details Grid (2-column)
```
Grid: 1fr 1fr (equal columns)
Gap: 12px
Example use: Target Date | Events Count
```

### Flex Containers

**Horizontal (most common):**
```
display: flex;
align-items: center;
gap: 8px, 12px, or 16px (context dependent)
```

**Vertical (sidebars, modals):**
```
display: flex;
flex-direction: column;
gap: 16px or 24px
```

**Space-between (card footers):**
```
display: flex;
justify-content: space-between;
align-items: center;
gap: 12px (for wrapping)
```

---

## 🎨 Opacity Scale

```
/5:   5%  opacity
/10:  10% opacity
/20:  20% opacity
/30:  30% opacity
/40:  40% opacity
/50:  50% opacity
/60:  60% opacity
/70:  70% opacity
/80:  80% opacity
/90:  90% opacity
/95:  95% opacity
/98:  98% opacity

Example:
var(--primary)/20% = oklch(0.45 0.18 250 / 20%)
```

---

## 📱 Mobile Adjustments

### Padding Reduction

| Element | Desktop | Mobile |
|---------|---------|--------|
| Container | 24px | 12px |
| Card | 24px | 16px |
| Modal | 24px | 16px |
| Button | 0 16px | 0 12px |

### Font Size Reduction

| Element | Desktop | Mobile |
|---------|---------|--------|
| Card title | 20px | 18px |
| Welcome header | 24px | 20px |
| Section title | 18px | 16px |

### Layout Changes

| Element | Desktop | Mobile |
|---------|---------|--------|
| Sidebar | visible | hidden |
| Grid columns | 3 | 1 |
| Navigation | visible | hamburger |
| Search width | 260px | hidden |
| Avatar stack | show all | show 3 max |

---

**Use this guide for pixel-perfect implementation!**

*Last Updated: November 2024*

