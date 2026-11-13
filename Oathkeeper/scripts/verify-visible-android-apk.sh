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
# IMPORTANT: TEST175 previously had a FALSE PASS: foreground WebView process
# existed, but the screenshot was uniformly black, i.e. UI had not rendered.
# Wait for real gold typography/controls to paint, not a nonempty PNG.
# The attached age/terms artwork has >300 warm gold sample pixels; a black
# WebView has 0. Keep screenshot evidence and FAIL if it never paints.
visible=0
for attempt in $(seq 1 18); do
  sleep 5
  timeout 35 adb exec-out screencap -p > "$REPORT/native-device.png"
  test -s "$REPORT/native-device.png"
  if python3 - "$REPORT/native-device.png" <<'PY'
from PIL import Image
import sys
im=Image.open(sys.argv[1]).convert("RGB")
w,h=im.size
part=im.crop((int(w*.08),int(h*.12),int(w*.92),int(h*.88))).resize((120,220))
warm=sum(1 for r,g,b in part.getdata() if r>95 and r>g*1.05 and g>b*1.20 and g>55)
print("Observed Oathkeeper gold content pixels:",warm)
sys.exit(0 if warm>=60 else 1)
PY
  then
    visible=1
    echo "Visual content appeared on attempt $attempt" > "$REPORT/ui-appearance.txt"
    break
  fi
done
adb shell dumpsys activity activities > "$REPORT/activity.txt"
adb shell dumpsys window windows > "$REPORT/windows.txt"
grep -Fq "$PACKAGE" "$REPORT/activity.txt"
if [ "$visible" -ne 1 ]; then
  adb logcat -d -v time > "$REPORT/android-logcat.txt" || true
  echo 'WebView remained black; app UI did not paint. NATIVE QA FAIL.' >&2
  exit 1
fi

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
Screenshot: real Oathkeeper artwork visibly rendered, UI hierarchy reachable, no OS modal detected
All 10 launcher aliases: enable/disable from app UID
Original launcher alias: restored
Fatal exception / System UI ANR: not found
Not verified: actual in-app icon selection, Samsung launcher rendering, baked Store gem artwork
EOF
echo 'OATHKEEPER NATIVE VISUAL SMOKE PASS'
