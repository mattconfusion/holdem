/**
 * Hold'em Solitaire - UI Controller
 * Handles DOM, Events, and State-to-UI mapping
 */

// ─── DOM References ──────────────────────────────────────────────
const $ = id => document.getElementById(id);
const bankrollEl = $('bankroll');
const potValueEl = $('pot-value');
const currentBetEl = $('current-bet');
const holeCardsEl = $('hole-cards');
const communityCardsEl = $('community-cards');
const resultBannerEl = $('result-banner');
const streakDisplayEl = $('streak-display');
const payTableEl = $('pay-table');
const dealBtn = $('deal-btn');
const betBtn = $('bet-btn');
const foldBtn = $('fold-btn');
const clearBtn = $('clear-btn');
const allinBtn = $('allin-btn');
const handDisplayEl = $('current-hand-display');
const chipBtns = document.querySelectorAll('.chip');

// ─── Card Image Helpers ──────────────────────────────────────────
function cardToImageNum(rank, suit) {
    const idx = RANKS.indexOf(rank);
    return String(SUIT_OFFSETS[suit] + idx).padStart(2, '0');
}
function cardImgSrc(rank, suit) {
    return `cards/${cardToImageNum(rank, suit)}_kerenel_Cards.png`;
}

// Backs: 28 (Red), 42 (Blue)
const BACK_IMAGES = ['28', '42'].map(n => `cards/${n}_kerenel_Cards.png`);
let currentBackIdx = 0;

function getBackImg() {
    return BACK_IMAGES[currentBackIdx % BACK_IMAGES.length];
}

// ─── Pay Table Rendering ─────────────────────────────────────────
function renderPayTable() {
    payTableEl.innerHTML = '';
    PAY_TABLE.forEach(entry => {
        const row = document.createElement('div');
        row.className = 'pt-row';
        row.dataset.key = entry.key;
        row.innerHTML = `<div class="pt-hand">${entry.rank}</div><div class="pt-mult">${entry.mult}×</div>`;
        payTableEl.appendChild(row);
    });
}

function highlightPayTable(key) {
    document.querySelectorAll('.pt-row').forEach(r => r.classList.remove('highlight'));
    if (key) {
        const row = document.querySelector(`.pt-row[data-key="${key}"]`);
        if (row) row.classList.add('highlight');
    }
}

// ─── Betting Helpers ─────────────────────────────────────────────
function maxBetThisStreet() {
    return Math.min(MAX_BET_STREET, G.bankroll);
}

function canBet() {
    if (G.bankroll === 0) return G.currentBet === 0;
    // Allow true All-In regardless of street limits
    if (G.currentBet === G.bankroll) return true;
    
    const max = maxBetThisStreet();
    // If bankroll is less than MIN_BET, only All-In (already handled) or checking (if allowed)
    if (G.bankroll < MIN_BET) return G.currentBet === G.bankroll;
    
    return G.currentBet >= MIN_BET && G.currentBet <= max;
}

function updateBetDisplay() {
    potValueEl.textContent = '$' + G.pot;
    currentBetEl.textContent = '+ $' + G.currentBet;
}

function updateChips() {
    const max = maxBetThisStreet();
    chipBtns.forEach(btn => {
        const val = parseInt(btn.dataset.value);
        btn.disabled = (G.state !== 'betting' || G.currentBet + val > max || G.bankroll <= 0);
    });
}

// ─── Card Rendering ──────────────────────────────────────────────
function createCardElement(card, faceUp) {
    const slot = document.createElement('div');
    slot.className = 'card-slot' + (faceUp ? ' flipped' : '');
    slot.innerHTML = `
        <div class="card-inner">
            <div class="card-face card-back"><img src="${getBackImg()}" alt="card back"></div>
            <div class="card-face card-front">${card ? `<img src="${cardImgSrc(card.rank, card.suit)}" alt="${card.rank}${card.suit}">` : ''}</div>
        </div>`;
    return slot;
}

// Track which cards are already flipped to avoid redundant animations
let flippedCards = new Set();

function renderCards(isNewHand = false) {
    if (isNewHand) {
        holeCardsEl.innerHTML = '';
        communityCardsEl.innerHTML = '';
        flippedCards.clear();
    }
    
    // Hole Cards
    G.holeCards.forEach((card, i) => {
        const cardKey = `${card.rank}${card.suit}_hole_${i}`;
        let slot = holeCardsEl.children[i];
        
        if (!slot) {
            slot = createCardElement(card, false);
            holeCardsEl.appendChild(slot);
        }

        if (!flippedCards.has(cardKey)) {
            flippedCards.add(cardKey);
            setTimeout(() => {
                requestAnimationFrame(() => {
                    slot.classList.add('flipped');
                    applyWinnerHighlight(slot, card);
                });
            }, i * 150 + 100);
        } else {
            applyWinnerHighlight(slot, card);
        }
    });

    // Community Cards
    G.communityCards.forEach((card, i) => {
        let slot = communityCardsEl.children[i];
        
        if (!slot) {
            // Create a placeholder if card is null, or the card if it exists
            slot = createCardElement(card, false);
            communityCardsEl.appendChild(slot);
        } else if (card) {
            const frontEl = slot.querySelector('.card-front');
            if (frontEl && frontEl.innerHTML.trim() === '') {
                frontEl.innerHTML = `<img src="${cardImgSrc(card.rank, card.suit)}" alt="${card.rank}${card.suit}">`;
            }
        }
        
        if (card) {
            const cardKey = `${card.rank}${card.suit}_comm_${i}`;
            if (!flippedCards.has(cardKey)) {
                flippedCards.add(cardKey);
                setTimeout(() => {
                    requestAnimationFrame(() => {
                        slot.classList.add('flipped');
                        applyWinnerHighlight(slot, card);
                    });
                }, (isNewHand ? G.holeCards.length + i : i) * 150 + 100);
            } else {
                applyWinnerHighlight(slot, card);
            }
        }
    });
}

function applyWinnerHighlight(slot, card) {
    if (G.state === 'showdown' && G.lastResult && G.lastResult.handCards) {
        if (G.lastResult.handCards.some(hc => hc.rank === card.rank && hc.suit === card.suit)) {
            slot.classList.add('winner');
        } else {
            slot.classList.remove('winner');
        }
    } else {
        slot.classList.remove('winner');
    }
}

// ─── UI Refresh ──────────────────────────────────────────────────
function updateUI(skipCards = false) {
    bankrollEl.textContent = G.bankroll;
    updateBetDisplay();
    updateChips();
    
    // Streaks
    const winStr = G.totalWins > 0 ? `Wins: ${G.totalWins}` : 'Wins: 0';
    const lossStr = G.totalLosses > 0 ? `Losses: ${G.totalLosses}` : 'Losses: 0';
    streakDisplayEl.textContent = `${winStr} | ${lossStr}`;

    // Hand Evaluation
    const currentHand = evaluateBestHand(G.holeCards, G.communityCards);
    if (G.state === 'betting' && currentHand) {
        handDisplayEl.textContent = 'Current: ' + currentHand.type;
    } else {
        handDisplayEl.textContent = '';
    }

    // Street Pips
    document.querySelectorAll('.street-pip').forEach(pip => {
        const s = parseInt(pip.dataset.street);
        pip.className = 'street-pip' + (s < G.street ? ' past' : '') + (s === G.street ? ' active' : '');
    });

    // Buttons
    const idle = G.state === 'idle';
    const showdown = G.state === 'showdown';
    const betting = G.state === 'betting';

    dealBtn.style.display = (idle || showdown) ? '' : 'none';
    betBtn.style.display = betting ? '' : 'none';
    betBtn.disabled = !canBet();
    betBtn.textContent = G.street === 2 ? 'Showdown' : 'Confirm';
    
    foldBtn.style.display = betting ? '' : 'none';
    clearBtn.style.display = betting ? '' : 'none';
    allinBtn.style.display = betting ? '' : 'none';

    if (!skipCards) renderCards();
    highlightPayTable(showdown && G.lastResult ? G.lastResult.key : null);
}

// ─── Actions ─────────────────────────────────────────────────────
function newHand() {
    G.deck = shuffle(createDeck());
    G.holeCards = [G.deck.pop(), G.deck.pop()];
    G.communityCards = [null, null, null, null, null];
    
    // Cycle card back for each hand
    currentBackIdx++;
    
    const ante = Math.min(G.bankroll, MIN_BET);
    G.bankroll -= ante;
    G.pot = ante;
    
    G.street = 0;
    G.currentBet = 0;
    G.lastResult = null;
    G.state = 'betting';
    
    resultBannerEl.innerHTML = '';
    renderCards(true); // Explicitly say it's a new hand
    updateUI(true);    // Update text/buttons but skip card re-render
}

function confirmBet() {
    if (!canBet()) return;
    G.bankroll -= G.currentBet;
    G.pot += G.currentBet;
    G.currentBet = 0;
    
    nextStreet();
}

function nextStreet() {
    if (G.street === 2) { // Just finished Turn bet
        G.street++; // Become 3 (River revealed state)
        G.communityCards[4] = G.deck.pop();
        updateUI(); 
        setTimeout(goToShowdown, 1000); 
        return;
    }

    G.street++;
    if (G.street === 1) { // Flop
        G.communityCards[0] = G.deck.pop();
        G.communityCards[1] = G.deck.pop();
        G.communityCards[2] = G.deck.pop();
    } else if (G.street === 2) { // Turn
        G.communityCards[3] = G.deck.pop();
    }
    updateUI();
}

function goToShowdown() {
    G.state = 'showdown';
    const result = evaluateBestHand(G.holeCards, G.communityCards);
    G.lastResult = result;
    const payEntry = getPayEntry(result.key);
    const multiplier = payEntry.mult;
    const payout = G.pot * multiplier;
    const netGain = payout - G.pot;

    G.bankroll += payout;
    G.stats.handsPlayed++;

    if (multiplier === 0) {
        G.totalLosses++;
        resultBannerEl.innerHTML = `Lost $${G.pot} — ${result.type}`;
    } else if (multiplier === 1) {
        resultBannerEl.innerHTML = `Break Even — ${result.type}<div class="hand-name">$${G.pot} returned</div>`;
    } else {
        G.stats.handsWon++;
        if (netGain > G.stats.biggestWin) G.stats.biggestWin = netGain;
        G.totalWins++;
        resultBannerEl.innerHTML = `Won $${netGain} — ${result.type}<div class="hand-name">${multiplier}× payout</div>`;
    }

    updateUI(); // This will apply winner highlights without re-flipping
    if (G.bankroll <= 0 && multiplier === 0) {
        setTimeout(gameOver, 1500);
    }
}

function fold() {
    const lost = G.pot;
    G.stats.handsPlayed++;
    G.totalLosses++;
    
    // Animate folding
    document.querySelectorAll('.card-slot').forEach(slot => {
        slot.classList.add('folding');
    });

    setTimeout(() => {
        G.pot = 0;
        G.currentBet = 0;
        G.state = 'idle';
        resultBannerEl.innerHTML = `Folded — lost $${lost}`;
        updateUI();
        
        // Trigger new hand after a short pause to show the fold result
        setTimeout(newHand, 1000);
        
        if (G.bankroll < MIN_BET) setTimeout(gameOver, 1200);
    }, 600);
}

function gameOver() {
    G.state = 'game-over';
    $('game-over-overlay').classList.add('show');
    $('go-hands').textContent = G.stats.handsPlayed;
    $('go-won').textContent = G.stats.handsWon;
    const rate = G.stats.handsPlayed > 0 ? Math.round(G.stats.handsWon / G.stats.handsPlayed * 100) : 0;
    $('go-rate').textContent = rate + '%';
    $('go-biggest').textContent = '$' + G.stats.biggestWin;
}

function restart() {
    G.bankroll = INITIAL_BANKROLL;
    G.pot = 0;
    G.currentBet = 0;
    G.street = 0;
    G.stats = { handsPlayed:0, handsWon:0, biggestWin:0 };
    G.totalWins = 0;
    G.totalLosses = 0;
    G.state = 'idle';
    $('game-over-overlay').classList.remove('show');
    resultBannerEl.innerHTML = '';
    updateUI();
}

// ─── Event Listeners ─────────────────────────────────────────────
chipBtns.forEach(btn => {
    btn.onclick = () => {
        const val = parseInt(btn.dataset.value);
        const max = maxBetThisStreet();
        if (G.currentBet + val <= max) {
            G.currentBet += val;
            updateUI();
        }
    };
});

dealBtn.onclick = newHand;
betBtn.onclick = confirmBet;
foldBtn.onclick = fold;
clearBtn.onclick = () => { G.currentBet = 0; updateUI(); };
allinBtn.onclick = () => { G.currentBet = G.bankroll; updateUI(); };
$('restart-btn').onclick = restart;

// ─── Init ────────────────────────────────────────────────────────
renderPayTable();
$('pay-table-header').onclick = () => {
    const table = $('pay-table');
    const header = $('pay-table-header');
    table.classList.toggle('collapsed');
    header.textContent = table.classList.contains('collapsed') ? 'Pay Table ▸' : 'Pay Table ▾';
};
newHand();
