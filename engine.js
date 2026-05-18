/**
 * Hold'em Solitaire - Core Game Engine
 * Handles Cards, Deck, Hand Evaluation, and State
 */

// ─── Constants ───────────────────────────────────────────────────
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const RANK_VALUES = { 'A':14, '2':2, '3':3, '4':4, '5':5, '6':6, '7':7,
    '8':8, '9':9, '10':10, 'J':11, 'Q':12, 'K':13 };
const SUITS = ['h','s','d','c'];
const SUIT_SYMBOLS = { 'h':'♥','s':'♠','d':'♦','c':'♣' };
const SUIT_OFFSETS = { 'h':1, 's':15, 'd':29, 'c':43 };

const PAY_TABLE = [
    { rank:'Royal Flush',      mult:100, key:'ROYAL_FLUSH' },
    { rank:'Straight Flush',   mult:50,  key:'STRAIGHT_FLUSH' },
    { rank:'Four of a Kind',   mult:25,  key:'FOUR_KIND' },
    { rank:'Full House',       mult:9,   key:'FULL_HOUSE' },
    { rank:'Flush',            mult:6,   key:'FLUSH' },
    { rank:'Straight',         mult:5,   key:'STRAIGHT' },
    { rank:'Three of a Kind',  mult:3,   key:'THREE_KIND' },
    { rank:'Two Pair',         mult:2,   key:'TWO_PAIR' },
    { rank:'One Pair',         mult:1,   key:'ONE_PAIR' },
    { rank:'High Card',        mult:0,   key:'HIGH_CARD' },
];

const MIN_BET = 5;
const MAX_BET_STREET = 100;
const INITIAL_BANKROLL = 500;

// ─── State Object ────────────────────────────────────────────────
const G = {
    state: 'idle', // idle, betting, showdown, game-over
    bankroll: INITIAL_BANKROLL,
    pot: 0,
    currentBet: 0,
    street: 0, // 0: Pre-flop, 1: Flop, 2: Turn, 3: River
    holeCards: [],
    communityCards: [],
    deck: [],
    lastResult: null,
    stats: { handsPlayed: 0, handsWon: 0, biggestWin: 0 },
    totalWins: 0,
    totalLosses: 0,
};

// ─── Deck Management ─────────────────────────────────────────────
function createDeck() {
    const deck = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({ rank, suit, value: RANK_VALUES[rank] });
        }
    }
    return deck;
}

function shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// ─── Hand Evaluation Logic ───────────────────────────────────────
function combinations(arr, k) {
    const result = [];
    function helper(start, combo) {
        if (combo.length === k) { result.push([...combo]); return; }
        for (let i = start; i < arr.length; i++) {
            combo.push(arr[i]);
            helper(i + 1, combo);
            combo.pop();
        }
    }
    helper(0, []);
    return result;
}

function checkStraight(values) {
    const unique = [...new Set(values)].sort((a,b)=>b-a);
    if (unique.length < 5) return null;
    for (let i = 0; i <= unique.length - 5; i++) {
        if (unique[i] - unique[i+4] === 4) return unique[i];
    }
    // A-5 Straight
    if (unique.includes(14) && unique.includes(5) && unique.includes(4) && unique.includes(3) && unique.includes(2)) return 5;
    return null;
}

function scoreHand(cards) {
    const sorted = [...cards].sort((a,b)=>b.value - a.value);
    const values = sorted.map(c=>c.value);
    const suits = sorted.map(c=>c.suit);
    const isFlush = new Set(suits).size === 1;
    const straightHigh = checkStraight(values);

    if (isFlush && straightHigh) {
        if (straightHigh === 14) return { type:'Royal Flush', key:'ROYAL_FLUSH', tiebreak:[], index:9, handCards: cards };
        return { type:'Straight Flush', key:'STRAIGHT_FLUSH', tiebreak:[straightHigh], index:8, handCards: cards };
    }

    const rankCounts = {};
    for (const v of values) rankCounts[v] = (rankCounts[v] || 0) + 1;
    const counts = Object.entries(rankCounts).map(([v, c]) => [parseInt(v), c]).sort((a,b)=>b[1]-a[1]||b[0]-a[0]);

    if (counts[0][1] === 4) {
        const quadVal = counts[0][0];
        const handCards = cards.filter(c => c.value === quadVal); // Only highlight the 4 cards
        return { type:'Four of a Kind', key:'FOUR_KIND', tiebreak:[quadVal, counts[1][0]], index:7, handCards };
    }
    if (counts[0][1] === 3 && counts[1][1] >= 2) {
        const tripVal = counts[0][0];
        const pairVal = counts[1][0];
        const handCards = cards.filter(c => c.value === tripVal || c.value === pairVal); // All 5
        return { type:'Full House', key:'FULL_HOUSE', tiebreak:[tripVal, pairVal], index:6, handCards };
    }
    if (isFlush) return { type:'Flush', key:'FLUSH', tiebreak:values, index:5, handCards: cards };
    if (straightHigh) {
        let handCards = [];
        let high = straightHigh;
        if (high === 5 && values.includes(14)) { // A-5
            [14, 5, 4, 3, 2].forEach(v => handCards.push(cards.find(c => c.value === v)));
        } else {
            for (let v = high; v > high - 5; v--) handCards.push(cards.find(c => c.value === v));
        }
        return { type:'Straight', key:'STRAIGHT', tiebreak:[straightHigh], index:4, handCards };
    }
    if (counts[0][1] === 3) {
        const tripVal = counts[0][0];
        const handCards = cards.filter(c => c.value === tripVal); // Only highlight the 3 cards
        return { type:'Three of a Kind', key:'THREE_KIND', tiebreak:[tripVal, ...values.filter(v=>v!==tripVal).slice(0,2)], index:3, handCards };
    }
    if (counts[0][1] === 2 && counts[1][1] === 2) {
        const p1 = counts[0][0];
        const p2 = counts[1][0];
        const handCards = cards.filter(c => c.value === p1 || c.value === p2); // Only highlight the 4 cards (2 pairs)
        return { type:'Two Pair', key:'TWO_PAIR', tiebreak:[p1, p2, counts[2][0]], index:2, handCards };
    }
    if (counts[0][1] === 2) {
        const pairVal = counts[0][0];
        const handCards = cards.filter(c => c.value === pairVal); // Only highlight the 2 cards
        return { type:'One Pair', key:'ONE_PAIR', tiebreak:[pairVal, ...values.filter(v=>v!==pairVal).slice(0,3)], index:1, handCards };
    }
    
    return { type:'High Card', key:'HIGH_CARD', tiebreak:values, index:0, handCards: [] };
}

function compareHands(a, b) {
    if (a.index !== b.index) return a.index - b.index;
    for (let i = 0; i < Math.max(a.tiebreak.length, b.tiebreak.length); i++) {
        const va = a.tiebreak[i] || 0;
        const vb = b.tiebreak[i] || 0;
        if (va !== vb) return va - vb;
    }
    return 0;
}

function evaluateBestHand(holeCards, communityCards) {
    const all = [...holeCards, ...communityCards].filter(c => c !== null);
    if (all.length < 5) return null;
    const combos = combinations(all, 5);
    let best = null;
    for (const combo of combos) {
        const result = scoreHand(combo);
        if (!best || compareHands(result, best) > 0) best = result;
    }
    return best;
}

function getPayEntry(key) {
    return PAY_TABLE.find(e => e.key === key);
}
