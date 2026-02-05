# 🐛 Production Bug Report: Currency Symbol Rendering Issue

**Status:** DIAGNOSED (No Fix Applied)  
**Severity:** MEDIUM  
**Affected Pages:** Course Detail Pages, Course Cards, Blog Pages  
**Reported:** January 26, 2026  

---

## Issue Description

### Symptom
- **Visual:** Currency symbol (₹) renders incorrectly/corrupted on screen
- **DevTools DOM:** Shows correct ₹ character
- **Clipboard:** Copy returns correct ₹ symbol
- **URL Bar Paste:** Correct character shows

### Behavior Pattern
Same corrupted rendering occurs on:
- Course detail page (price section)
- Course card (course listings)
- Blog pages (where prices mentioned)

---

## Root Cause Analysis

### Primary Issue: Font Subset Mismatch + CSS Text Clipping

```
┌─ PT_Sans Font Loaded (latin subset ONLY)
│
├─ Browser encounters ₹ character (Unicode U+20B9, Devanagari)
│
├─ PT_Sans doesn't have this glyph
│
├─ Browser falls back to system font (Arial, Segoe UI, etc.)
│
├─ System font has different glyph metrics/baseline
│
├─ bg-clip-text CSS clips background to WRONG glyph shape
│
└─ Result: Visual corruption on screen only
```

### Technical Chain

1. **Font Loading Failure**
   - File: `src/app/layout.tsx` (Line 21)
   - Configuration: `subsets: ['latin']` ← Missing Devanagari
   - Rupee symbol: U+20B9 (Devanagari Extended block, NOT Latin)
   - Result: Glyph missing from loaded font

2. **Font Fallback Occurs**
   - Primary font (PT_Sans) lacks glyph
   - Browser automatically falls back to system default
   - Fallback font (Segoe UI / Arial) HAS glyph but different shape
   - Different baseline alignment and dimensions

3. **CSS Clipping Amplifies Bug**
   - File: `src/app/courses/[slug]/page.tsx` (Line 252)
   - CSS: `bg-clip-text text-transparent`
   - Purpose: Clip gradient to text shape
   - Problem: Clips to FALLBACK font glyph, not PT_Sans glyph
   - Result: Gradient misalignment, character distortion

### Example: Course Detail Page

```tsx
// File: src/app/courses/[slug]/page.tsx, Line 252
<span className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
  ₹{discountedPrice.toLocaleString('en-IN')}
</span>
```

**Computed CSS:**
```css
font-family: var(--font-pt-sans), sans-serif;  /* PT_Sans lacks ₹ */
font-size: 2.25rem;
font-weight: 700;
background-clip: text;                          /* ⚠️ Clips to wrong shape */
-webkit-background-clip: text;                  /* Safari/Chrome prefix */
color: transparent;                             /* Uses gradient instead */
```

**Rendering Flow:**
```
1. Browser tries to render ₹ with PT_Sans
2. PT_Sans (latin subset) has no ₹ glyph
3. Falls back to system font
4. System font ₹ has different shape than PT_Sans
5. background-clip: text clips gradient to system font shape
6. Fallback shape ≠ Intended shape
7. Gradient misaligns
8. Character visually corrupted on screen
```

### Example: Course Card

```tsx
// File: src/components/course/course-card.tsx, Line 158
<span className="text-2xl font-bold">₹{price.toLocaleString('en-IN')}</span>
```

**CSS Applied:**
```css
font-family: var(--font-pt-sans), sans-serif;
font-size: 1.5rem;
font-weight: 700;
/* No bg-clip-text here, so fallback rendering more tolerant */
/* But still shows system font glyph instead of PT_Sans */
```

---

## Why Clipboard & DOM Show Correct Value

### ✅ DOM Inspector
- Shows HTML source code
- Actual character: `₹` (U+20B9)
- Display method: Text content, not rendered glyph
- Result: Shows as correct

### ✅ Clipboard / Copy
- Copies text content from DOM
- Copies HTML entity: `₹`
- Preserves original Unicode character
- Result: Paste shows correct character

### ❌ Visual Rendering
- Browser renders glyph using available font
- Font: PT_Sans (loaded, but missing ₹)
- Fallback: System font (has ₹, but different metrics)
- CSS: `background-clip: text` clips to wrong shape
- Result: Corrupted visual display

---

## Exact Files Responsible

### 1. Root Cause: Font Configuration
**File:** `src/app/layout.tsx`

```typescript
// Line 20-24
const ptSans = PT_Sans({
  subsets: ['latin'],           // ❌ PROBLEM: Only Latin subset
  weight: ['400', '700'],
  variable: '--font-pt-sans',
  display: 'swap',
});
```

**Issue:** 
- Loads only `['latin']` subset (U+0000 to U+007F)
- Rupee symbol U+20B9 is NOT in Latin range
- Font is incomplete for Indian/Devanagari characters

### 2. CSS Amplification: Text Clipping
**File:** `src/app/courses/[slug]/page.tsx`

```tsx
// Line 252
<span className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
  ₹{discountedPrice.toLocaleString('en-IN')}
</span>
```

**Issue:**
- `bg-clip-text`: Clips background gradient to text shape
- `text-transparent`: Makes text itself transparent
- When ₹ uses fallback font, clipping calculations wrong
- Gradient clips to incorrect shape

### 3. Secondary Location (Less Severe)
**File:** `src/components/course/course-card.tsx`

```tsx
// Line 158
<span className="text-2xl font-bold">₹{price.toLocaleString('en-IN')}</span>
```

**Issue:**
- Same missing glyph problem
- No `bg-clip-text`, so rendering more forgiving
- Still shows system font instead of PT_Sans
- Visually noticeable but less distorted

### 4. Font Declaration
**File:** `src/tailwind.config.ts`

```typescript
// Lines 17-19
fontFamily: {
  body: ['var(--font-pt-sans)', 'sans-serif'],
  headline: ['var(--font-pt-sans)', 'sans-serif'],
  // ...
},
```

**Issue:**
- Declares PT_Sans as primary font
- No fallback for non-Latin characters
- All body/headline text uses PT_Sans first

---

## Font Fallback Stack

```
Intended:  PT_Sans (Latin subset only)
           ↓
Missing:   ₹ glyph not in subset
           ↓
Fallback:  Segoe UI / Arial / System Default
           ↓
Result:    Different glyph metrics
           ↓
CSS        background-clip: text clips to wrong shape
Impact:    ↓
           Visual corruption on screen
```

---

## Why This Is a Rendering Issue, Not Content Issue

| Aspect | Result | Why |
|--------|--------|-----|
| **Source Code** | ✅ Correct | HTML contains correct `₹` character |
| **DOM Tree** | ✅ Correct | JavaScript/React maintains correct value |
| **DevTools** | ✅ Correct | Inspecting DOM shows correct text |
| **Clipboard** | ✅ Correct | Copy preserves original text content |
| **CSS Computed** | ✅ Correct | Styles are properly applied |
| **Screen Render** | ❌ WRONG | Font glyph substitution causes visual error |

**Conclusion:** Pure rendering/display bug. Data integrity intact.

---

## Classification

**Bug Type:** CSS Font Rendering + Font Subset Mismatch  
**Category:** Display/UI Bug  
**Trigger:** Any combination of:
- PT_Sans font (latin subset)
- Indian Rupee symbol (₹)
- Large font sizes (text-4xl, text-2xl)
- Font-weight bold (700)
- `bg-clip-text` CSS property

**Scale:** 
- Visual degradation only
- No functional impact
- No data loss or security issue
- Production display quality affected

---

## Pages Affected

1. **Course Detail Page**
   - Location: `/courses/[slug]`
   - Element: Price display in CTA card
   - Severity: HIGH (prominent price display)

2. **Course Card**
   - Location: `/courses` listing grid
   - Element: Price text in card
   - Severity: MEDIUM (repeated in lists)

3. **Blog Pages**
   - Location: `/blog/*`
   - Element: Where prices mentioned
   - Severity: LOW (sporadic use)

---

## Architecture of the Bug

```
┌─────────────────────────────────────────────────────────┐
│                   RENDERING PIPELINE                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. HTML Content Layer                                  │
│     ├─ Source: ₹{price} (U+20B9)                        │
│     ├─ DOM: Correct character stored                    │
│     └─ ✅ Correct                                        │
│                                                         │
│  2. Font Selection Layer                                │
│     ├─ Attempt: PT_Sans (latin only)                    │
│     ├─ Missing: ₹ glyph not in subset                   │
│     ├─ Fallback: System font (Arial/Segoe)              │
│     └─ ❌ Wrong font metrics                             │
│                                                         │
│  3. Glyph Rendering Layer                               │
│     ├─ Font: System font (not PT_Sans)                  │
│     ├─ Shape: Different baseline/dimensions             │
│     ├─ Size: 2.25rem (text-4xl)                         │
│     └─ ❌ Wrong glyph shape                              │
│                                                         │
│  4. CSS Text Clipping Layer                             │
│     ├─ Property: background-clip: text                  │
│     ├─ Clips to: System font glyph shape                │
│     ├─ Gradient: Blue→Purple                            │
│     └─ ❌ Clipped to wrong shape                         │
│                                                         │
│  5. Screen Render Layer                                 │
│     ├─ Visible: Misaligned gradient                     │
│     ├─ Display: Corrupted character                     │
│     └─ ❌ FINAL: Broken visual                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Key Technical Details

### Unicode Range Problem
```
PT_Sans Subset Loaded: ['latin']
├─ Latin Range: U+0000 to U+007F (ASCII only)
├─ Includes: a-z, A-Z, 0-9, basic punctuation
└─ Excludes: All diacritics, non-Latin scripts

Rupee Symbol: U+20B9
├─ Range: Devanagari Extended
├─ Block: U+A8E0 to U+A8FF
└─ Status: NOT in Latin subset ❌
```

### Font-Family Fallback Chain
```css
font-family: var(--font-pt-sans), sans-serif;

Resolution:
1. var(--font-pt-sans) = "PT Sans"
2. PT Sans has glyph for: a-z, 0-9, basic Latin
3. PT Sans MISSING glyph for: ₹
4. Fallback to: sans-serif (system default)
5. System font has ₹ but different metrics
```

### CSS Property Cascade
```css
Applied to: <span> containing ₹{price}

font-family: PT Sans, sans-serif;     /* Font primary */
font-size: 2.25rem;                    /* Size: text-4xl */
font-weight: 700;                      /* Weight: bold */
background-image: linear-gradient(...) /* Gradient colors */
background-clip: text;                 /* ⚠️ KEY PROPERTY */
-webkit-background-clip: text;         /* Webkit version */
color: transparent;                    /* Uses gradient */

Issue: background-clip: text
├─ Clips background to rendered text shape
├─ Shape derived from: System font glyph (fallback)
├─ Expected shape from: PT Sans glyph (not loaded)
├─ Mismatch causes: Gradient clipping error
└─ Result: Visual corruption
```

---

## No Code Has Been Modified

This is purely a diagnosis document. The bug is present in production.

**For fixing:** Requires either:
1. Load PT_Sans with extended subsets (includes Devanagari)
2. Use different font supporting Devanagari
3. Remove `bg-clip-text` from price displays containing ₹
4. Use symbol name ("Rupee") instead of glyph

**Current state:** Diagnosed, documented, awaiting fix decision.

---

## Conclusion

The rupee symbol displays incorrectly due to a font subset mismatch combined with CSS text clipping. PT_Sans loads only the Latin subset, missing the Devanagari character. The browser falls back to a system font, which has different glyph metrics. The `background-clip: text` CSS property then clips a gradient to the wrong glyph shape, causing visual corruption.

This is a rendering-layer issue with no impact on actual data or functionality.

---

*Report Generated: January 26, 2026*  
*Classification: Display/CSS Bug*  
*Recommendation: Awaiting fix approval*
