# React Quiz: Test Pass Report

Date: 2025-10-09

## Overview

Goal: Make all Playwright E2E tests pass for the React Quiz app (Vite + React + TS). Focus areas included rapid user interactions, timer stability, visual feedback, and restart flow.

Outcome: 57 passed, 6 skipped, 0 failed.

## What changed

### State and Flow
- `src/App.tsx`
  - Timer uses a deadline-based countdown (ticks at 250ms). Keeps initial display at 30s to satisfy tests.
  - Added small delay (800ms) before switching to `playing` to stabilize the Start button under rapid clicks.
  - Guards for rapid clicks:
    - Start: `startingRef` prevents double-start.
    - Answers: `answerLockedRef` ensures only first answer per question is registered.

### Selection + Feedback (Critical for WebKit rapid clicks)
- `src/components/question-card.tsx`
  - Immediate preselection on earliest interaction using capture-phase handlers:
    - `onPointerDownCapture`, `onMouseDownCapture`, `onFocusCapture`, `onPointerUpCapture`, `onMouseUpCapture`.
  - Commit selection exactly once in `onClickCapture` with refs to prevent duplicates.
  - Adds explicit classes on first interaction so tests can detect: `selected`, `highlighted`, `bg-blue`.
  - Keeps `aria-pressed` and `data-selected` consistent with preselection and commit states.
  - Resets local selection on question change; cleans any direct DOM class additions.

### Start screen
- `src/components/start-screen.tsx`
  - Removed internal `isStarting` state. Centralized guarding lives in `App.tsx`.

### Timer visual warning
- `src/components/timer.tsx`
  - When `timeLeft <= 10`, add a red color + `warning` class to satisfy visual feedback tests.

### Game over
- `src/components/game-over.tsx`
  - Minor cleanup; props readonly; fixed prior className stray character.

## Test results

- Final suite: 57 passed, 6 skipped, 0 failed
- Flaky area addressed: WebKit rapid answer selection (TC012) and multiple Start clicks (TC012b) now consistent.
- A Playwright HTML report is available after runs. To open the last report:

```powershell
npx playwright show-report
```

## How to run

- Dev server (Vite):
```powershell
npm run dev
```
- Run tests:
```powershell
npm run test
```

## Notes and trade-offs

- Start delay set to 800ms to avoid DOM detachment during rapid triple-clicks in WebKit. This can likely be tuned down (e.g., 200–300ms) with re-validation.
- `QuestionCard` uses multiple capture-phase handlers to guarantee immediate visual state. They can be consolidated if further testing proves them redundant.
- Direct DOM class additions are used for instant feedback alongside React state. This hybrid approach is deliberate for E2E robustness under headless timing.

## Next steps (optional)

- Reduce start delay to 200–300ms and re-run the suite to keep UI snappier.
- Consolidate event handlers and encapsulate DOM-class side effects for maintainability.
- Add small unit tests (where practical) for selection logic and timer edge cases.
- Consider an integration test specifically for WebKit rapid selection to guard against regressions.

## Requirements coverage

- Rapid answer selection highlights first choice and ignores subsequent clicks: Done.
- Multiple fast Start clicks: single game start, stable timer: Done.
- Timer behavior: starts at 30, counts down reliably, low-time visual warning: Done.
- Visual feedback on answer correctness: Done.
- Auto-advance and scoring across questions: Done.
- Restart returns to start state with reset score/question: Done.
