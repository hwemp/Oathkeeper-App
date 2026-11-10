import { webcrypto } from 'node:crypto';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { OFFICIAL_DICE, UNOFFICIAL_DICE, rollDie } from '../web/dice.js';

const words = new Uint32Array(16384);
let index = words.length;
function nextWord() {
  if (index === words.length) { webcrypto.getRandomValues(words); index = 0; }
  return words[index++];
}
const sampleSize = 100000;
const results = [];
for (const [mode, list] of [['official', OFFICIAL_DICE], ['unofficial', UNOFFICIAL_DICE]]) {
  for (const sides of list) {
    const counts = Array(sides).fill(0);
    let sum=0;
    for (let i=0;i<sampleSize;i++) {
      const value=rollDie(sides,mode,nextWord).value;
      assert(value>=1&&value<=sides&&Number.isInteger(value));
      counts[value-1]++;sum+=value;
    }
    const expected=sampleSize/sides;
    const chiSquared=counts.reduce((sum,n)=>sum+(n-expected)**2/expected,0);
    const degrees=sides-1;
    // Conservative regression alarm, not a fairness certification or proof of independence.
    const alarmThreshold=degrees+10*Math.sqrt(2*degrees)+40;
    assert(chiSquared<alarmThreshold,`${mode} D${sides}: distribution regression alarm`);
    results.push({mode,sides,sampleSize,counts,expectedPerFace:expected,mean:sum/sampleSize,theoreticalMean:(sides+1)/2,chiSquared,alarmThreshold,passed:true});
  }
}
const report={source:'Node Web Crypto getRandomValues, batched uint32 words; production rollDie mapping',totalRolls:results.length*sampleSize,warning:'Sample tests can detect regressions but cannot prove randomness. Exact mapping tests establish that accepted uint32 words map evenly.',results};
fs.mkdirSync('preview-output',{recursive:true});
fs.writeFileSync('preview-output/dice-fairness.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({totalRolls:report.totalRolls,distributions:results.length,passed:results.every(r=>r.passed),results:results.map(({mode,sides,mean,theoreticalMean,chiSquared})=>({mode,sides,mean,theoreticalMean,chiSquared}))},null,2));
