# 🎨 CV Tailoring Feature - Visual Guide

## What You'll See

### 1. Job Cards with "Tailor CV" Button
On any job listing (matches, saved, applied), you'll see:

```
┌─────────────────────────────────────────────────────┐
│ Senior Full-Stack Developer              95%        │
│ TechCorp                                Match       │
│ 📍 San Francisco, CA  [Remote]                      │
│                                                     │
│ Skills: JavaScript TypeScript React Node.js +3      │
│                                                     │
│ Why it matches:                                     │
│ ✓ 7 years experience exceeds 5+ requirement        │
│ ✓ Strong match in React, Node.js, PostgreSQL       │
│ ✓ Senior-level aligns with leadership role         │
│                                                     │
│ ┌────────────────┐  ┌──────┐  ┌──────┐            │
│ │ 📝 Tailor CV   │  │ Save │  │ Apply│            │
│ └────────────────┘  └──────┘  └──────┘            │
└─────────────────────────────────────────────────────┘
```

**"Tailor CV" button** is prominently displayed with gradient blue background!

---

### 2. Tailor CV Page Layout

When you click "Tailor CV", you'll see:

```
┌─────────────────────────────────────────────────────────────────────┐
│  Tailor CV                                      ← Back to Jobs       │
│  for Senior Full-Stack Developer at TechCorp                        │
│  📝 Add Tailoring Notes                                              │
│                                                                      │
│  ┌─────────────────────────────┬──────────────────────────────┐   │
│  │  CV EDITOR (Left Panel)     │  DESIGN PANEL (Right)        │   │
│  │                              │                              │   │
│  │  ┌────────────────────────┐ │  ┌────────────────────────┐ │   │
│  │  │ 👁 CV Preview          │ │  │  🎨 Style Your CV      │ │   │
│  │  │ Click to edit          │ │  │                        │ │   │
│  │  └────────────────────────┘ │  │  Choose Template:      │ │   │
│  │                              │  │  ⊙ Classic Clean       │ │   │
│  │  JOHN DOE                    │  │  ○ Modern Two-Column   │ │   │
│  │  Senior Developer            │  │  ○ Technical Compact   │ │   │
│  │  ─────────────────────       │  │  ○ Creative Accent     │ │   │
│  │                              │  │                        │ │   │
│  │  Professional Summary        │  │  Color Theme:          │ │   │
│  │  [Click to edit...]          │  │  ⬛ ⬛ ⬛ ⬛ ⬛ ⬛      │ │   │
│  │                              │  │                        │ │   │
│  │  Skills                      │  │  Actions:              │ │   │
│  │  [JavaScript] [TypeScript]   │  │  ┌──────────────────┐ │ │   │
│  │  [React] [+Add Skill]        │  │  │ Save CV Version  │ │ │   │
│  │                              │  │  └──────────────────┘ │ │   │
│  │  Experience                  │  │  ┌──────────────────┐ │ │   │
│  │  Senior Developer            │  │  │ Download PDF     │ │ │   │
│  │  • [Edit bullet point...]    │  │  └──────────────────┘ │ │   │
│  │  • [Edit bullet point...]    │  │  ┌──────────────────┐ │ │   │
│  │  [+ Add bullet point]        │  │  │ Download DOCX    │ │ │   │
│  │                              │  │  └──────────────────┘ │ │   │
│  │  [+ Add Position]            │  │                        │ │   │
│  │                              │  │  💡 Pro Tips:          │ │   │
│  └──────────────────────────────┘  │  • Click to edit     │ │   │
│                                     │  • Use action verbs   │ │   │
│                                     │  • Quantify results   │ │   │
│                                     └────────────────────────┘ │   │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 3. CV Editor Features

#### Editable Name & Title
```
JOHN DOE             ← Click to edit
Senior Developer     ← Click to edit
─────────────────────────
```

#### Editable Summary
```
Professional Summary
┌──────────────────────────────────────────┐
│ Experienced developer with 7+ years...   │
│ [Click anywhere to edit this text]       │
└──────────────────────────────────────────┘
```

#### Interactive Skills
```
Skills
┌─────────────┐ ┌──────────────┐ ┌────────┐
│ JavaScript×│ │ TypeScript ×│ │ React×│
└─────────────┘ └──────────────┘ └────────┘
         ↑ Hover to see remove button

[+ Add Skill] ← Click to add new
```

#### Experience with Bullets
```
Experience                          [+ Add Position]

Senior Developer                    [×] ← Remove
Company Name  |  Location  |  2020-2023
• Achievement one [edit] [×]
• Achievement two [edit] [×]
[+ Add bullet point]
```

---

### 4. Design Panel - Template Selection

```
Choose Template

┌─────────────────────────────────┐
│ ✓ Classic Clean                 │ ← Selected (blue border)
│ Simple single-column layout...  │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│   Modern Two-Column             │
│ Skills sidebar + experience...  │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│   Technical Compact             │
│ Dense layout for engineers...   │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│   Creative Accent               │
│ Subtle colors and icons...      │
└─────────────────────────────────┘
```

---

### 5. Color Theme Picker

```
Color Theme

⬛        ⬛        ⬛
Black    Navy     Forest
  ✓       

⬛        ⬛        ⬛
Burgundy Royal    Gold
```

---

### 6. Loading State

When generating CV:

```
┌─────────────────────────────────┐
│                                 │
│         ⟳ Loading...            │
│                                 │
│  Tailoring your CV for          │
│  TechCorp...                    │
│                                 │
└─────────────────────────────────┘
```

---

### 7. Action Buttons

```
┌──────────────────────────────────┐
│  💾 Save CV Version              │ ← Primary action
└──────────────────────────────────┘

┌──────────────────────────────────┐
│  📄 Download PDF                 │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│  📝 Download DOCX                │
└──────────────────────────────────┘
```

---

## Color Scheme

**Primary:** Blue gradient (#3B82F6 → #2563EB)  
**Accent:** Selected template/color gets blue border  
**Text:** Gray-900 for headers, Gray-700 for body  
**Background:** White with subtle gray borders  
**Hover:** Gray-50 for buttons, opacity for remove buttons  

---

## Interactive Elements

### Hover Effects
- ❌ Remove buttons appear on hover
- 🎨 Template cards change border color
- 🖱️ Cursor changes to pointer on clickable items

### Focus States
- 🔵 Blue ring (2px) around focused inputs
- 💡 Visual feedback on all interactive elements

### Transitions
- ✨ Smooth 150-200ms transitions
- 🎭 Fade in/out for remove buttons
- 🎨 Border color changes

---

## Responsive Behavior

**Desktop (lg+):**
- 2/3 width for CV Editor
- 1/3 width for Design Panel (sticky)

**Tablet:**
- Stacked layout
- Full width components

**Mobile:**
- Single column
- Touch-friendly buttons

---

## Typography

**Headers:** 
- Name: 3xl, bold
- Title: xl, medium
- Sections: lg, semibold

**Body:**
- Regular text: base, normal
- Small text: sm
- Tiny text: xs

---

## Icons

All icons are from **Heroicons** (outline style):
- ✏️ Edit/Pencil for editing
- ❌ X for remove
- ➕ Plus for add
- 💾 Save icon
- 📄 Document icons
- 🎨 Palette for design
- 👁️ Eye for preview

---

## User Experience Flow

1. **Discovery** → See "Tailor CV" button on job cards
2. **Click** → Navigate to tailor page
3. **Wait** → See loading spinner (2-4 seconds)
4. **Review** → AI-generated CV appears
5. **Edit** → Click any text to modify
6. **Customize** → Choose template and colors
7. **Refine** → Add/remove content as needed
8. **Export** → Download final CV

---

## Accessibility

✅ Keyboard navigation (Tab through fields)  
✅ Focus indicators (blue ring)  
✅ Semantic HTML (proper headings)  
✅ Alt text for icons (via aria-labels)  
✅ High contrast text  
✅ Large click targets (44px minimum)  

---

## Mobile Optimizations

📱 Touch-friendly buttons (48px)  
📱 No hover-dependent interactions  
📱 Stacked layout on small screens  
📱 Larger text for readability  
📱 Swipe gestures (future enhancement)  

---

**The interface is clean, modern, and intuitive - designed to make CV tailoring effortless!**
