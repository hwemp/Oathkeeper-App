import {Capacitor, registerPlugin} from '@capacitor/core';

// This bridge is iOS-only. Returning the original-icon state in web/Android
// keeps the store usable without pretending a launcher icon was changed.
const nativeIcon = registerPlugin('OathkeeperIcon');
const isIOS = () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';

export async function getIOSIconState() {
  if (!isIOS()) return {supported:false,currentIcon:'default',isOriginal:true};
  return nativeIcon.getState();
}

export async function restoreOriginalIOSIcon() {
  if (!isIOS()) throw new Error('Changing app icons is only available inside the installed iOS app.');
  return nativeIcon.restoreDefault();
}

// Future premium icon application MUST verify App Store purchase ownership
// natively or through a trusted backend before calling the iOS icon API.
// No unverified JS property or localStorage flag may unlock a paid icon.
