# Task Queue

> Single source of truth for what Claude Code should work on.

**Claude Code:** Check this file first. Work top-to-bottom in "Up Next". Move tasks through the pipeline as you go.

---

## 🔨 In Progress

<!-- Currently being built. Only one task at a time. -->

*Empty — ready for next task*

---

## 📋 Up Next

<!-- Prioritized and ready to build. Work these in order. -->

1. **[CLEANUP-OLD-PANTRY.md](tasks/CLEANUP-OLD-PANTRY.md)** — Critical bug fix + remove old pantry
   - 🐛 Fix harvest flow (plants/mushrooms → kitchen.storage)
   - Remove deprecated pantry system
   - Priority: **HIGH** (recipe system non-functional without bug fix)

2. **[IMPROVE-BUILD-VERIFICATION.md](tasks/IMPROVE-BUILD-VERIFICATION.md)** — CI + testing improvements
   - Add test workflow to CI
   - Add vitest to pre-commit
   - Create integration tests for store actions
   - Priority: **MEDIUM** (prevents future bugs)

---

## 🧪 Verification

<!-- Built, waiting for Mark to test. Include what to verify. -->

*Empty*

---

## 💬 Feedback

<!-- Tested, needs changes. Include feedback notes. -->

*Empty*

---

## ✅ Done

<!-- Completed and verified. Keep recent items for reference. -->

- [x] **Kitchen System** (2026-02-27)
  - Recipe-based cooking, variety bonus, staples shop
  - 47 tests passing
  - Note: Had dual-system issue → led to cleanup task

---

## How This Works

### For Planning (Elaine + Mark)
1. Design feature → create `docs/tasks/FEATURE.md`
2. Add to "Up Next" with priority and summary
3. Reference any dependencies

### For Building (Claude Code)
1. Check this file first
2. Take top item from "Up Next"
3. Move to "In Progress"
4. Read the linked task doc thoroughly
5. Build, test locally
6. Move to "Verification" with notes on what to test
7. Commit and push

### For Testing (Mark)
1. Check "Verification" section
2. Test the feature
3. If good → move to "Done"
4. If issues → move to "Feedback" with notes
5. Elaine will update task doc, move back to "Up Next"

---

## Task Doc Template

When creating new tasks, include:

```markdown
# Task Name

> One-line summary

**Priority:** High/Medium/Low
**Effort:** Estimate

## Background
Why this task exists

## Requirements
What needs to be built

## Files to Modify
Specific files and changes

## Testing
How to verify it works

## Notes
Gotchas, dependencies, open questions
```
