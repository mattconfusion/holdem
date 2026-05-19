# Change 4 — Ante Escalation

Forced ante increases every 10 hands regardless of bankroll.
A guaranteed session clock — the player cannot outrun it by playing well.

### Schedule

| Hands Played | Ante |
|-------------|------|
| 0 – 9 | $5 |
| 10 – 19 | $10 |
| 20 – 29 | $15 |
| 30+ | $20 |

Cap at $20 — respects the $100 pre-flop bet ceiling with comfortable headroom.

### UI

A warning line appears on the hand *before* each threshold:

```
Ante increases next hand.
```

Shown on hands 9, 19, 29. Removed after the ante steps up.
Current ante is always visible in the status bar next to the bankroll.

### Implementation

```javascript
function currentAnte(handsPlayed) {
  if (handsPlayed < 10) return 5;
  if (handsPlayed < 20) return 10;
  if (handsPlayed < 30) return 15;
  return 20;
}

function isAnteWarningHand(handsPlayed) {
  return [9, 19, 29].includes(handsPlayed);
}
```

### Notes

- Applies to Solitaire mode only. Heads-Up ante is fixed at $10 per player.
- `handsPlayed` increments at the end of each hand, after result is shown.
- The warning triggers on the *result screen* of hand 9/19/29, not on the next deal — the player reads it while processing their last result, maximising the dread window.
