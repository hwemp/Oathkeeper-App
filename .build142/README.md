# Oathkeeper Build 142 APK payload

These 10 Git blobs concatenate, in numeric order, to the exact web-assets-only ZIP derived from the user's uploaded Oathkeeper-Build-142-Store-Dice-Animation.zip.

ZIP SHA-256: c83a657ab68b900b724b75c45b6d5d2256e69192a1d62e922279422fb0fb0b05
ZIP size: 19,289,820 bytes

The .github/workflows/build142-apk.yml workflow validates this digest, replaces Vite's dist/ build with the provided, already-compiled Build 142 web app (including exact-store artwork and rolling previews), and assembles a debug-signed Android APK with the repository's existing Capacitor/Gradle project.

**Important:** This produces a test APK, not a source-code merge or a production-signed release. Payments remain disabled. Native launcher icons and the in-game tabletop rolling dice are not modified by this web-only payload. For subsequent development, corresponding changes must also be merged into Oathkeeper/web source.
