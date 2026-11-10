import test from 'node:test';
import assert from 'node:assert/strict';
import { OFFICIAL_DICE, UNOFFICIAL_DICE, uniformIndex, rollDie, rollDice, diceStatistics } from '../web/dice.js';

test('every allowed size has equal mappings in complete accepted blocks; excess words are rejected', () => {
  for (const n of UNOFFICIAL_DICE) {
    const limit = Math.floor(0x100000000 / n) * n;
    const first = [], last = [];
    for (let i = 0; i < n; i++) {
      first.push(uniformIndex(n, () => i));
      last.push(uniformIndex(n, () => limit - n + i));
    }
    assert.deepEqual(first, Array.from({length:n}, (_, i) => i));
    assert.deepEqual(last, first);
    if (limit < 0x100000000) {
      const words = [0xffffffff, limit, n - 1];
      let calls = 0;
      assert.equal(uniformIndex(n, () => { calls++; return words.shift(); }), n - 1);
      assert.equal(calls, 3);
    }
  }
  assert.equal(uniformIndex(4, () => 0xffffffff), 3);
});

test('official D3 maps all six D6 faces into three equally likely results', () => {
  const results = Array.from({length:6}, (_, i) => rollDie(3, 'official', () => i));
  assert.deepEqual(results.map(x => x.value), [1,1,2,2,3,3]);
  assert.deepEqual(results.map(x => x.d6), [1,2,3,4,5,6]);
});

test('official percentile rolls map all 100 digit pairs exactly once, including 00 + 0 = 100', () => {
  const values = [];
  for (let tens = 0; tens < 10; tens++) for (let ones = 0; ones < 10; ones++) {
    const words = [tens, ones];
    const die = rollDie(100, 'official', () => words.shift());
    assert.equal(die.tens, tens * 10);
    assert.equal(die.ones, ones);
    values.push(die.value);
  }
  assert.deepEqual(values.sort((a,b)=>a-b), Array.from({length:100}, (_,i)=>i+1));
});

test('quantity and modifier apply once to the total, without clamping individual rolls', () => {
  const words = [0, 19, 9];
  const result = rollDice({sides:20, quantity:3, modifier:-2}, () => words.shift());
  assert.deepEqual(result.rolls.map(x=>x.value), [1,20,10]);
  assert.equal(result.subtotal, 31);
  assert.equal(result.total, 29);
  assert.equal(rollDice({sides:4,modifier:-10},()=>0).total,-9);
  let calls=0;
  assert.equal(rollDice({sides:6,quantity:100,modifier:5},()=>{calls++;return 0}).total,105);
  assert.equal(calls,100);
});

test('unofficial D50 is available and unsupported sizes, invalid settings and invalid random words fail', () => {
  assert(!OFFICIAL_DICE.includes(50));
  assert(UNOFFICIAL_DICE.includes(50));
  assert.equal(rollDie(50,'unofficial',()=>49).value,50);
  for(const sides of [0,1,2,5,7,50,Infinity,NaN]) assert.throws(()=>rollDie(sides,'official'));
  for(const quantity of [0,-1,1.5,101,NaN]) assert.throws(()=>rollDice({sides:6,quantity}));
  for(const modifier of [0.5,Infinity,NaN,10001,-10001]) assert.throws(()=>rollDice({sides:6,modifier}));
  for(const word of [-1,0x100000000,NaN,Infinity,1.5]) assert.throws(()=>uniformIndex(6,()=>word));
});

test('displayed probabilities, means, limits and variance match exact dice formulas', () => {
  for (const n of UNOFFICIAL_DICE) {
    const s=diceStatistics(n,3,-2);
    assert.equal(s.chance,1/n);
    assert.equal(s.mean,3*(n+1)/2-2);
    assert.equal(s.minimum,1);
    assert.equal(s.maximum,3*n-2);
    assert.equal(s.variance,3*(n*n-1)/12);
  }
});
