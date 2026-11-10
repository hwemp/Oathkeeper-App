import {Capacitor, registerPlugin} from '@capacitor/core';
import {SELECTED_APP_ICONS} from './store-icon-catalog.js';

const nativeIcon = registerPlugin('OathkeeperIcon');
const installed = () => Capacitor.isNativePlatform() &&
  ['ios','android'].includes(Capacitor.getPlatform());

export async function getIconState() {
  if(!installed()) return {supported:false,currentIcon:'default',isOriginal:true};
  return nativeIcon.getState();
}

export async function applyFreeIcon(slug) {
  const item=SELECTED_APP_ICONS.find(icon=>icon.slug===slug);
  if(!item) throw new Error('This app icon is not an approved free design.');
  if(!installed()) throw new Error('Install Oathkeeper on Android or iOS to change its launcher icon.');
  return nativeIcon.setIcon({iconName:item.iosIconName});
}

export async function restoreOriginalIcon() {
  if(!installed()) throw new Error('Install Oathkeeper to restore its launcher icon.');
  return nativeIcon.restoreDefault();
}

// Backward-compatible names for the earlier iOS-only bridge.
export const getIOSIconState = getIconState;
export const restoreOriginalIOSIcon = restoreOriginalIcon;
