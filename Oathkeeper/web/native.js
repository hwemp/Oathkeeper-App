import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { App } from '@capacitor/app';
export const isNative=Capacitor.isNativePlatform();
const KEY='oathkeeper-v1';let queue=Promise.resolve(),nativeReady=!isNative;
export async function loadStored(){if(!isNative)return;const {value}=await Preferences.get({key:KEY});if(value)localStorage.setItem(KEY,value);nativeReady=true}
export function persist(value){if(isNative&&!nativeReady)return Promise.reject(new Error('Native data could not be loaded; restart before saving'));localStorage.setItem(KEY,value);if(isNative){queue=queue.catch(()=>{}).then(()=>Preferences.set({key:KEY,value}));queue.catch(()=>document.dispatchEvent(new Event('save-error')))}return queue}
export async function exportBackup(character){const data=JSON.stringify({format:'oathkeeper',version:1,character},null,2);if(isNative){const path='Oathkeeper-character.json';const result=await Filesystem.writeFile({path,data,directory:Directory.Cache,encoding:Encoding.UTF8});await Share.share({title:'Oathkeeper character backup',url:result.uri,dialogTitle:'Save or share your backup'});return}const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='Oathkeeper-character.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
export async function clearStored(){await queue.catch(()=>{});if(isNative)await Preferences.remove({key:KEY});localStorage.removeItem(KEY)}
if(isNative)App.addListener('backButton',({canGoBack})=>{const dialog=document.querySelector('dialog[open]');if(dialog)dialog.close();else if(canGoBack)history.back();else document.dispatchEvent(new Event('navigate-home'))});
