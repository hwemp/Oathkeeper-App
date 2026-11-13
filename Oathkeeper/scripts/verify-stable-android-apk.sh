#!/usr/bin/env bash
# Run against an ALREADY built signed Oathkeeper APK; no changes to app data.
# Keep native device resolution untouched: wm resize caused emulator SystemUI ANRs.
set -euo pipefail
APK="${1:?APK}"
PACKAGE="${2:?package}"
REPORT="${3:?reports}"
mkdir -p "$REPORT"
ALIAS_PREFIX="com.harrisonwaters.oathkeeper"
MAIN="$PACKAGE/$ALIAS_PREFIX.LauncherOriginal"

timeout 80 adb wait-for-device
timeout 90 adb shell 'while [ "$(getprop sys.boot_completed)" != "1" ]; do sleep 2; done'
adb shell wm size > "$REPORT/native-size.txt"
adb shell wm density > "$REPORT/native-density.txt"
adb install -r "$APK" > "$REPORT/install.txt"
grep -q 'Success' "$REPORT/install.txt"
adb shell pm path "$PACKAGE" > "$REPORT/package.txt"
grep -q 'base.apk' "$REPORT/package.txt"
adb logcat -c

# Nonblocking launches avoid adb wait timeouts when the heavy WebView cold-starts.
adb shell am start -n "$MAIN" > "$REPORT/launch.txt" 2>&1
for n in $(seq 1 35); do
  if adb shell pidof "$PACKAGE" | grep -Eq '[0-9]+'; then break; fi
  sleep 2
done
adb shell pidof "$PACKAGE" > "$REPORT/app-pid.txt"
test -s "$REPORT/app-pid.txt"
sleep 12
adb shell dumpsys activity activities > "$REPORT/activity.txt"
adb shell dumpsys window windows > "$REPORT/windows.txt"
grep -Fq "$PACKAGE" "$REPORT/activity.txt"
timeout 35 adb exec-out screencap -p > "$REPORT/native-device.png"
test -s "$REPORT/native-device.png"

# UI dump must be obtainable; an OS 'not responding' dialog is a FAIL,
# not a screenshot to represent as a success.
if timeout 35 adb shell uiautomator dump /sdcard/oath-ui.xml > "$REPORT/ui-dump-result.txt" 2>&1; then
  adb pull /sdcard/oath-ui.xml "$REPORT/native-ui.xml" >/dev/null 2>&1 || true
else
  printf 'UI dump timed out; emulator cannot verify screen accessibility.\n' >&2
  exit 1
fi
if grep -Ei 'System UI isn.t responding|Pixel Launcher isn.t responding|is not responding|Close app' "$REPORT/native-ui.xml" > "$REPORT/os-dialog-errors.txt" 2>/dev/null; then
  printf 'System UI/launcher ANR obscures screenshot; invalid emulator evidence.\n' >&2
  exit 1
fi

# Verify ALL 10 exact native launcher alias components can enable/disable
# from the app UID. Android 15 prevents the test shell UID doing this.
adb shell run-as "$PACKAGE" id > "$REPORT/app-uid.txt"
for n in 01 02 04 05 06 07 08 11 12 14; do
  alias="$PACKAGE/$ALIAS_PREFIX.LauncherIcon$n"
  output="$REPORT/alias-$n.txt"
  adb shell run-as "$PACKAGE" /system/bin/pm enable "$alias" > "$output"
  grep -q 'new state: enabled' "$output"
  adb shell run-as "$PACKAGE" /system/bin/pm disable "$alias" >> "$output"
  grep -q 'new state: disabled' "$output"
done
adb shell run-as "$PACKAGE" /system/bin/pm enable "$MAIN" > "$REPORT/original-alias.txt"
grep -q 'new state: enabled' "$REPORT/original-alias.txt"

adb logcat -d -v time > "$REPORT/android-logcat.txt"
# Distinguish app crash from device/launcher failure. Both block certification.
if grep -E 'FATAL EXCEPTION|ANR in com.android.systemui|ANR in com.google.android.apps.nexuslauncher' "$REPORT/android-logcat.txt" > "$REPORT/crash-check.txt"; then
  echo 'App or Android SystemUI fatal event; device test is NOT VERIFIED' >&2
  exit 1
fi

cat > "$REPORT/summary.txt" <<EOF
PACKAGE: $PACKAGE
APK installed: yes
Cold launch: process running, activity focused
Native resolution: unchanged
Screenshot: captured, UI hierarchy reachable, no OS modal detected
All 10 launcher aliases: enable/disable from app UID
Original launcher alias: restored
Fatal exception / System UI ANR: not found
Not verified: actual in-app icon selection, Samsung launcher rendering, baked Store gem artwork
EOF
echo 'OATHKEEPER NATIVE SMOKE PASS'
