# 04 — Cross-Check: Audit Validation

---

## Context

This document records a cross-check review of the security audit in `docs/03-audit.md`. The audit was reviewed by a second AI model, which agreed with the findings.

---

## Audit Summary (from cross-check review)

### Edge Cases Analysis

### 1. localStorage is full
**Status**: Vulnerable
- **Location**: `useLetters.ts:19`
- **Issue**: Write path has no try/catch. When localStorage is full (~5MB), `setItem` throws `QuotaExceededError`, crashing the app. Letters appear to save but are lost on refresh.
- **Severity**: Medium
- **Fix**: Wrap `setItem` in try/catch with user-facing error message

### 2. localStorage is disabled
**Status**: Vulnerable
- **Location**: `useLetters.ts:19`
- **Issue**: Same as above - no try/catch on write. Read path is protected (lines 7-12), but write isn't.
- **Severity**: High for privacy-preserving browsers
- **Fix**: Add try/catch + capability check

### 3. User changes system clock
**Status**: Documented limitation
- **Location**: `LetterCard.tsx:4-6`, `LetterCreationPanel.tsx:119-121`
- **Issue**: App uses `new Date()` (system clock). Clock backward = letters re-lock; clock forward = premature unlock.
- **Severity**: Low (client-only app with no server time source)
- **Fix**: Document as known limitation or fetch authoritative timestamp from NTP API

### 4. Two letters share same unlock minute
**Status**: Correct behavior
- **Location**: `useLetters.ts:25`
- **Issue**: Each letter gets unique UUID via `crypto.randomUUID()`. Same unlock date is valid.
- **Severity**: None
- **Note**: All letters unlock at noon local time (intentional design)

### 5. XSS vulnerabilities
**Status**: Protected
- **Location**: `LetterCard.tsx:97-99`
- **Issue**: React auto-escapes text content in JSX expressions. No `dangerouslySetInnerHTML` used.
- **Severity**: None
- **Recommendation**: Add maxLength constraints (10k chars for content, 100 for recipient) to prevent performance issues

### 6. Principle violations
The audit identifies 8 violations:

- **6a**: Defensive programming gap - read has try/catch, write doesn't (Medium severity)
- **6b**: Missing React hook dependencies in `LandingPage.tsx` (Low)
- **6c**: Stale closure in debounced scroll handler (Low)
- **6d**: Non-reactive ref in scroll hook (Low)
- **6e**: `Math.random()` called during render (Low)
- **6f**: Three parallel scroll listeners (Cosmetic)
- **6g**: Day reset by convention, not enforcement (Low)
- **6h**: No input length limits (Low)

---

## Decision

**Chosen audit**: `docs/03-audit.md` (Audit One)

**Reasoning**: The first audit spotted several low-priority issues with solid reasoning, particularly around defensive programming gaps, React hook dependencies, and stale closures. These issues, while not critical, demonstrate attention to detail and understanding of React best practices. The second review confirmed these findings, validating the thoroughness of the original audit.

---

## Priority Assessment

The most critical issues requiring attention:
1. **localStorage write path crashes** (items 1, 2, 6a) - Medium/High severity
2. **No input length limits** (item 6h) - Low severity but easy fix

Low-priority issues can be addressed incrementally or documented as technical debt.
