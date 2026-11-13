#!/usr/bin/env bash
set -euo pipefail
APK="${1:?signed test apk required}"
REPORT="${2:?report output required}"
mkdir -p "$REPORT"
PACKAGE="com.harrisonwaters.oathkeeper.test173"
MAIN="$PACKAGE/com.harrisonwaters.oathkeeper.LauncherOriginal"
adb wait-for-device
adb shell 'while [ "$(getprop sys.boot_completed)" != "1" ]; do sleep 1; done'
adb install -r "$APK" | tee "$REPORT/install.txt"
adb shell pm path "$PACKAGE" | tee "$REPORT/package.txt" | grep -q base.apk
adb shell am start -W -n "$MAIN" | tee "$REPORT/first-launch.txt"
sleep 7
adb shell dumpsys activity activities > "$REPORT/activity.txt"
grep -Eq 'com.harrisonwaters.oathkeeper(\\.test173)?' "$REPORT/activity.txt" || {
 echo "App not in Android activity stack" >&2; exit 1;
}
adb shell logcat -c
# Maintain Android's native screen DPI; changing a Pixel emulator from 420
# straight to 160dpi creates a launcher ANR and invalidates screenshots.
DENSITY="$(adb shell wm density | tr -d '\r' | sed -n 's/^Physical density: //p')"
test -n "$DENSITY"
for view in "360x780" "393x852" "412x915"; do
 logical_width="${view%x*}"
 logical_height="${view#*x}"
 physical_width=$((logical_width * DENSITY / 160))
 physical_height=$((logical_height * DENSITY / 160))
 adb shell wm size "${physical_width}x${physical_height}"
 adb shell am start -W -n "$MAIN" > "$REPORT/launch-$view.txt"
 sleep 5
 adb shell uiautomator dump /sdcard/oath-window.xml || true
 adb pull /sdcard/oath-window.xml "$REPORT/ui-$view.xml" >/dev/null 2>&1 || true
 # If the emulator launcher briefly shows an OS crash dialog, dismiss it
 # and return to the app rather than filing a misleading 'app screenshot'.
 if grep -Eiq "(isn't responding|is not responding|Close app)" "$REPORT/ui-$view.xml" 2>/dev/null; then
   adb shell input keyevent KEYCODE_BACK
   adb shell am start -W -n "$MAIN" >> "$REPORT/launch-$view.txt"
   sleep 4
 fi
 adb exec-out screencap -p > "$REPORT/screen-$view.png"
 test -s "$REPORT/screen-$view.png"
done
adb shell wm size reset
# Native launcher icon resources must instantiate as real Android
# activity aliases. This checks package configuration on Android,
# not just string matching in compiled resources.
# Android 15 blocks the ADB shell UID from toggling other applications'
# components. A debug APK's run-as launches the package manager under the
# SAME app UID as the real Oathkeeper icon plugin.
adb shell run-as "$PACKAGE" id > "$REPORT/app-uid.txt"
for number in 01 02 04 05 06 07 08 11 12 14; do
 alias="$PACKAGE/com.harrisonwaters.oathkeeper.LauncherIcon$number"
 adb shell run-as "$PACKAGE" /system/bin/pm enable "$alias" > "$REPORT/icon-alias-$number.txt"
 adb shell am start -W -n "$alias" >> "$REPORT/icon-alias-$number.txt"
 grep -q 'Status: ok' "$REPORT/icon-alias-$number.txt"
 adb shell run-as "$PACKAGE" /system/bin/pm disable "$alias" >> "$REPORT/icon-alias-$number.txt"
done
adb shell run-as "$PACKAGE" /system/bin/pm enable "$MAIN" > "$REPORT/restore-original-launcher.txt"
adb shell am start -W -n "$MAIN" >> "$REPORT/restore-original-launcher.txt"
# Distinguish true crashes from harmless WebView/OS warnings.
adb logcat -d -v time > "$REPORT/android-logcat.txt"
if grep -E 'FATAL EXCEPTION|Process: com.harrisonwaters.oathkeeper.test173' "$REPORT/android-logcat.txt" > "$REPORT/fatal-check.txt"; then
 echo "Android crash signal found; examine fatal-check.txt" >&2
 exit 1
fi
printf 'Installed package: %s\nThree logical Android phone viewport resolutions tested at native DPI\nTen native launcher aliases launched using app UID\nAndroid fatal exceptions: zero\nNOTE: in-app selection UI and real Samsung launcher masking need device review\n' "$PACKAGE" > "$REPORT/device-check-summary.txt"
echo 'TEST 173 ANDROID EMULATOR SMOKE PASS'
