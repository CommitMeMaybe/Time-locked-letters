# 01 — Codebase Explanation

## Imagine you are seven

This app is like a **digital time capsule**. You write a letter, pick a future date, lock it away, and nobody can read it until that date arrives. The app saves your letters so they're still there even if you close the browser.

---

## The file tree

```
index.html              — the HTML page (almost empty, just a <div id="root">)
src/
  main.tsx              — starts the React app
  App.tsx               — decides: show landing page OR the app?
  types.ts              — defines what a "Letter" looks like (shape of data)
  index.css             — all the styles (colors, fonts, animations)
  hooks/
    useLetters.ts       — saves/loads letters from localStorage
  components/
    LandingPage.tsx     — the beautiful intro page with hourglass, envelope, padlock
    AppInterface.tsx    — the real app: create letters + see your list
    LetterCreationPanel.tsx — the form where you write a letter
    LetterFeed.tsx      — the list of all your letters
    LetterCard.tsx      — one letter in the list (shows countdown, content if unlocked)
    DeleteModal.tsx     — a popup that asks "are you sure?"
    EmptyState.tsx      — shown when you have zero letters
```

---

## `src/types.ts` — What is a Letter?

```ts
export interface Letter {
  id: string;
  recipient: string;
  content: string;
  unlockDate: string;
  createdAt: string;
}
```

A **Letter** is just a bucket with 5 slots:

| Slot         | Meaning |
|--------------|---------|
| `id`         | A unique name for this letter (like a fingerprint) |
| `recipient`  | Who the letter is for (e.g. "Future Me") |
| `content`    | The actual message |
| `unlockDate` | The date when the letter becomes readable, stored as a **string** in ISO format (e.g. `"2027-06-15T12:00:00.000Z"`) |
| `createdAt`  | When you wrote it, also an ISO string |

Both dates are **strings**, not Date objects. Strings are easier to save in localStorage.

---

## `src/hooks/useLetters.ts` — The letter storage machine

This is the **brain** that keeps your letters alive.

```ts
const STORAGE_KEY = 'time-locked-letters'
```

A key that tells localStorage where to find our letters. Like a drawer label.

### `loadLetters()` — reading from localStorage

```ts
function loadLetters(): Letter[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}
```

- **`localStorage.getItem(...)`** — opens the drawer and grabs whatever string is inside.
- If the drawer is empty (`null`), we return an empty array `[]`.
- **`JSON.parse(raw)`** — converts the string back into real JavaScript objects (an array of Letters).
- The `try/catch` is a safety net: if the string is somehow broken, we return `[]` instead of crashing.

### `useLetters()` — the hook

```ts
const [letters, setLetters] = useState<Letter[]>(loadLetters)
```

`useState` is given `loadLetters` as its starting value. This is a **lazy initializer** — React only calls `loadLetters` once, the very first time this component runs. That's when it reads from localStorage.

```ts
useEffect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(letters))
}, [letters])
```

**🔥 TRICKY PART — `useEffect` and saving to localStorage**

This `useEffect` runs **every time `letters` changes**. Here's how it works:

1. You add a letter → React updates `letters` (the state)
2. React re-renders the component
3. React sees this `useEffect` depends on `[letters]`
4. It runs the function: `localStorage.setItem(...)` saves all letters as a JSON string

**Why is this important?** Every time you add or delete a letter, the entire array gets re-saved. This is simple but works because our array is small.

### `addLetter()` and `deleteLetter()`

```ts
const addLetter = useCallback((letter: Omit<Letter, 'id' | 'createdAt'>) => {
  const newLetter: Letter = {
    ...letter,                          // copy over recipient, content, unlockDate
    id: crypto.randomUUID(),            // generate a unique ID
    createdAt: new Date().toISOString(), // stamp with the current time
  }
  setLetters(prev => [newLetter, ...prev]) // prepend to the front
}, [])
```

- `crypto.randomUUID()` generates a unique ID like `"a1b2c3d4-..."` so every letter has its own name.
- `new Date().toISOString()` captures the exact moment you hit "Save".
- `setLetters(prev => [newLetter, ...prev])` — the `prev` is the **previous** array of letters. We create a new array with the new letter at position 0 and all the old ones after it.

```ts
const deleteLetter = useCallback((id: string) => {
  setLetters(prev => prev.filter(l => l.id !== id))
}, [])
```

- `.filter(l => l.id !== id)` — keep only letters whose `id` does NOT match the one we're deleting. This creates a brand new array (we never mutate the old one).

### `useCallback` — what's that?

`useCallback` wraps a function so it doesn't get re-created on every render. The `[]` dependency means "create this function once and never change it". It's an optimization — without it the code still works, but child components might re-render unnecessarily.

---

## `src/App.tsx` — The big switch

```ts
const [view, setView] = useState<View>('landing')
```

Two possible views: `'landing'` (the pretty marketing page) or `'app'` (the actual letter tool).

```tsx
{view === 'landing' ? (
  <LandingPage onEnterApp={() => setView('app')} />
) : (
  <AppInterface onBack={() => setView('landing')} />
)}
```

A ternary: if we're on landing, show `LandingPage`; otherwise show `AppInterface`. The `onEnterApp` and `onBack` callbacks let the child components flip the switch.

---

## `src/components/LandingPage.tsx` — The fancy marketing page

This is the **biggest file** (824 lines). Let's break it into pieces.

### `useScrollProgress` — magic scroll detector

```ts
function useScrollProgress(ref: React.RefObject<HTMLDivElement | null>): number {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const handleScroll = () => {
      const rect = el.getBoundingClientRect()
      const scrollable = rect.height - window.innerHeight
      if (scrollable <= 0) { setProgress(1); return }
      setProgress(Math.max(0, Math.min(1, -rect.top / scrollable)))
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [ref])

  return progress
}
```

**🔥 TRICKY PART — How pinned scroll progress works**

This hook tracks **how far the user has scrolled through a tall section**.

1. We have a `<section>` that is `400vh` tall (4× the screen height)
2. Inside it, a child is `sticky top-0 h-screen` (it sticks to the top while you scroll)
3. As you scroll down the 400vh section, the sticky child stays put

How progress is calculated:
- `rect = el.getBoundingClientRect()` — gives us the section's position on screen
- `rect.top` starts at 0 (section just entered viewport) and goes down to maybe `-3 * window.innerHeight`
- `scrollable = rect.height - window.innerHeight` = how many pixels of scrolling are available
- `-rect.top / scrollable` converts position to a number from 0 to 1
- `Math.max(0, Math.min(1, ...))` clamps it between 0 and 1 (can't go below 0 or above 1)

**The `useEffect` setup:**
- It adds a scroll listener when the component mounts
- `{ passive: true }` tells the browser "don't wait for me, just scroll" — makes scrolling smoother
- The **cleanup function** `return () => window.removeEventListener(...)` removes the listener when the component disappears. Without this, you'd have ghost listeners piling up and causing bugs.

### The animated sections

**Section 2** (Hourglass) — `ref={pinnedRef}`, `progress={pinnedProgress}`:
The `HourglassIllustration` component receives `progress` (0 to 1). Inside it, there are multiple anime.js animations paused at frame 0. When `progress` changes:

```ts
useEffect(() => {
  animsRef.current.forEach(anim => anim.seek(anim.duration * progress))
}, [progress])
```

`anim.seek(t)` jumps to frame `t` of the animation. So at progress=0, the hourglass is full; at progress=1, it's empty.

**Section 4** (Countdown) — same pattern, but `CountdownIllustration` does arithmetic:

```ts
const totalMinutes = 120 * 24 * 60 + 13 * 60 + 42  // 120 days, 13 hours, 42 minutes
const remaining = totalMinutes * (1 - progress)
```

At progress=0, remaining = totalMinutes (all the time is left).
At progress=0.5, half the time has passed.
At progress=1, remaining = 0 (time's up).

**Section 5** (Envelope morph) — `EnvelopeMorphIllustration` uses `morphTo` from anime.js to smoothly change the flap's path from closed to open.

### `PadlockIllustration` — Draggable padlock

**🔥 TRICKY PART — Manual pointer events**

We don't use `createDraggable` because that uses CSS `translateX`/`translateY`, which don't work on SVG `<g>` elements.

Instead, we manually handle three events:

```ts
const onPointerDown = (e: PointerEvent) => {
  e.preventDefault()
  releaseAnimRef.current?.pause()     // stop any spring-back animation
  el.setPointerCapture(e.pointerId)    // keep getting events even if pointer leaves
  // ... save starting position
}
```

`setPointerCapture` tells the browser: "Don't lose track of this touch/mouse even if the finger moves outside the element."

```ts
const onPointerMove = (e: PointerEvent) => {
  if (!state.active) return
  // calculate new position in viewBox coordinates
  posRef.current.x = state.origX + (vb.x - state.startX)
  posRef.current.y = state.origY + (vb.y - state.startY)
  el.setAttribute('transform', `translate(${posRef.current.x}, ${posRef.current.y})`)
}
```

`state.active` is a **ref** (not state) because we don't want re-renders on every pixel of movement. State updates cause re-renders; refs don't.

```ts
const onPointerUp = () => {
  if (!state.active) return
  state.active = false
  el.releasePointerCapture(state.pointerId)

  releaseAnimRef.current = animate(posRef.current, {
    x: 150,
    y: 155,
    ease: createSpring({ stiffness: 120, damping: 6 }),
    onUpdate: () => {
      el.setAttribute('transform', `translate(${posRef.current.x}, ${posRef.current.y})`)
    },
  })
}
```

When released, a **spring animation** snaps it back to center (150, 155). `createSpring` returns a spring object. Passing it directly to `ease` tells anime.js "use spring physics" — it auto-calculates duration and gives a bouncy feel.

**Cleanup:**
```ts
return () => {
  el.removeEventListener('pointerdown', onPointerDown)
  el.removeEventListener('pointermove', onPointerMove)
  el.removeEventListener('pointerup', onPointerUp)
  releaseAnimRef.current?.pause()
}
```

Always remove event listeners when the component unmounts. Otherwise, they'd still fire on an element that no longer exists.

---

## `src/components/AppInterface.tsx` — The main app screen

This component:
1. Calls `useLetters()` to get the letter data and actions
2. Renders a **sticky header** with a back button
3. Shows `LetterCreationPanel` on the left (sticky on desktop via `md:sticky md:top-24`)
4. Shows `LetterFeed` on the right

```ts
const handleSave = (letter: { recipient: string; content: string; unlockDate: string }) => {
  addLetter(letter)
  setTimeout(() => {
    feedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, 100)
}
```

- First, the letter is saved to state (+ localStorage via `useEffect`)
- Then after 100ms (to let React finish rendering), the page scrolls down to the feed so you can see your new letter in the list

---

## `src/components/LetterCreationPanel.tsx` — The letter-writing form

### Date validation — the most important guard

```ts
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault()
  setError('')

  if (!recipient.trim() || !content.trim() || !month || !day || !year) {
    setError('All fields are required.')
    return
  }

  const mNum = Number(month)
  const dNum = Number(day)
  const yNum = Number(year)
  const selected = new Date(yNum, mNum - 1, dNum)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (selected <= today) {
    setError('Unlock date must be in the future.')
    return
  }
```

**🔥 TRICKY PART — Date comparisons**

- `new Date(yNum, mNum - 1, dNum)` — months are 0-indexed. January is 0, December is 11. So we subtract 1 from the user's chosen month.
- `new Date()` creates a Date for **right now**, including the current time.
- `today.setHours(0, 0, 0, 0)` sets it to midnight of today. We do this so that "today" doesn't count as "in the future". If you pick today at noon, `selected` is midnight today, and `today` is also midnight today. Since `selected <= today` is true, it's rejected. You must pick at least tomorrow.
- `selected <= today` compares two Date objects. JavaScript converts them to numbers (milliseconds since 1970) automatically when you use `<=`.

### `toISO` — making a consistent date string

```ts
function toISO(month: number, day: number, year: number) {
  return new Date(year, month - 1, day, 12, 0, 0).toISOString()
}
```

Notice noon (`12, 0, 0`). Why noon? Because `new Date(year, month-1, day)` would be midnight in the user's local timezone, and `toISOString()` converts to UTC. In some timezones, midnight local could be the previous day in UTC. Using noon avoids off-by-one-day bugs.

### The iOS wheel picker on mobile

The `WheelColumn` component creates a scrollable list with snap points:

```ts
useEffect(() => {
  if (!listRef.current || !value) return
  const idx = options.findIndex(o => o.value === value)
  if (idx >= 0) listRef.current.scrollTop = idx * ITEM_H
}, [options, value])
```

When the value changes (e.g. month changes), the list scrolls to show the correct item. This is needed because changing the year might reset the day, and the day spinner needs to scroll back to the top.

```ts
const handleScroll = useCallback(() => {
  if (timerRef.current) clearTimeout(timerRef.current)
  timerRef.current = setTimeout(() => {
    if (!listRef.current) return
    const idx = Math.round(listRef.current.scrollTop / ITEM_H)
    const clamped = Math.max(0, Math.min(idx, options.length - 1))
    const opt = options[clamped]
    if (opt && opt.value !== value) onChange(opt.value)
  }, 80)
}, [options, value, onChange])
```

**🔥 TRICKY PART — Debounced scroll**

Every time you scroll, `handleScroll` is called many times. But we don't want to update the state on every pixel — we wait 80ms after you stop scrolling. This is called **debouncing**.

1. `clearTimeout(timerRef.current)` — cancel any pending timer
2. `setTimeout(..., 80)` — start a new timer
3. When the timer fires, we read the current scroll position and pick the nearest item

If you keep scrolling, the timer keeps getting cancelled and recreated. Only when you stop for 80ms does the selection actually change.

### Reset logic

```ts
const handleMonthChange = (v: string) => { setMonth(v); setDay('') }
const handleYearChange = (v: string) => { setYear(v); setDay('') }
```

When month or year changes, the day resets. Why? Because February doesn't have 31 days. If you picked day 31 in January, then switched to February, day 31 doesn't exist. Resetting ensures consistency.

---

## `src/components/LetterCard.tsx` — One letter in the list

### `isUnlocked` — checking if a letter can be read

```ts
function isUnlocked(unlockDate: string): boolean {
  return new Date(unlockDate) <= new Date()
}
```

**🔥 TRICKY PART — `new Date(unlockDate) <= new Date()`**

This compares two Date objects. JavaScript converts both to milliseconds (number of milliseconds since Jan 1, 1970). If the unlock time is in the past (or right now), the letter is unlocked.

**Important**: This comparison runs **every time the component renders**. If the letter unlocks at 3:00 PM, and you check at 2:59 PM, it's locked. If you check at 3:00 PM, it's unlocked. The card doesn't auto-update — it only updates when the component re-renders (e.g. when you add/delete a letter or navigate back).

### `getCountdown` — how much time is left

```ts
function getCountdown(unlockDate: string): string {
  const now = new Date()
  const target = new Date(unlockDate)
  const diff = target.getTime() - now.getTime()
  if (diff <= 0) return 'Unlocked'

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const mins = Math.floor((diff / (1000 * 60)) % 60)

  if (days > 0) return `${days}d ${hours}h ${mins}m`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}
```

- `.getTime()` returns milliseconds. We subtract to get the difference in milliseconds.
- `1000 * 60 * 60 * 24` = 86,400,000 ms in a day. `Math.floor(diff / that)` = how many full days.
- `% 24` — we take the remainder after removing days, then divide by hours.
- Same pattern for minutes.

**Edge case**: If `diff` is negative (the unlock date has passed), it returns `'Unlocked'`.

### Rendering locked vs unlocked content

```tsx
{unlocked ? (
  <div className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap animate-fade-in">
    {letter.content}
  </div>
) : (
  <div className="flex items-center gap-2 text-text-secondary/30 text-sm italic">
    Content locked until unlock date
  </div>
)}
```

If unlocked: show the real content with `whitespace-pre-wrap` (preserves line breaks the user typed).
If locked: show a placeholder icon and text.

---

## `src/components/LetterFeed.tsx` — The letter list

Simple: if there are no letters, show `EmptyState`. Otherwise, show a heading with count and a list of `LetterCard`s.

```tsx
{letters.map((letter) => (
  <div key={letter.id} className="animate-slide-in">
    <LetterCard letter={letter} onDelete={onDelete} />
  </div>
))}
```

`key={letter.id}` — React uses this to know which letters to add, remove, or reorder. Without a proper key, animations and updates can break.

---

## `src/components/EmptyState.tsx` — What you see when you have no letters

Just a cute illustration, a message, and a "Create Letter" button that scrolls you to the top of the page (where the creation form is).

---

## `src/components/DeleteModal.tsx` — The "are you sure?" popup

```ts
useEffect(() => {
  const el = dialogRef.current
  if (!el) return
  if (isOpen) {
    el.showModal()
  } else {
    el.close()
  }
}, [isOpen])
```

Uses the native `<dialog>` element. `showModal()` opens it as a modal (blocks interaction with the rest of the page). `close()` hides it.

The `<dialog>` has a `backdrop:` CSS pseudo-element for the dim overlay.

```tsx
<button
  onClick={() => {
    onConfirm()
    onClose()
  }}
>
```

A click calls both `onConfirm` (which deletes the letter) and `onClose` (which hides the modal). The order matters: delete first, then close.

---

## `src/index.css` — Styles

Defines a warm, paper-like theme:

- Background: `#F7F4EF` (warm cream)
- Accent: `#533B3A` (dark brown/burgundy)
- Fonts: Bodoni Moda for headings, Inter for body text
- Keyframe animations: `float`, `pulse-soft`, `slide-in`, `fade-in`, `lift`
- Utility classes: `paper-texture` (subtle radial gradients), `paper-card` (white card with border + shadow)

The `@theme` block is Tailwind v4 syntax for custom design tokens.

---

## Common traps summary

| Trap | Where | Why it's tricky |
|------|-------|-----------------|
| `localStorage` only stores strings | `useLetters.ts:19` | You must `JSON.stringify` before saving and `JSON.parse` after reading |
| `useEffect` runs after every render, not just once | `useLetters.ts:18` | It saves on EVERY letter change — fine for small data, but could be slow for thousands |
| Months are 0-indexed | `LetterCreationPanel.tsx:17,131` | January = 0, December = 11. Always subtract 1 from the user's input |
| `toISOString()` converts to UTC | `LetterCreationPanel.tsx:17` | Midnight local time might be yesterday in UTC. We use noon (12:00) to avoid this |
| Date comparison with `<=` | `LetterCard.tsx:5` | JavaScript auto-converts Dates to numbers — works but can be confusing if you forget |
| All dates are strings, not Date objects | `types.ts:5-6` | They're stored as strings. You must `new Date(...)` them before comparing |
| Event listeners must be cleaned up | `LandingPage.tsx:376-381` | Forgetting `removeEventListener` causes memory leaks and double-firing bugs |
| `ref` vs `state` for drag | `LandingPage.tsx:318-320` | State causes re-renders (bad for 60fps drag). Refs don't. But refs also don't trigger UI updates |
| `setPointerCapture` requires `pointerId` | `LandingPage.tsx:360` | You must pass the same pointerId from `onPointerDown` to `releasePointerCapture` — passing a coordinate by mistake silently fails |
| `useCallback` has a `[]` dependency | `useLetters.ts:22,31` | Without proper deps, the closure might capture stale values. Here it's safe because `setLetters` is stable |
| Resetting day on month/year change | `LetterCreationPanel.tsx:141-142` | Prevents invalid dates like February 31st |
| `crypto.randomUUID()` might not exist in old browsers | `useLetters.ts:25` | Works in all modern browsers, but could crash in very old ones |
