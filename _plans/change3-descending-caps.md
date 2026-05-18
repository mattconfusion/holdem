# Change 3 — Per-Street Bet Caps (Descending)

### What changes
Maximum bet is capped by street, **descending as information reveals.**
The less you know, the more you are allowed to risk.
The more the board shows, the smaller your maximum commitment.

### Cap Schedule

| Street | Cards Known | Cap |
|--------|------------|-----|
| Pre-Flop | 2 of 7 (hole cards only) | $100 |
| Flop | 5 of 7 | $60 |
| Turn | 6 of 7 | $40 |
| River | 7 of 7 (full information) | $20 |

### Why descending, not ascending

The ascending schedule ($20 → $100) limits late bets in absolute terms but still allows the river to be the largest single commitment. A player can wait for near-certainty and then place the biggest bet of the hand — exactly the exploit the cap is meant to eliminate.

The descending schedule closes this entirely. **By the river, the board is fully known.** Betting big at that point carries no informational risk — it is pure mechanical execution. Capping it at $20 reflects that: the river bet is a final small confirmation, not a payoff mechanism.

### Incentive inversion

| Situation | Ascending cap | Descending cap |
|-----------|--------------|----------------|
| Strong pre-flop hand | Forced to bet small | Can commit fully |
| Flush draw on flop | Medium bet | Still meaningful bet |
| Confirmed straight on river | Bet max — low risk | Capped at $20 — certainty is cheap |
| Bluff on flop | Medium bet | Largest available bluff window |
| Missed draw, river | Walk away for $20 | Walk away for $20 |

### Maximum pot comparison

| Strategy | Max pot (ascending) | Max pot (descending) |
|----------|-------------------|-------------------|
| Bet max every street | $220 + $10 ante | **$220 + $10 ante** |
| Bet max river only | $100 + $10 ante | $20 + $10 ante |
| Bet max pre-flop only | $20 + $10 ante | $100 + $10 ante |
| Bet max pre-flop + flop | $60 + $10 ante | $160 + $10 ante |

Total maximum pot is identical ($220) — the redesign does not reduce ceiling winnings. It only changes *when* money must be committed to reach that ceiling.

### Relationship to Change 3 (early-bet bonus multiplier)

The descending cap and the bonus multiplier are complementary mechanics pointing in the same direction:

- The cap **forces** early commitment by restricting late bets
- The multiplier **rewards** early commitment through enhanced payouts

Together they create a consistent signal: **the right time to be brave is before you know the answer.**

The bonus multiplier applied to the descending cap schedule:

| Street | Cap | Payout weight |
|--------|-----|--------------|
| Pre-Flop | $100 | 1.4× |
| Flop | $60 | 1.2× |
| Turn | $40 | 1.0× |
| River | $20 | 0.8× |

A player who bets $100 pre-flop on a hand that becomes a flush effectively contributes $140 to the payout calculation. A player who bets $20 on the river contributes $16. The read is always: **commit early or leave money on the table.**

### Ante escalation compatibility

The descending cap does not conflict with ante escalation. The ante is a passive forced cost between hands — it governs session-level pressure, not within-hand decision-making. The one constraint remains: **the ante must never exceed the pre-flop cap.** Since the pre-flop cap is now $100, ante escalation has considerably more headroom ($10 → $20 → $30 is comfortably within bounds).

### Chip UI adjustment

Chips above the current street cap are **disabled, not hidden.** The player sees the full chip row at all times — the greyed-out high-value chips on the river are a constant reminder that the window for large bets has closed. A persistent label shows the current cap:

```
Street cap: $60  ·  River cap: $20
```

### Implementation

```javascript
const STREET_CAPS = [100, 60, 40, 20]; // indexed by street 0–3 (pre-flop → river)
const STREET_MULTIPLIERS = [1.4, 1.2, 1.0, 0.8];

function maxBetForStreet(street, bank) {
  return Math.min(STREET_CAPS[street], bank);
}

function weightedPot(bets) {
  // bets: array of { amount, street }
  return bets.reduce((sum, b) => sum + b.amount * STREET_MULTIPLIERS[b.street], 0);
}
```

Payout at showdown uses `weightedPot` instead of raw pot total:

```javascript
const payout = weightedPot(solState.streetBets) * multiplier;
```

The displayed pot during play shows the **raw total** (no weighting visible mid-hand) to avoid cognitive overload. The weighted calculation is applied silently at showdown, with the result shown in the payout breakdown:

```
Raw pot:      $160
Weighted pot: $194  (early bets bonus)
Multiplier:   6×  (Flush)
Payout:       $1,164
```
