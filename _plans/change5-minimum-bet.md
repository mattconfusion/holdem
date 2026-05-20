# Change 5 — Minimum Bet Scales With Street

Minimum bet increases as streets progress. By the river, min and max converge — the bet is fixed.

### Schedule

| Street | Min Bet | Max Bet |
|--------|---------|---------|
| Pre-Flop | $5 | $100 |
| Flop | $10 | $60 |
| Turn | $15 | $40 |
| River | $20 | $20 |

The river is a mandatory fixed bet of $20. No chip selection needed — a single confirm button suffices.

### UI

- Chips below the street minimum are disabled alongside chips above the cap.
- A persistent label shows both bounds: `Bet $10 – $60`
- On the river the chip row is hidden entirely, replaced by: `River bet: $20 — confirm or fold.`

### Implementation

```javascript
const STREET_CAPS = [100, 60, 40, 20];
const STREET_MINS = [5, 10, 15, 20];

function validBet(amount, street) {
  return amount >= STREET_MINS[street] && amount <= STREET_CAPS[street];
}
```

### Notes

- Fold remains available at every street — the minimum only applies if the player chooses to bet.
- The fixed river bet eliminates chip selection on the final street, slightly speeding up the end of each hand.
- Applies to Solitaire only. Heads-Up minimum bet is unchanged.
