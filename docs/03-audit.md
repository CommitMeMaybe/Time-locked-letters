# 03 — Audit: Edge Cases, XSS, and Principle Violations

---

## 1. localStorage is full

**File**: `useLetters.ts:19`

```ts
useEffect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(letters))
}, [letters])
```

**What happens**: When localStorage is full (usually ~5 MB), `setItem` throws a `QuotaExceededError`. There is no try/catch here, so the error propagates through React's commit phase. The effect crashes, React logs the error to console, and the UI may enter a broken state where new letters appear in the list but aren't persisted. On refresh they're gone.

**`loadLetters` has a try/catch (`useLetters.ts:7-12`), but the write path does not.**

**Severity**: Medium. The app appears to save successfully but silently loses data on refresh.

**Fix**: Wrap `setItem` in a try/catch. On catch, surface a user-facing message ("Storage full — delete old letters") or fall back to in-memory-only with a warning.

---

## 2. localStorage is disabled / unavailable

**Scenario**: Some browsers block localStorage entirely (e.g., private mode with strict settings, or `localStorage === null` in some embedded webviews).

**Read path** (`useLetters.ts:7-12`):

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

The try/catch catches the error and returns `[]`. The app boots with zero letters. Safe.

**Write path** (`useLetters.ts:18-20`):

```ts
useEffect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(letters))
}, [letters])
```

No try/catch. If `setItem` throws, the error bubbles up. In React 19, a throwing effect may trigger the error boundary or crash the UI tree.

**Net effect**: You can add letters and interact normally until a re-render triggers the effect, at which point the app crashes. You lose your work.

**Severity**: High for users in privacy-preserving browsers. Low for mainstream browsers (Chrome/Firefox/Safari all support localStorage in normal mode).

**Fix**: Add try/catch around `setItem`. Consider a guard at the top of `useLetters` or a capability check during initialization.

---

## 3. User changes their system clock

**Impact on `isUnlocked`** (`LetterCard.tsx:4-6`):

```ts
function isUnlocked(unlockDate: string): boolean {
  return new Date(unlockDate) <= new Date()
}
```

`new Date()` reads the **system clock**, not a server clock. If the user sets their clock backward:

- Unlocked letters become locked again. The content disappears behind the "Content locked until unlock date" placeholder.
- Countdown text shows a positive remaining time again.

If the user sets their clock forward:

- Letters unlock prematurely. Content is visible before the intended date.

**Impact on date validation** (`LetterCreationPanel.tsx:119-121`):

```ts
const selected = new Date(yNum, mNum - 1, dNum)
const today = new Date()
today.setHours(0, 0, 0, 0)

if (selected <= today) {
  setError('Unlock date must be in the future.')
  return
}
```

If the clock is set backward, "today" appears to be in the past. You can "unlock" letters dated years ago by simply winding your clock. If the clock is set forward, you can't create new letters at all — every future date looks like the past.

**Severity**: Low. This is a client-only application with no server. There is no authoritative time source. The canonical mitigation (use a server timestamp) doesn't apply here. Documenting the behavior is probably sufficient.

**Fix (partial)**: At startup, fetch an authoritative timestamp from a public NTP API or a timestamp HTTP header. Compare it against `new Date()` and warn the user if the discrepancy exceeds a threshold (e.g., 5 minutes). But this adds network dependency — a tradeoff.

**Document as a known limitation**: "Time Locked Letters uses your device's clock. Changing the system clock may cause letters to unlock early or late."

---

## 4. Two letters share the same unlock minute

**`id` field** (`useLetters.ts:25`):

```ts
id: crypto.randomUUID(),
```

Every letter gets a unique UUID. No collision possible here.

**`unlockDate` field** (`LetterCreationPanel.tsx:131` + `useLetters.ts:26`):

```ts
unlockDate: toISO(mNum, dNum, yNum),
createdAt: new Date().toISOString(),
```

If two letters are created with the same date, they get the same `unlockDate` string. `isUnlocked` returns the same boolean for both. `getCountdown` returns the same countdown string. The feed shows both side by side with identical status.

**The result is correct behavior** — two distinct letters, both unlocking at the same time, displayed independently.

**Severity**: None.

**Edge worth noting**: The `toISO` function pins the time to noon local (`12, 0, 0`). Every letter unlocks at exactly noon local time on its chosen date, not the moment you selected it. This is intentional (the noon trick) but means two letters for the same date unlock at the exact same moment, not at the user's chosen time of day.

---

## 5. XSS (Cross-Site Scripting)

**Content rendering** (`LetterCard.tsx:97-99`):

```tsx
{unlocked ? (
  <div className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap animate-fade-in">
    {letter.content}
  </div>
) : (
  // ...
)}
```

React's JSX expression `{letter.content}` uses `document.createTextNode` internally — it **does not** interpret HTML. Even if `letter.content` contains `<script>alert('xss')</script>`, React renders it as literal text, not as an executable script.

**Recipient rendering** (`LetterCard.tsx:41`):

```tsx
<h3 className="font-heading text-lg text-accent truncate">{letter.recipient}</h3>
```

Same protection — `{letter.recipient}` is text content, not innerHTML.

**No `dangerouslySetInnerHTML`** is used anywhere in the codebase. Confirmed via grep.

**Validation** (`LetterCreationPanel.tsx:111`):

```ts
if (!recipient.trim() || !content.trim() || !month || !day || !year) {
  setError('All fields are required.')
  return
}
```

Only checks for non-empty input. No sanitization is needed since React escapes at render time. But there is no length limit — a user could write 100,000 characters, causing performance issues on the LetterCard.

**Verdict**: XSS is effectively prevented by React's default text-escaping behavior.

**Remaining concern**: The countdown text (`getCountdown` in `LetterCard.tsx:8-21`) and formatted dates (`format(new Date(...), ...)`) are always derived from structured data, never from raw user input. Safe.

**Fix**: Add a max-length constraint on `content` (e.g., 10,000 characters) and `recipient` (e.g., 100 characters) to prevent accidental performance degradation from very long strings.

---

## 6. Principle Violations

### 6a. Defensive Programming — Write path unprotected

**File**: `useLetters.ts:18-20`

```ts
useEffect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(letters))
}, [letters])
```

The read path (`loadLetters`, line 7-12) has a try/catch. The write path does not. This is inconsistent. The defensive programming principle is applied to one direction but not the other.

**Severity**: Medium. A full localStorage or a disabled localStorage crashes the app on any letter change.

**Fix**: Wrap in try/catch. Consider logging or showing an error state.

---

### 6b. Missing React Hook Dependencies

**File**: `LandingPage.tsx:55-69`

```ts
useEffect(() => {
  const el = ref.current
  if (!el) return
  const path = BIRD_PATHS[pathIdx]
  const anim = animate(el, {
    keyframes: path.map(p => ({ ... })),
    duration,
    ease: 'easeInOutSine',
    loop: true,
    delay,
  })
  return () => { anim.pause() }
}, [])
```

Uses `pathIdx`, `duration`, and `delay` from the closure but lists an empty dependency array `[]`. ESLint's `react-hooks/exhaustive-deps` rule would flag this. If `LandingPage` re-renders and these props change, the animation will still use the original values.

In this specific case the props are constants (`pathIdx={0}`, `duration={18000}`, etc.), so the bug never manifests. But the pattern is fragile — future changes that pass dynamic values would silently break.

**Severity**: Low (latent, not active).

**Fix**: Either add the deps `[pathIdx, duration, delay]` with a cleanup, or add a code comment explaining why they're intentionally excluded.

---

### 6c. Stale Closure in Debounced Scroll Handler

**File**: `LetterCreationPanel.tsx:42-51`

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

The `setTimeout` callback captures `value` from the closure at the time the timer is **created**, not at the time it **fires**. If `value` changes externally during the 80ms debounce window, the comparison `opt.value !== value` compares against the stale value.

In practice this causes no observable bug because:
- If the user scrolls to a new value, `onChange` fires and React updates `value`
- The stale check `opt.value !== value` might compare against the old value and fire `onChange` again with the same value
- Setting state to its current value is a no-op in React

But it's a correctness smell. A truly correct implementation would use a ref for the current value.

**Severity**: Low (no observable bug).

**Fix**: Track `value` in a ref that's kept in sync, and read from the ref inside the timeout.

---

### 6d. Inconsistent Ref Tracking in `useScrollProgress`

**File**: `LandingPage.tsx:4-24`

```ts
function useScrollProgress(ref: React.RefObject<HTMLDivElement | null>): number {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // ... adds scroll listener
    return () => window.removeEventListener('scroll', handleScroll)
  }, [ref])
```

The effect depends on `[ref]` — but a `RefObject` from `useRef` has a **stable identity**. It never changes. So the effect runs exactly once on mount.

This is correct in the current code because all refs point to always-rendered elements. But if `ref.current` were null on the first render (e.g., conditional rendering), the effect would early-return and never re-run when the element appears later. The scroll listener would be permanently missing.

**This is a known React pattern**: refs are not reactive. The effect cannot "watch" `ref.current` for changes.

**Severity**: Low (works correctly in current usage). Medium (fragile under future refactoring).

**Fix**: Use a callback ref pattern instead, or add a guard that re-checks `ref.current` periodically via a `ResizeObserver`. But the simplest approach for this use case is to accept the limitation as long as the ref element is always present.

---

### 6e. `Math.random()` in Render

**File**: `LandingPage.tsx:100-121`

```ts
{FloatingParticles()}
// ...
left: `${10 + Math.random() * 80}%`,
top: `${10 + Math.random() * 80}%`,
animationDelay: `${i * 1.5}s`,
animationDuration: `${6 + Math.random() * 4}s`,
fontSize: `${12 + Math.random() * 16}px`,
```

`Math.random()` is called during render. Every re-render produces different positions, durations, and font sizes. For decorative particles this is harmless, but it violates the principle of **deterministic rendering** — the output is unpredictable and can't be server-rendered consistently. It also means snapshot tests would fail on every run.

**Severity**: Low (decorative only).

**Fix**: If deterministic rendering is needed, generate random values once (e.g., using `useMemo` with `[]` deps or lifting to a module-level constant).

---

### 6f. `useScrollProgress` Creates Multiple Scroll Listeners

**File**: `LandingPage.tsx`

The `LandingPage` component calls `useScrollProgress` **three times**:

```ts
const pinnedProgress = useScrollProgress(pinnedRef)   // line 620
const countdownProgress = useScrollProgress(countdownRef) // line 622
const morphProgress = useScrollProgress(morphRef)     // line 624
```

Each call adds its own `scroll` event listener to `window`. Three scroll listeners all fire on every scroll event, each doing `getBoundingClientRect()` and `setState`.

This is wasteful. A single scroll listener could iterate through a registry of refs. But:

- `getBoundingClientRect()` is fast (a few microseconds)
- Three `setState` calls are batched by React in concurrent mode
- The impact is negligible

**Violation**: Not a strict violation, but a missed optimization opportunity. The **Don't Repeat Yourself** principle is mildly bent.

**Severity**: Cosmetic.

**Fix**: Create a single `useScrollProgress` under the hood that registers multiple refs, or extract the listener to the parent and pass progress down.

---

### 6g. `LetterCreationPanel` Derived State Resets

**File**: `LetterCreationPanel.tsx:87-90`

```ts
const m = Number(month)
const y = Number(year)
const maxDay = month && year ? daysInMonth(m, y) : 31
const days = useMemo(() => Array.from({ length: maxDay }, (_, i) => i + 1), [maxDay])
```

When `month` or `year` changes, `maxDay` changes → `days` changes → `dayOptions` changes (via `useMemo`). But `day` might still hold a value like `"31"` while the new month only has 30 days.

The fix is at `LetterCreationPanel.tsx:141-142`:

```ts
const handleMonthChange = (v: string) => { setMonth(v); setDay('') }
const handleYearChange = (v: string) => { setYear(v); setDay('') }
```

Day is reset to `''` explicitly whenever month or year changes. This is correct but fragile — if a new code path changes month or year without going through these handlers (e.g., a "Next month" button), the day could get stuck on an invalid value.

**Severity**: Low (correct by convention, not by enforcement).

**Fix**: Use a `useEffect` that resets day when `maxDay` changes and the current day exceeds it. This would be defensive against any code path.

---

### 6h. No Length Limits on User Input

**File**: `LetterCreationPanel.tsx:154-161` (input) and `169-176` (textarea)

The `content` textarea has no `maxLength` attribute. The `recipient` input has no `maxLength` attribute. A user could paste megabytes of text into either field.

**Impact**:

- `charCount` (`LetterCreationPanel.tsx:105`) shows the length — but with no formatting, a very long string wraps the UI.
- `whitespace-pre-wrap` in `LetterCard.tsx:97` preserves all whitespace, including long unwrappable strings that could break layout.
- `JSON.parse`/`JSON.stringify` of very large strings could be slow.
- localStorage quota (5 MB total) could be consumed by a single letter.

**Severity**: Low (denial-of-self-service, not an actual vulnerability).

**Fix**: Add `maxLength={10000}` to the textarea and `maxLength={100}` to the recipient input. Show the character limit to the user.

---

## Summary Table

| # | Issue | File | Severity | Fix |
|---|-------|------|----------|-----|
| 1 | localStorage full → crash on write | `useLetters.ts:19` | Medium | try/catch on `setItem` |
| 2 | localStorage disabled → crash on write | `useLetters.ts:19` | High | try/catch + capability check |
| 3 | System clock change unlocks/locks letters | `LetterCard.tsx:4-6` | Low | Document as known limitation |
| 4 | Same unlock minute → correct behavior | multiple | None | — |
| 5 | XSS via letter content | `LetterCard.tsx:97-99` | None | React auto-escapes text content |
| 6a | Defensive programming gap (read vs write) | `useLetters.ts:7-13 vs 18-20` | Medium | Wrap write in try/catch |
| 6b | Missing hook dependencies | `LandingPage.tsx:69` | Low | Add deps or documented exclusion |
| 6c | Stale closure in debounce | `LetterCreationPanel.tsx:42-51` | Low | Use ref for current value |
| 6d | Non-reactive ref in scroll hook | `LandingPage.tsx:4-24` | Low | Use callback ref or accept limitation |
| 6e | `Math.random()` in render | `LandingPage.tsx:108-114` | Low | Memoize random values if needed |
| 6f | Three parallel scroll listeners | `LandingPage.tsx:620-624` | Cosmetic | Single listener with registry |
| 6g | Day reset by convention, not enforcement | `LetterCreationPanel.tsx:141-142` | Low | `useEffect` guard on `maxDay` |
| 6h | No input length limits | `LetterCreationPanel.tsx:154-176` | Low | Add `maxLength` attributes |
