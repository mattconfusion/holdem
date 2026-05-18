# Hold'em Solitaire — Game Design Plan

> A single-player Texas Hold'em card game played against a pay table.
> No AI opponents. Tension comes from betting decisions across four streets.

---

## 1. Core Concept

The player is dealt a standard Texas Hold'em hand (2 hole cards + 5 community cards revealed in stages). At each stage they choose how much to bet — or fold and cut their losses. At showdown, the total amount wagered is multiplied by a payout factor based on the final hand strength.

**The thrill** lives in the incremental decision: commit more chips as the hand develops, or fold before sinking further into a loser.

---

## 2. Game Loop

```
START HAND
  └─ Deal 2 hole cards
  └─ [Street 1: Pre-Flop] → bet or fold

  └─ Reveal 3 community cards (Flop)
  └─ [Street 2: Flop] → bet or fold

  └─ Reveal 1 community card (Turn)
  └─ [Street 3: Turn] → bet or fold

  └─ Reveal 1 community card (River)
  └─ [Street 4: River] → bet or fold

  └─ SHOWDOWN → evaluate best 5-card hand from 7 cards
  └─ Apply pay table multiplier to total amount wagered
  └─ Update bankroll → START NEXT HAND
```

---

## 3. Betting Mechanics

### Chip Denominations
| Chip | Value |
|------|-------|
| Green | $5 |
| Blue | $10 |
| Orange | $25 |
| Red | $50 |
| Black | $100 |

### Per-Street Rules
- Player selects chips to build a bet, then confirms with **BET** button.
- Minimum bet per street: **$5**.
- Maximum bet per street: **$100** (or current bankroll, whichever is lower).
- **FOLD** is available at any street — all money wagered so far in that hand is lost.
- **ALL IN** button bets the full bank in one click, ignoring caps.
- **CLEAR** resets the current unconfirmed bet.

### Pot Calculation
The pot accumulates across all confirmed street bets within a hand.

```
Total Pot = bet_preflop + bet_flop + bet_turn + bet_river
Payout    = Total Pot × multiplier (from pay table)
Net gain  = Payout − Total Pot
```

> Example: Bet $25 pre-flop, $25 flop, $50 turn, $50 river = $150 pot.
> Hit a flush (6×) → payout $900 → net gain $750.

---

## 4. Pay Table

| Hand | Multiplier | Notes |
|------|-----------|-------|
| High Card | 0× | Lose the pot |
| One Pair | 1× | Break even |
| Two Pair | 2× | Small profit |
| Three of a Kind | 3× | Solid return |
| Straight | 5× | |
| Flush | 6× | |
| Full House | 9× | |
| Four of a Kind | 25× | |
| Straight Flush | 50× | |
| Royal Flush | 100× | |

> **Design note:** One Pair returns 1× (break even) to make pair-chasing a neutral-EV play, keeping the game mathematically honest without being punishing.

---

## 5. Hand Evaluation

Use standard Texas Hold'em rules: best 5-card hand from 7 cards (2 hole + 5 community).

### Detection order (highest to lowest):
1. Royal Flush
2. Straight Flush
3. Four of a Kind
4. Full House
5. Flush
6. Straight
7. Three of a Kind
8. Two Pair
9. One Pair
10. High Card

### Implementation approach:
- Represent cards as objects: `{ rank: 'A', suit: 'h', value: 14 }`
- Generate all C(7,5) = 21 possible 5-card combinations
- Score each combination, return the highest

---

## 6. Bankroll & Session

- **Starting bankroll:** $500
- **Game over:** bankroll reaches $0
- **Win condition:** none — the game loops indefinitely (solitaire style)
- **Session stats tracked:** hands played, hands won, biggest win, current streak

---

## 7. UI Structure

```
┌─────────────────────────────────────┐
│  HOLD'EM SOLITAIRE        Bank: $—  │
│  Pay Table (compact, always visible) │
├─────────────────────────────────────┤
│                                     │
│  [ Hole Card 1 ] [ Hole Card 2 ]    │  ← always visible after deal
│                                     │
│  ─────── Community Cards ───────    │
│  [ C1 ] [ C2 ] [ C3 ] [ C4 ] [ C5 ]│  ← revealed progressively
│                                     │
├─────────────────────────────────────┤
│  Street indicator: ● ○ ○ ○          │
│  Pot: $—   Current bet: $—          │
│                                     │
│  [  5 ] [ 10 ] [ 25 ] [ 50 ] [100 ]│  ← chip buttons
│                                     │
│  [CLEAR]  [FOLD]  [BET / DEAL]      │
│                                     │
│  Result banner (win/fold/hand name) │
└─────────────────────────────────────┘
```

### Visual design direction
- Dark casino felt green background with gold trim
- Windows Solitaire-style snappy card flip animations
- Card flip uses CSS `rotateY` transform on reveal
- Winning cards glow gold at showdown
- Chip buttons styled as physical casino chips (circular, colored)
- Pay table row for current hand highlights at showdown

---

## 8. Game States

| State | Description |
|-------|-------------|
| `idle` | No hand in progress. DEAL button visible. |
| `pre-flop` | 2 hole cards dealt. Bet or fold. |
| `flop` | 3 community cards revealed. Bet or fold. |
| `turn` | 4th community card revealed. Bet or fold. |
| `river` | 5th community card revealed. Final bet or fold. |
| `showdown` | All cards revealed. Hand evaluated. Result displayed. |
| `game-over` | Bankroll = $0. Show session stats, offer restart. |

---

## 9. Tension Design Notes

These design choices create "one more hand" tension without AI opponents:

- **Sunk cost psychology** — each confirmed street bet makes folding feel like a loss, pushing the player to continue.
- **Partial information** — the player never knows what's coming next, mirroring real poker uncertainty.
- **Escalating commitment** — later streets naturally feel higher-stakes because more money is already in the pot.
- **Streak tracking** — visible win/loss streak adds meta-tension beyond the individual hand.
- **Pay table visibility** — always-on pay table means the player is constantly calculating expected value.
- **Fold discipline** — the game subtly rewards knowing when to cut losses, a real poker skill.

---

## 10. Technical Stack

- **Single HTML file** — no build tools, no dependencies, no server
- **Vanilla JS** — card deck, shuffle, hand evaluation, state machine
- **CSS animations** — card flips, chip bounce, result banner entrance
- **No localStorage required** — session resets on page reload (solitaire-style)
- **Mobile-friendly** — responsive layout, large chip tap targets

---

## 11. Build Phases

### Phase 1 — Core engine
- [ ] Deck creation and shuffle
- [ ] Card dealing logic
- [ ] Hand evaluator (all 21 combinations of 7 cards)
- [ ] Pay table lookup

### Phase 2 — Game loop
- [ ] State machine (idle → pre-flop → flop → turn → river → showdown)
- [ ] Betting logic (chip selection, pot accumulation, fold)
- [ ] Bankroll management
- [ ] Game over detection

### Phase 3 — UI
- [ ] Card rendering (rank + suit, red/black)
- [ ] Card back and flip animation
- [ ] Chip buttons
- [ ] Pay table panel with active hand highlight
- [ ] Result banner
- [ ] Street indicator pips
- [ ] Game over overlay with session stats

### Phase 4 — Polish
- [ ] Winner card glow
- [ ] Chip click sound (optional, Web Audio API — a single tick)
- [ ] Deal shuffle animation
- [ ] Streak display
- [ ] Responsive / mobile layout

---

## 12. Open Questions

- **Ante system?** — A forced minimum pre-flop bet ($5 ante) would prevent zero-risk "peek at flop" play. Recommended: yes.
- **Pair threshold?** — Should One Pair pay 1× (break even) or 0× (lose)? Break even keeps casual players happier.
- **Sound?** — Optional Web Audio tick/chip sound on bet confirmation. Low effort, high feel.
- **Stats persistence?** — LocalStorage for all-time best session? Out of scope for v1.

---

# Hold'em Solitaire — Tension Redesign Plan

> Add-on to `holdem-solitaire-plan.md`.
> Addresses the "safe pair" exploit by restructuring the pay table,
> minimum hand threshold, and per-street bet caps.
> Three changes only. Surgical, high-impact.

---

## The Problem

In the current build, **One Pair pays 1× (break even)**. This means:

- Any pair on the flop → bet $100 every remaining street with zero expected loss
- The player is never punished for optimistic betting
- Fold decisions become trivial: you only fold a complete blank
- The pay table is legible enough that EV math removes all tension

The fix targets exactly this: **uncertainty must have a cost.**

---

## Change 1 — Pairs Lose

### What changes
One Pair is removed from the pay table entirely.
It no longer breaks even. It returns **0×** — the pot is lost.

### New Pay Table

| Hand | Old Multiplier | New Multiplier | Δ |
|------|---------------|----------------|---|
| High Card | 0× | 0× | — |
| One Pair | 1× | **0×** | ↓ |
| Two Pair | 2× | 2× | — |
| Three of a Kind | 3× | 3× | — |
| Straight | 5× | 5× | — |
| Flush | 6× | 6× | — |
| Full House | 9× | 9× | — |
| Four of a Kind | 25× | 25× | — |
| Straight Flush | 50× | 50× | — |
| Royal Flush | 100× | 100× | — |

### Why this works

**One Pair is the most common made hand in Texas Hold'em** — it occurs roughly 42% of the time with 7 cards. Making it a losing hand means the player is chasing a winning outcome *less than half the time*, which is the correct risk profile for a gambling game with real tension. It also makes Two Pair feel like a genuine relief rather than a small upgrade.

### UI change
The One Pair row in the pay table is displayed with a loss indicator (e.g. greyed out, or explicitly marked **0×**) so the player always has it in view as a warning.

---

## Change 2 — Two Pair Is the New Floor

### What changes
**Two Pair (2×) becomes the minimum paying hand.**
Everything below it — High Card and One Pair — pays nothing and loses the pot.

### Tension mechanics this creates

| Situation | Old behaviour | New behaviour |
|-----------|--------------|---------------|
| Pair on flop | Safe to bet heavy, guaranteed break-even | Dangerous — must improve or lose everything |
| Two overcards, no pair | Fold or gamble | Fold or gamble (unchanged, but now pair is not the rescue) |
| Pair + flush draw | Comfortable, bet max | Real dilemma: flush draw is worth chasing, pair alone is not |
| Flopped Two Pair | Already winning | Same, but now feels like the safety net it should be |
| Turn completes a straight | Windfall | Same, but the journey was riskier |

### Probability context (7-card hand frequencies)

| Hand | Probability | Notes |
|------|------------|-------|
| High Card | ~17.4% | Rare with 7 cards |
| One Pair | ~43.8% | Most common outcome |
| Two Pair | ~23.5% | New minimum paying hand |
| Three of a Kind | ~4.8% | |
| Straight | ~4.6% | |
| Flush | ~3.0% | |
| Full House | ~2.6% | |
| Four of a Kind | ~0.17% | |
| Straight Flush | ~0.03% | |
| Royal Flush | ~0.003% | |

With Changes 1 and 2 combined, the player loses the pot approximately **61% of the time** (High Card + One Pair). This is deliberately uncomfortable — it transforms the game from "collect small wins" into "survive long enough to hit something real." The $500 starting bankroll and ante structure are calibrated to sustain roughly 20–30 hands before bust at average play, creating the solitaire session arc.

---

## Change 3 — Per-Street Bet Caps

### What changes
Maximum bet is no longer a flat $100 per street. It is **capped by street**, ascending as information reveals.

### Cap Schedule

| Street | Cap | Rationale |
|--------|-----|-----------|
| Pre-Flop | $20 | Minimum information — 2 hole cards only |
| Flop | $40 | 5 of 7 cards known |
| Turn | $60 | 6 of 7 cards known |
| River | $100 | Full information — maximum commitment allowed |

### Why this works

The current exploit is **backloaded betting**: wait until the river confirms a strong hand, then bet the maximum with near-certainty. The cap schedule inverts the incentive structure:

- **To win big, you must commit early** — when you know less
- **River bets are still the largest**, but the total pot is limited unless the player was brave on earlier streets
- **A player who bets $20/$40/$60/$100 on a flush** wins more than one who bets $5/$5/$5/$100 on the same flush
- **Folding mid-hand is more costly**, because you've already been forced to commit more than under the flat-cap system

### Maximum pot comparison

| Strategy | Old max pot | New max pot |
|----------|------------|------------|
| Bet max every street | $400 + $10 ante | **$220 + $10 ante** |
| Bet max river only | $100 + $10 ante | $100 + $10 ante |
| Bet max pre-flop + river | $200 + $10 ante | $120 + $10 ante |

The reduction in maximum pot is intentional. With the new pay table loss rate (~61%), a $400 max pot would too rapidly drain the bankroll. The cap schedule creates sustainable sessions while maintaining per-hand tension.

### Chip UI adjustment
Chips above the current street cap are **disabled automatically** — not hidden. The player can see what they cannot yet use, which telegraphs that larger bets are coming and builds anticipation.

---

## Combined Effect — Decision Map

The three changes together restructure every major decision point:

### Pre-Flop (cap $20)
- **Strong hole cards (A-K, pocket pair):** bet max $20 — you're hoping to hit, and the cap limits the risk
- **Weak hole cards:** fold for free (ante already paid) or gamble $5–$20
- **The read:** pre-flop becomes more meaningful because the ante + pre-flop bet is now the "exploration cost"

### Flop (cap $40)
- **Made Two Pair or better:** bet confidently — you're in paying territory
- **One Pair:** the crisis point — do you chase Two Pair on turn/river, or fold and lose the ante + pre-flop bet only?
- **Flush/straight draw:** pure gamble — bet $40 hoping the turn delivers
- **Complete blank:** fold. The ante and pre-flop bet are gone, but you've limited damage.

### Turn (cap $60)
- **Strong hand:** escalate — $60 goes in, pot is building toward a real payout
- **Still on a draw:** last chance to commit before the river — the cap forces the decision now, not later
- **Missed draw:** fold and take the loss on ante + flop + pre-flop, or make a desperate $60 river gamble

### River (cap $100)
- **Made hand:** bet max — this is where commitment is rewarded
- **Still One Pair:** lose the pot regardless of river bet — fold is always correct
- **Missed everything:** fold. Every chip bet here is pure donation.

---

## Implementation Notes

### Pay table rendering
```
0: 'High Card'     → 0× (grey, strikethrough style)
1: 'One Pair'      → 0× (grey, strikethrough style)
2: 'Two Pair'      → 2× (first green/gold row)
3–9: unchanged
```

Mark the Two Pair row with a subtle dividing line above it — visually communicating "above this line = winning."

### Bet cap enforcement
```javascript
const STREET_CAPS = [20, 40, 60, 100]; // indexed by street 0–3

function maxBetForStreet(street, bank) {
  return Math.min(STREET_CAPS[street], bank);
}
```

Chips that would exceed the cap are `disabled` (not hidden).
The cap display ("Max $40 this street") is shown persistently near the chip row.

### Ante unchanged
$10 forced ante on deal. This is not affected by the redesign.

### Bankroll calibration
Starting bankroll remains **$500**. With a ~61% loss rate and average pot of ~$110:
- Expected loss per hand ≈ $67 × 0.61 − $43 × 0.39 ≈ $24 net loss per hand
- Expected session length ≈ 20 hands before bust at break-even play
- A skilled session (good folding discipline) extends to 30–40 hands

This matches the solitaire session arc: long enough to feel like an achievement, short enough that each hand matters.

---

## What Is Not Changed

- Hand evaluator: unchanged
- Heads-Up mode: entirely unaffected
- Community card reveal sequence: unchanged
- Ante: unchanged ($10)
- Starting bankroll: unchanged ($500)
- Pay table multipliers for Two Pair and above: unchanged
- Fold mechanic: unchanged

---

## Open Questions

- **Visual treatment of losing rows:** strikethrough, greyed text, or a small ✗ icon next to 0× hands? Recommendation: grey text + `0×` explicit label, no strikethrough (cleaner at small font sizes).
- **Cap display:** show the cap as a persistent label ("Bet up to $40") or only as disabled chips? Recommendation: both — label + disabled chips reinforce each other.
- **Ante increase over time?** Out of scope for this plan but noted as a future escalation lever (Change 4 from the ideation session).

