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

// All approved alternate icons are free and require no purchase receipts.
// Only compiled native icon names may be applied. The apply method is not yet
// exposed until the approved individual icon assets are bundled.
