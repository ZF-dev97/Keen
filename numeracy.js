// Deterministic, date-seeded numeracy generator — 5 harder questions a day.
// Same date -> same 5 questions, everywhere, no server or storage needed.
// Difficulty mirrors NUMBLE's recalibration: bigger numbers, 3-4 terms,
// mixed operators, no easing in.

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return h;
}

function makeRandom(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rand) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function finalize(displayPrompt, result, rand) {
  const spread = Math.max(3, Math.round(result * 0.08));
  const distractors = new Set();
  let guard = 0;
  while (distractors.size < 3 && guard < 80) {
    guard++;
    const delta = 1 + Math.floor(rand() * spread);
    const candidate = result + (rand() < 0.5 ? -1 : 1) * delta;
    if (candidate >= 0 && candidate !== result) distractors.add(candidate);
  }
  const options = shuffle([result, ...distractors], rand);
  return {
    prompt: `${displayPrompt} = ?`,
    options: options.map(String),
    correctIndex: options.indexOf(result),
    explanation: `${displayPrompt} = ${result}`
  };
}

function divisorsOf(n, min, max) {
  const out = [];
  for (let d = min; d <= max; d++) {
    if (n % d === 0) out.push(d);
  }
  return out;
}

// Five template shapes, each 3-4 terms with mixed operators and bigger
// numbers than a "warm-up" level. Standard order of operations applies
// (x and / before + and -); parentheses are added only where the
// intended grouping needs them.
const TEMPLATES = [
  // (a + b) x c - d
  (rand) => {
    for (let i = 0; i < 40; i++) {
      const a = 10 + Math.floor(rand() * 40);
      const b = 10 + Math.floor(rand() * 40);
      const c = 3 + Math.floor(rand() * 7);
      const d = 5 + Math.floor(rand() * 60);
      const result = (a + b) * c - d;
      if (result >= 0) return finalize(`(${a} + ${b}) × ${c} - ${d}`, result, rand);
    }
  },
  // (a x b) / c + d  -- c chosen to divide evenly
  (rand) => {
    for (let i = 0; i < 40; i++) {
      const a = 4 + Math.floor(rand() * 12);
      const b = 4 + Math.floor(rand() * 12);
      const product = a * b;
      const divisors = divisorsOf(product, 2, 12);
      if (!divisors.length) continue;
      const c = divisors[Math.floor(rand() * divisors.length)];
      const d = 10 + Math.floor(rand() * 50);
      const result = product / c + d;
      return finalize(`(${a} × ${b}) ÷ ${c} + ${d}`, result, rand);
    }
  },
  // a x b - c x d  (standard precedence, no parens needed)
  (rand) => {
    for (let i = 0; i < 40; i++) {
      const a = 6 + Math.floor(rand() * 14);
      const b = 6 + Math.floor(rand() * 14);
      const c = 4 + Math.floor(rand() * 10);
      const d = 4 + Math.floor(rand() * 10);
      if (a === c && b === d) continue; // avoid a trivial "x - x = 0"
      const result = a * b - c * d;
      if (result >= 0) return finalize(`${a} × ${b} - ${c} × ${d}`, result, rand);
    }
  },
  // (a - b) x (c + d)
  (rand) => {
    for (let i = 0; i < 40; i++) {
      const a = 25 + Math.floor(rand() * 60);
      const b = 5 + Math.floor(rand() * 20);
      if (a <= b) continue;
      const c = 4 + Math.floor(rand() * 12);
      const d = 4 + Math.floor(rand() * 12);
      const result = (a - b) * (c + d);
      return finalize(`(${a} - ${b}) × (${c} + ${d})`, result, rand);
    }
  },
  // a + b x c - d  (standard precedence, no parens needed)
  (rand) => {
    for (let i = 0; i < 40; i++) {
      const a = 10 + Math.floor(rand() * 60);
      const b = 4 + Math.floor(rand() * 12);
      const c = 4 + Math.floor(rand() * 12);
      const d = 5 + Math.floor(rand() * 40);
      const result = a + b * c - d;
      if (result >= 0) return finalize(`${a} + ${b} × ${c} - ${d}`, result, rand);
    }
  }
];

// One day's set of 5 questions, cycling through the templates in a
// date-seeded shuffled order so the sequence varies day to day too.
export function generateNumeracyDay(dateStr) {
  const order = shuffle([0, 1, 2, 3, 4], makeRandom(hashSeed(dateStr + '|numeracy|order')));
  const seen = new Set();
  const questions = [];

  order.forEach((templateIndex, i) => {
    const rand = makeRandom(hashSeed(dateStr + '|numeracy|' + i + '|' + templateIndex));
    let q = TEMPLATES[templateIndex](rand);
    // Guard against a template failing to find a valid combination or
    // producing the same answer as an earlier question today.
    let guard = 0;
    while ((!q || seen.has(q.explanation)) && guard < 10) {
      guard++;
      q = TEMPLATES[templateIndex](makeRandom(hashSeed(dateStr + '|numeracy|' + i + '|' + templateIndex + '|' + guard)));
    }
    if (!q) q = finalize('(6 + 4) × 3', 30, rand); // should never happen given the ranges above
    seen.add(q.explanation);
    questions.push(q);
  });

  return questions;
}
