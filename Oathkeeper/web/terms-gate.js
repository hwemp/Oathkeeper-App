import { App } from '@capacitor/app';
import { isNative } from './native.js';

export const TERMS_VERSION = '2026-11-10-v1';
const KEY = 'oathkeeper-terms-acceptance';
let accepted = false;
let tier = '';

function readAcceptance() {
  try {
    const record = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (record?.version === TERMS_VERSION && ['adult', 'teen'].includes(record.tier) && record.accepted === true) return record;
  } catch {}
  return null;
}
export function canUseCommunity() { return accepted && tier === 'adult' && document.querySelector('meta[name="oathkeeper-community-safety-verified"]')?.getAttribute('content') === 'verified'; }
export function isTermsAccepted() { return accepted; }
export function currentAgeTier() { return tier; }

export function setupTermsGate() {
  const gate = document.getElementById('termsGate');
  if (!gate) throw new Error('Required age and terms gate is missing.');
  const main = [...document.querySelectorAll('body > header, body > main, body > dialog')];
  const age = document.getElementById('termsAge');
  const check = document.getElementById('termsAgree');
  const accept = document.getElementById('termsAccept');
  const reject = document.getElementById('termsReject');
  const message = document.getElementById('termsStatus');
  const lock = () => {
    gate.hidden = false;
    document.documentElement.classList.add('terms-pending');
    main.forEach(node => { node.inert = true; node.setAttribute('aria-hidden', 'true'); });
    gate.focus();
  };
  const unlock = () => {
    gate.hidden = true;
    document.documentElement.classList.remove('terms-pending');
    main.forEach(node => { node.inert = false; node.removeAttribute('aria-hidden'); });
  };
  const record = readAcceptance();
  if (record) { accepted = true; tier = record.tier; unlock(); }
  else lock();

  const update = () => {
    const under13 = age.value === 'under13';
    accept.disabled = !check.checked || !['adult', 'teen'].includes(age.value);
    message.textContent = under13
      ? 'Access is unavailable for children under 13 in this testing release. No age or guardian verification service is operating.'
      : age.value === 'teen'
      ? 'Ages 13–17: offline character and DM tools only. Community, messaging and file sharing are blocked until appropriate safeguards are available. Guardian permission may be required.'
      : age.value === 'adult'
      ? 'Age declaration is self-reported, not proof of identity. Online community features also require the separate server checks.'
      : 'Choose your age range to continue.';
  };
  age.addEventListener('change', update);
  check.addEventListener('change', update);
  accept.addEventListener('click', () => {
    if (accept.disabled) return;
    const selectedTier = age.value;
    try {
      localStorage.setItem(KEY, JSON.stringify({ version: TERMS_VERSION, accepted: true, tier: selectedTier, at: new Date().toISOString() }));
      accepted = true; tier = selectedTier;
      unlock();
      document.dispatchEvent(new Event('terms-accepted'));
    } catch {
      message.textContent = 'Cannot securely record acceptance on this device. Enable app storage before continuing.';
    }
  });
  reject.addEventListener('click', async () => {
    accepted = false; tier = '';
    lock();
    message.textContent = 'Terms rejected. Access remains locked. Close the app, or review the terms and accept to continue.';
    if (isNative) { try { await App.exitApp(); } catch { /* Remain locked if the platform cannot close this app. */ } }
  });
  document.addEventListener('keydown', event => {
    if (!accepted && !gate.contains(event.target) && event.key !== 'Tab') { event.stopImmediatePropagation(); event.preventDefault(); }
  }, true);
  update();
}
