# 02 — Design Principles at Work

---

## 1. Single Source of Truth (SSOT)

Every piece of data lives in exactly **one** place. Other values are derived from it, never duplicated.

| Principle | Lines | How |
|-----------|-------|-----|
| `letters` array is the one truth | `useLetters.ts:16` | `const [letters, setLetters] = useState<Letter[]>(loadLetters)` — all letter data comes from this array. Nothing else stores a copy. |
| `view` determines which screen | `App.tsx:7` | `const [view, setView] = useState<View>('landing')` — the entire app's screen choice flows from one string. |
| `isOpen` controls the dialog | `DeleteModal.tsx:12-20` | The modal doesn't track its own visibility. It reads `isOpen` prop. `showModal()`/`close()` are just reactions. |
| Form state lives in the form | `LetterCreationPanel.tsx:77-82` | `recipient`, `content`, `month`, `day`, `year` — 5 state variables, nothing duplicated in refs or elsewhere. |

---

## 2. Persistence (State Survival)

Data outlives the browser tab. Refresh the page and your letters are still there.

| Mechanism | Lines | How |
|-----------|-------|-----|
| Load on init | `useLetters.ts:6-13` | `localStorage.getItem(STORAGE_KEY)` then `JSON.parse` — reads saved letters when the app boots. |
| Save on change | `useLetters.ts:18-20` | `useEffect` writes `JSON.stringify(letters)` to `localStorage` every time `letters` changes. |
| Unique identifiers | `useLetters.ts:25` | `crypto.randomUUID()` — each letter gets a permanent ID so it can be found, deleted, or referenced later. |
| Timestamps | `useLetters.ts:26` | `new Date().toISOString()` — `createdAt` is captured once and stored, not recalculated. |

**Why not just use React state?** State disappears when the tab closes. `localStorage` is the browser's permanent closet. The pattern is: *load from localStorage on mount → keep in state while running → save to localStorage on every change*.

---

## 3. Derived State

Some values aren't stored — they're **computed on the fly** from the source of truth. This avoids duplication and bugs.

| Derived value | Source | Lines | Formula |
|---------------|--------|-------|---------|
| `progress` (scroll) | DOM position | `LandingPage.tsx:5-23` | `-rect.top / scrollable`, clamped to `[0, 1]` |
| `remaining` (countdown) | `progress` | `LandingPage.tsx:434` | `totalMinutes * (1 - progress)` |
| `days`, `hours`, `minutes` (display) | `remaining` | `LandingPage.tsx:435-437` | `Math.floor(remaining / (24*60))`, `% (24*60) / 60`, `% 60` |
| `unlocked` | `unlockDate` vs now | `LetterCard.tsx:4-6` | `new Date(unlockDate) <= new Date()` |
| `countdown` (text) | `unlockDate` vs now | `LetterCard.tsx:8-21` | `target.getTime() - now.getTime()` decomposed to d/h/m |
| `maxDay` (days in month) | `month`, `year` | `LetterCreationPanel.tsx:89` | `daysInMonth(m, y)` → `new Date(year, month, 0).getDate()` |
| `days` array | `maxDay` | `LetterCreationPanel.tsx:90` | `Array.from({ length: maxDay }, (_, i) => i + 1)` |
| `charCount` | `content` | `LetterCreationPanel.tsx:105` | `content.length` |
| `monthOptions` / `dayOptions` / `yearOptions` | raw numbers | `LetterCreationPanel.tsx:92-103` | Mapped to `{ value, label }` objects for pickers |
| `years` | current year | `LetterCreationPanel.tsx:85` | `currentYear + i` for 11 years |

**The test**: If you can delete a piece of state and compute it instead, it's derived. For example, we never store `"Unlocked"` or `"Locked"` — we check `isUnlocked(letter.unlockDate)` every render.

---

## 4. Side Effects Management

Side effects (things that reach outside React's world) are isolated and controlled.

| Side effect | Location | How it's managed |
|-------------|----------|-----------------|
| `localStorage.setItem` | `useLetters.ts:19` | Wrapped in `useEffect` with `[letters]` dependency — only runs when letters actually change. |
| `window.addEventListener('scroll', ...)` | `LandingPage.tsx:18` | Added in `useEffect`, removed in cleanup `return () => window.removeEventListener(...)`. Passive flag for performance. |
| `el.addEventListener('pointerdown', ...)` | `LandingPage.tsx:372-381` | Three event listeners added in `useEffect`, all three removed in cleanup. `releaseAnimRef.current?.pause()` prevents orphaned animations. |
| `el.showModal()` / `el.close()` | `DeleteModal.tsx:12-20` | Imperative DOM calls driven by `isOpen` prop in a `useEffect`. The React way: "declare, don't command." |
| `scrollIntoView` | `AppInterface.tsx:29-31` | Called in `setTimeout` after state update — waits for React to render the new letter before scrolling. |
| `anime().seek()` | `LandingPage.tsx:244,522` | Animations are created once (paused at frame 0), then `seek()` is called on progress change — no new animation objects per frame. |

**The pattern**: Side effects always live inside `useEffect` or event handlers. They never run during render. Cleanup functions undo what was set up.

---

## 5. Unidirectional Data Flow

Data flows **down** via props. Actions flow **up** via callbacks.

```
App
 ├── LandingPage
 │     └── onEnterApp (callback up)
 └── AppInterface
       ├── useLetters (hook)
       │     ├── letters (state down)
       │     ├── addLetter (action)
       │     └── deleteLetter (action)
       ├── LetterCreationPanel
       │     └── onSave (callback up → addLetter)
       ├── LetterFeed
       │     ├── letters (state down)
       │     └── onDelete (callback up → deleteLetter)
       │           └── LetterCard
       │                 └── onDelete (callback up)
       ├── DeleteModal
       │     ├── isOpen (state down)
       │     ├── onClose (callback up)
       │     └── onConfirm (callback up)
       └── EmptyState
             └── onCreateClick (callback up)
```

**No child component ever mutates parent state directly.** They call a function the parent gave them (a callback), and the parent decides what to do.

---

## 6. Immutability

State is never mutated — it's replaced with a new copy.

| Location | Lines | Pattern |
|----------|-------|---------|
| Add letter | `useLetters.ts:28` | `setLetters(prev => [newLetter, ...prev])` — spread creates a new array |
| Delete letter | `useLetters.ts:32` | `setLetters(prev => prev.filter(l => l.id !== id))` — `filter` returns a new array |
| Form reset | `LetterCreationPanel.tsx:134-138` | `setRecipient('')`, `setContent('')`, etc. — each field gets a new string, never mutated in place |

**Why?** React detects changes by reference equality. If you mutate the old array and pass it back, React thinks nothing changed. New reference → React knows to re-render.

---

## 7. Defensive Programming

The code assumes things can and will go wrong.

| Guard | Lines | Why |
|-------|-------|-----|
| `try/catch` on localStorage | `useLetters.ts:7-12` | localStorage can throw if full, disabled, or corrupted. Without this, the app would crash on load. |
| `if (!el) return` | `LandingPage.tsx:9,57,204,324` | Refs can be null before mount or after unmount. Early return prevents `Cannot read properties of null` errors. |
| `Math.max(0, Math.min(1, ...))` | `LandingPage.tsx:15` | Clamps progress to `[0, 1]`. Floating point math could produce `1.0000001`; this keeps it safe. |
| `selected <= today` | `LetterCreationPanel.tsx:123` | Catches past dates AND today. `<=` not `<`. Without this, picking today would "work" but the letter would immediately be unlocked. |
| `scrollable <= 0` | `LandingPage.tsx:14` | If the section is shorter than the viewport, no scrolling is possible. Set progress to 1 and return early. |

---

## 8. Separation of Concerns

Each file has one job.

| File | Job | Doesn't do |
|------|-----|------------|
| `types.ts` | Define data shapes | No logic, no rendering |
| `useLetters.ts` | Manage letter state + persistence | No UI, no event handling |
| `LandingPage.tsx` | Marketing + animations | No localStorage, no letter CRUD |
| `AppInterface.tsx` | App shell + layout | No animation logic, no form details |
| `LetterCreationPanel.tsx` | Form input + validation | Doesn't save to localStorage directly |
| `LetterCard.tsx` | Display one letter | Doesn't fetch data |
| `LetterFeed.tsx` | List of letters | Doesn't know about forms |
| `DeleteModal.tsx` | Confirmation dialog | Doesn't touch letter state |
| `EmptyState.tsx` | Empty state UI | No business logic |
| `index.css` | All visual styling | No JavaScript |

Components that do one thing are easier to change, test, and reuse.

---

## 9. Lazy Initialization

Expensive setup runs only when needed, not on every render.

| Example | Lines | How |
|---------|-------|-----|
| `useState<Letter[]>(loadLetters)` | `useLetters.ts:16` | `loadLetters` is called **once** — the first time the component mounts. React only calls the initializer function when creating the state for the first time. |
| Animation setup in `useEffect` | `LandingPage.tsx:200-241, 475-518` | Anime.js objects are created in `useEffect` with `[]` deps — runs once on mount, not on every render. |
| `options` arrays with `useMemo` | `LetterCreationPanel.tsx:92-103` | `monthOptions` never changes (stable reference). `dayOptions` only recomputes when `maxDay` changes. |
| `years` with `useMemo` | `LetterCreationPanel.tsx:85` | Only recomputes when `currentYear` changes (once a year). |

---

## 10. Collocation

Related code lives close together.

| Example | Lines | Why it matters |
|---------|-------|---------------|
| `isUnlocked` and `getCountdown` defined **in** `LetterCard.tsx` | `LetterCard.tsx:4-21` | These functions are only used by `LetterCard`. Putting them in a shared utils file would separate logic from its only consumer. |
| `toISO` and `daysInMonth` defined **in** `LetterCreationPanel.tsx` | `LetterCreationPanel.tsx:12-18` | Only used for date validation in the creation form. |
| Scroll progress hook defined **in** `LandingPage.tsx` | `LandingPage.tsx:4-24` | Only the landing page uses pinned scroll. No reason to extract to a shared hooks folder. |
| `BIRD_PATHS` array defined **above** `Birdie` component | `LandingPage.tsx:26-48` | The data and the component that consumes it are in the same file, visible within a few lines. |

---

## 11. Fail Closed / Fail Safe

When something goes wrong, the app defaults to a safe state rather than a broken one.

| Scenario | Safe default | Lines |
|----------|-------------|-------|
| localStorage is corrupted | `[]` (empty array, no letters lost that weren't already) | `useLetters.ts:11` |
| localStorage is full | `[]` (app starts fresh) | `useLetters.ts:11` |
| Scroll container doesn't exist | `0` (no progress) | `LandingPage.tsx:10` |
| Animation ref is null | Skip that animation, continue with the rest | `LandingPage.tsx:204-237` (each ref checked individually) |
| Invalid month/day/year combo | Form rejects with error message | `LetterCreationPanel.tsx:123` |
| Future date not selected | `setError('...')`, no letter saved | `LetterCreationPanel.tsx:124` |
