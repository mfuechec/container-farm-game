# Side Hustle Simulator — Planning Workflow

> How we design features: Mark + Elaine collaborate, Claude Code implements.

---

## Roles

**Mark** — Creative direction, final decisions, playtesting
**Elaine** — Design partner, pushback, documentation, feedback synthesis
**Claude Code** — Implementation, technical execution

---

## Workflow

### 1. Design Spec (Mark + Elaine)

**Goal:** Define *what* we're building and *why*.

**Process:**
- Start with the player experience: "The player should feel X when Y"
- Elaine asks questions, challenges assumptions, pokes holes
- Back-and-forth until the design is tight
- Document in a feature spec or update GAME_DESIGN.md

**Elaine's job:**
- Ask "why does this matter to the player?"
- Identify edge cases and conflicts with existing systems
- Push back on scope creep
- Offer alternatives
- Advocate for simplicity

**Output:** Feature spec with clear experience goals

### 2. Balance Proposal (Mark + Elaine)

**Goal:** Define the *numbers* — initial values and feel targets.

**Process:**
- Set initial values based on design intent
- Document reasoning ("Week 1 should feel tight because...")
- Identify balance red flags to watch for
- Update BALANCE.md

**Output:** Balance values in balance.ts with documented rationale

### 3. Implementation (Claude Code)

**Goal:** Build exactly what's specced.

**Input:** Feature spec + balance values + handoff doc
**Output:** Working code, tests, Storybook stories

**Handoff doc must include:**
- Summary of what to build
- Architecture decisions
- **Existing systems affected** (see below)
- Files to create/modify
- Testing priorities

#### Existing Systems Checklist

Before handing off, answer these:

| Question | Answer |
|----------|--------|
| What existing code does this touch? | List files/systems |
| Replace, extend, or run alongside? | Be explicit |
| What gets deprecated/removed? | List it |
| Entry points that need rewiring? | e.g., "tick() should call X instead of Y" |
| Migration for existing saves? | If state shape changes |

**Why this matters:** Without this, Claude Code will (reasonably) add new code alongside old code, creating parallel systems. Be explicit about what goes away.

### 4. Playtest (Mark)

**Goal:** Verify it *feels* right, not just works right.

**Process:**
- Play the feature
- Note what feels off, surprising, or wrong
- Report back to Elaine

### 5. Feedback Synthesis (Elaine)

**Goal:** Turn playtest notes into actionable changes.

**Process:**
- Log feedback
- Identify patterns across sessions
- Propose design or balance changes
- Update docs
- Queue changes for Claude Code

---

## Principles

1. **Friction is good.** Pushback makes designs better.
2. **Player-first.** Every feature should answer "why does the player care?"
3. **Simple > clever.** The best design is the one you don't notice.
4. **Document the why.** Future us will forget the reasoning.
5. **Iterate fast.** Ship, test, learn, adjust.

---

## Feedback Log

Track playtest feedback here (or in separate feature docs):

| Date | Feature | Feedback | Resolution |
|------|---------|----------|------------|
| 2026-02-27 | Kitchen System | Dual pantry systems created (old + new) due to missing "existing systems" section in handoff | Added checklist to planning workflow; cleanup task created |

---

## Open Design Questions

Parking lot for unresolved design decisions:

- After quitting the job — what's the endgame?
- Social elements — NPCs? Trading?
- Seasons/events?
- Light narrative vs pure sandbox?
