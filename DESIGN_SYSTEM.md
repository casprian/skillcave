# 🎨 Attendance Feature - Visual Design Guide

## 📱 Screen Layout

### Attendance Page - Full View

```
┌─────────────────────────────────────┐
│ ← Back           Attendance         │  ← Blue Header (#0369a1)
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Present  │  Absent  │  Late  │ Total │  ← Stats Grid (2x2)
│   12      │    2    │    1   │   15  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 📍 Mark Today's Attendance          │  ← Mark Attendance Card
│                                     │
│ Select attendance type:             │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌──────┐ │
│ │ ✓   │ │ ◐   │ │ ◑   │ │ ⚙️   │ │  ← Type Buttons
│ │Full │ │Half │ │Qtr  │ │Custom│ │
│ │ 8h  │ │ 4h  │ │ 2h  │ │Hours │ │
│ └─────┘ └─────┘ └─────┘ └──────┘ │
│                                     │
│ [Mark Attendance Button - Blue]     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Attendance Rate                      │  ← Attendance Rate Card
│ ████████████░░░░░  80%              │
│ 80% • 12 out of 15 days             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Recent Attendance                    │  ← Attendance List
│ 15 records                           │
├─────────────────────────────────────┤
│ Mar 8, Fri  →  8h  ✓ Present        │
│ Mar 7, Thu  →  4h  ✓ Present        │
│ Mar 6, Wed  →      ✗ Absent         │
│ Mar 5, Tue  →  8h  ✓ Present        │
│ Mar 4, Mon  →  8h  ✓ Present        │
│ ...                                  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 💡 Attendance Tips                   │  ← Tips Card (light blue)
│ • Maintain 75% attendance            │
│ • Notify tutor of absences           │
│ • Consistent attendance improves     │
└─────────────────────────────────────┘
```

---

## 🎯 Component Spacing

```
Header Height:           60px (including top padding)
Content Padding:         20px (horizontal)
Card Padding:           16px
Gap between Cards:      24px
Button Height:          56px (with padding)
Stat Box Height:        100px
```

---

## 🎨 Color Palette

### Primary Colors
```
Blue Primary     #0369a1  ← Main actions, headers
Blue Light       #bfdbfe  ← Input borders, backgrounds
Blue Lighter     #ecf7ff  ← Card backgrounds
```

### Status Colors
```
Green (Present)  #10b981  ← Success, present status
Green Light      #d1fae5  ← Background for green badges
Red (Absent)     #ef4444  ← Error, absent status
Red Light        #fee2e2  ← Background for red badges
Amber (Late)     #f59e0b  ← Warning, late status
Amber Light      #fef3c7  ← Background for amber badges
```

### Text Colors
```
Heading          #0c2d4c  ← Bold, primary text
Subheading       #0c4a6e  ← Section titles
Body             #475569  ← Regular text
Helper           #64748b  ← Secondary text, labels
```

### Backgrounds
```
Page             #f8fafc  ← Light gray
Cards            #ffffff  ← White
Hover            #f1f5f9  ← Slightly darker
```

---

## 🎭 UI States

### Button States

#### Default State
```
[Mark Attendance]
Background: #0369a1
Text Color: white
Opacity: 1.0
```

#### Hover/Active State
```
[Mark Attendance]
Background: #0369a1
Elevation: 5 (shadow increase)
```

#### Disabled State
```
[Marking...]
Background: #0369a1
Opacity: 0.6
Activity Indicator: shown
```

### Attendance Type Button States

#### Unselected
```
┌─────────┐
│ ✓       │
│ Full    │
│ 8h      │
└─────────┘
Background: #f8fafc
Border: #e0e7ff (light)
Text: #0c4a6e
```

#### Selected
```
┌─────────┐
│ ✓       │
│ Full    │
│ 8h      │
└─────────┘
Background: #0369a1
Border: #0369a1
Text: white
```

---

## 📐 Typography

### Headings
```
Header Title:        Font-size 20, Font-weight 800, Color #ffffff
Section Title:       Font-size 18, Font-weight 700, Color #0c2d4c
Card Title:          Font-size 16, Font-weight 700, Color #0c4a6e
```

### Body Text
```
Body Text:          Font-size 13-14, Font-weight 500, Color #475569
Label Text:         Font-size 12, Font-weight 600, Color #64748b
Helper Text:        Font-size 11-12, Font-weight 500, Color #64748b
```

### Numbers
```
Stat Values:        Font-size 28, Font-weight 800, Color: varies
Percentages:        Font-size 14, Font-weight 700, Color: varies
```

---

## 🎬 Success Modal Animation

```
┌─────────────────────────┐
│       Fade In           │
│  ┌───────────────────┐  │
│  │   ┌───────────┐   │  │
│  │   │     ✓     │   │  │ ← Green checkmark, 64px
│  │   └───────────┘   │  │
│  │                   │  │
│  │ Attendance Marked!  │  │ ← Title
│  │                   │  │
│  │ ✓ Attendance      │  │ ← Message (multiline)
│  │ marked...         │  │
│  │                   │  │
│  └───────────────────┘  │
│                         │
│   [Auto-close: 2s]      │
└─────────────────────────┘
```

### Modal Properties
```
Overlay:           rgba(0,0,0,0.5) - Semi-transparent black
Modal Container:   White background, 16px border-radius
Icon Container:    64x64px, #d1fae5 background, 32px border-radius
Animation:         Fade in/out
Duration:          2000ms (2 seconds)
```

---

## 📊 Stat Card Layout

```
┌──────────────┐
│      12      │  ← Font-size 28, Font-weight 800
│   Present    │  ← Font-size 12, Font-weight 600
└──────────────┘

Width:     48% of container
Padding:   16px
Border:    0px (no border)
Shadow:    Elevation 2, subtle
Background: White
```

---

## 📝 Attendance List Item

```
┌─────────────────────────────────────────┐
│ Mar 8, Fri  →  8h  ✓ Present           │
└─────────────────────────────────────────┘

Layout:
┌──────────┐  ┌────────┐  ┌──────────┐
│ Date     │  │ Hours  │  │ Badge    │
│ "Mar 8"  │  │ "8h"   │  │ Present  │
│ (flex)   │  │        │  │ (colored)│
└──────────┘  └────────┘  └──────────┘

Heights:
Item Height:    56px (padding 14px vertical)
Border Bottom:  1px #e0e7ff
```

---

## 🎯 Interactive Elements

### Type Button Interaction
```
Default:    Light gray background, #e0e7ff border
Tap:        Scale to 0.95
Selected:   Blue background, white text
Animation:  200ms ease-out
```

### Mark Button Interaction
```
Default:    Blue background (#0369a1)
Tap:        Elevation increases (shadow grows)
Disabled:   Opacity 0.6
Feedback:   ActivityIndicator replaces text
```

### Back Button Interaction
```
Default:    Text color white
Tap:        Opacity decreases to 0.7
Action:     router.back()
```

---

## 📱 Responsive Breakpoints

### Mobile (Default)
```
Width:       100% of screen
Max Width:   None (full screen)
Padding:     20px horizontal
Card Width:  100% - 40px (padding)
```

### Tablet (if supported)
```
Max Width:   600px (centered)
Padding:     40px horizontal
Card Width:  Full minus padding
```

---

## 🌙 Dark Mode Support (Future)

```
Primary:         #164e63 (darker blue)
Background:      #1e293b (dark gray)
Cards:           #0f172a (darker)
Text:            #e2e8f0 (light text)
Success:         #059669 (brighter green)
```

---

## ✨ Animation Effects

### Page Transitions
```
Entrance:   Fade in from 0.7 opacity
Duration:   300ms
Easing:     ease-out
```

### Modal Appearance
```
Type:       Fade overlay + scale modal
Duration:   250ms entrance, 200ms exit
Easing:     ease-out entrance, ease-in exit
```

### Button Press
```
Type:       Touch feedback (elevation change)
Duration:   150ms
Easing:     ease-in-out
```

---

## 📏 Dimensions Summary

| Element | Dimension |
|---------|-----------|
| Header Height | 66px (50px top padding + 16px padding) |
| Stat Box Width | 48% |
| Button Height | 56px |
| Type Button Height | 80px |
| List Item Height | 56px |
| Icon Size (large) | 20px |
| Icon Size (stat) | - |
| Border Radius | 8-12px |
| Shadow Elevation | 2-5 |

---

## 🎨 Final Design Notes

### Consistent with:
- ✅ Modern Material Design principles
- ✅ Professional enterprise apps
- ✅ Clean minimalist approach
- ✅ Mobile-first responsive design
- ✅ Accessibility standards
- ✅ Brand color scheme

### Professional Touches:
- ✅ Subtle shadows for depth
- ✅ Adequate whitespace
- ✅ Consistent typography hierarchy
- ✅ Color-coded status indicators
- ✅ Smooth animations
- ✅ Clear visual feedback
- ✅ Intuitive user flow

---

**Design System Version**: 1.0  
**Last Updated**: March 2026  
**Status**: ✅ Production Ready
