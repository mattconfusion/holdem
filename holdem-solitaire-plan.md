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
- **ALL IN** button bets the maximum allowed in one click.
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
