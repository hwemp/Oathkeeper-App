import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { Preferences } from '@capacitor/preferences';
const key = 'oathkeeper-community-url';
export function communityUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('Enter only the HTTPS address of your Oathkeeper community, without a path or sign-in details.');
  return url.origin;
}
export async function savedCommunity() {
  const { value } = await Preferences.get({ key });
  return value || import.meta.env.VITE_COMMUNITY_URL || '';
}
export async function openCommunity(value) {
  const origin = communityUrl(value.trim());
  await Preferences.set({ key, value: origin });
  const url = origin + '/?community=1';
  if (Capacitor.isNativePlatform()) await Browser.open({ url, toolbarColor: '#131119', presentationStyle: 'fullscreen' });
  else window.open(url, '_blank', 'noopener,noreferrer');
}
export async function forgetCommunity() { await Preferences.remove({ key }); }
