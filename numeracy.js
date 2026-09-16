// Deterministic, date-seeded numeracy question generator.
// Same date -> same question, everywhere, no server or storage needed
// (mirrors how NUMBLE seeds its daily puzzle off the date).

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return h;
}

// mulberry32 — small, fast, deterministic PRNG from an integer seed
function makeRandom(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(arr, rand) {
  return arr[Math.floor(rand() * arr.length)];
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
  const distractors = new Set();
  let guard = 0;
  while (distractors.size < 3 && guard < 50) {
    guard++;
    const delta = 1 + Math.floor(rand() * 10);
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

// Two unambiguous templates so there's never a question of operator
// precedence: a plain +/- chain, or a parenthesised (a op b) op c.
export function generateNumeracy(dateStr) {
  const rand = makeRandom(hashSeed(dateStr + '|numeracy'));
  const useParens = rand() < 0.5;

  for (let attempt = 0; attempt < 40; attempt++) {
    if (!useParens) {
      const op1 = rand() < 0.5 ? '+' : '-';
      const op2 = rand() < 0.5 ? '+' : '-';
      const a = 8 + Math.floor(rand() * 40);
      const b = 3 + Math.floor(rand() * 25);
      const c = 3 + Math.floor(rand() * 25);

      const step1 = op1 === '+' ? a + b : a - b;
      if (step1 < 0) continue;
      const result = op2 === '+' ? step1 + c : step1 - c;
      if (result < 0) continue;

      return finalize(`${a} ${op1} ${b} ${op2} ${c}`, result, rand);
    } else {
      const innerOp = pick(['+', '-', '×'], rand);
      const outerOp = pick(['×', '÷'], rand);
      const a = 2 + Math.floor(rand() * 10);
      const b = 2 + Math.floor(rand() * 8);

      let inner;
      if (innerOp === '+') inner = a + b;
      else if (innerOp === '-') { inner = a - b; if (inner < 0) continue; }
      else inner = a * b;

      const c = 2 + Math.floor(rand() * 7);
      let result;
      if (outerOp === '×') {
        result = inner * c;
      } else {
        if (c === 0 || inner % c !== 0) continue;
        result = inner / c;
      }
      if (!Number.isInteger(result) || result < 0 || result > 400) continue;

      return finalize(`(${a} ${innerOp} ${b}) ${outerOp} ${c}`, result, rand);
    }
  }

  // Should never hit this given the bounds above, but keep the app alive if it does.
  return finalize('(6 + 4) × 3', 30, rand);
}
