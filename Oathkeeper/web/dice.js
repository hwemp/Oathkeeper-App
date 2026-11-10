// Artwork never participates in randomness. All accepted 32-bit words map evenly.
export const OFFICIAL_DICE = Object.freeze([4, 6, 8, 10, 12, 20, 100, 3]);
export const UNOFFICIAL_DICE = Object.freeze([3, 4, 6, 8, 10, 12, 20, 50, 100]);
const UINT32_SIZE = 0x100000000;

export function secureWord() {
  if (!globalThis.crypto?.getRandomValues) throw new Error('Secure randomness is unavailable. No dice were rolled.');
  return globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
}

export function uniformIndex(size, nextWord = secureWord) {
  if (!Number.isSafeInteger(size) || size < 1 || size > UINT32_SIZE) throw new RangeError('Invalid random range');
  const limit = Math.floor(UINT32_SIZE / size) * size;
  for (;;) {
    const word = nextWord();
    if (!Number.isInteger(word) || word < 0 || word >= UINT32_SIZE) throw new RangeError('Invalid random word');
    if (word < limit) return word % size;
  }
}

export function rollDie(sides, mode = 'official', nextWord = secureWord) {
  const allowed = mode === 'official' ? OFFICIAL_DICE : mode === 'unofficial' ? UNOFFICIAL_DICE : [];
  if (!allowed.includes(sides)) throw new RangeError('Choose a supported die');
  if (mode === 'official' && sides === 3) {
    const d6 = uniformIndex(6, nextWord) + 1;
    return { value: Math.ceil(d6 / 2), d6 };
  }
  if (mode === 'official' && sides === 100) {
    const tens = uniformIndex(10, nextWord) * 10;
    const ones = uniformIndex(10, nextWord);
    return { value: tens + ones || 100, tens, ones };
  }
  return { value: uniformIndex(sides, nextWord) + 1 };
}

export function rollDice({ sides, mode = 'official', quantity = 1, modifier = 0 }, nextWord = secureWord) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) throw new RangeError('Quantity must be a whole number from 1 to 100');
  if (!Number.isInteger(modifier) || modifier < -10000 || modifier > 10000) throw new RangeError('Modifier must be a whole number from -10000 to 10000');
  const rolls = Array.from({ length: quantity }, () => rollDie(sides, mode, nextWord));
  const subtotal = rolls.reduce((sum, die) => sum + die.value, 0);
  return { sides, mode, quantity, modifier, rolls, subtotal, total: subtotal + modifier };
}

export function diceStatistics(sides, quantity = 1, modifier = 0) {
  if (!UNOFFICIAL_DICE.includes(sides) || !Number.isInteger(quantity) || quantity < 1 || quantity > 100 || !Number.isInteger(modifier) || Math.abs(modifier) > 10000) throw new RangeError('Invalid dice statistics');
  return { chance: 1 / sides, mean: quantity * (sides + 1) / 2 + modifier, minimum: quantity + modifier, maximum: quantity * sides + modifier, variance: quantity * (sides * sides - 1) / 12 };
}
