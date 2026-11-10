import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const visibleSources=[
  '../web/support.js',
  '../web/app.js',
  '../web/notices.js',
  '../web/community-ui/age-safety.tsx'
];

test('routine app interface uses Repair Review branding rather than provider branding',async()=>{
  for(const path of visibleSources){
    const source=await readFile(new URL(path,import.meta.url),'utf8');
    assert.doesNotMatch(source,/\b(?:AI|OpenAI|ChatGPT|GPT)\b/i, path+' has provider branding');
  }
  const support=await readFile(new URL('../web/support.js',import.meta.url),'utf8');
  assert.match(support,/<h3>Repair Review<\/h3>/);
  assert.match(support,/>Request Repair Review<\/button>/);
  assert.match(support,/Support report copied\. Review it before sharing\./);
});

test('privacy policy retains a truthful disclosure of optional third-party analysis',async()=>{
  const policy=await readFile(new URL('../web/privacy.html',import.meta.url),'utf8');
  assert.match(policy,/Optional Repair Review sends your redacted report/);
  assert.match(policy,/external provider \(OpenAI\)/);
});
