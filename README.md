Oathkeeper mobile — version 1.0.0
Standalone Android and iOS project prepared from Harrison’s Oathkeeper character manager. This is a source project, not a signed AAB/IPA and not a store approval guarantee.
Included
Capacitor 8 native Android and iOS projects; bundled offline web assets. No hosted-site login or remote server URL.
Device-native preferences for saved character data, plus native backup sharing.
Local PDF/text/JSON import with review before applying fields; unfamiliar PDFs need manual corrections; scans need external OCR.
HP, Holy Points, custom powers, derived stats, inventory/coin weight, journal, dice roller and confirmed reset.
Android API 36 configuration, adaptive launcher icons, iOS app icon, privacy manifest wired into the Xcode Resources phase, privacy page and store listing draft.
Build prerequisites
Node.js 22 or later. Run npm ci from this folder, then npm run sync.
Android: Android Studio 2025.2.1 or newer, JDK 21 and Android SDK platform 36. Run npm run android. In Android Studio, wait for Gradle sync, run on an emulator and physical Android phone, then Build → Generate Signed App Bundle / APK → Android App Bundle. Create or select your own upload keystore and keep it secure. Release output is normally android/app/build/outputs/bundle/release/app-release.aab. Upload the signed AAB to Play Console; the ZIP is not the upload file. Never commit or send signing keys/passwords with this source.
Command-line unsigned Android bundle: after installing the SDK, cd android && ./gradlew bundleRelease. This source intentionally includes no release signing secrets.
iOS: a Mac with Xcode 26 or later and the iOS 26 SDK. Run npm run ios, resolve Swift packages, select your Apple Developer team in Signing & Capabilities, and verify com.harrisonwaters.oathkeeper is available in your account (change identifiers consistently if needed). Run on an iPhone/iPad, then Product → Archive → Distribute App → App Store Connect. Use TestFlight before production submission. Do not upload this ZIP to App Store Connect.
Release blockers still owned by the publisher
Register/verify your Google Play and/or Apple Developer account, accept store agreements yourself, and select a unique app identifier/name.
Host dist/privacy.html at a publicly accessible HTTPS URL and supply a working support email/URL. The existing private ChatGPT Site is not a suitable public privacy/support URL. Update the privacy contact section to your support contact, rebuild and sync.
Capture genuine screenshots from the native app on the required device sizes. Store graphics in store/ are icons/feature artwork, not screenshots.
Test the native release builds on devices. Native compilation was not run in the preparation environment: Android SDK and Xcode were unavailable. Preferences, file picker, JSON sharing, safe areas, keyboard, PDF parsing/worker on supported iOS versions, background/restore and Android back handling need device QA.
Complete age/content ratings, app-access, privacy and Data safety forms for the final shipped build and SDKs. Draft notes are in store/submission.md.
For new personal Google Play developer accounts subject to the testing rule: complete a closed test with at least 12 continuously opted-in testers for 14 days and apply for production access.
Verify the existing character content and branding are what you want to distribute. This app is independent and does not claim affiliation with Dungeons & Dragons or its publisher.
Validation completed here
JavaScript syntax checks and Vite production build.
Capacitor Android/iOS generation and sync.
Static checks of API 36, iOS privacy manifest resource wiring, bundled PDF worker, absence of remote server configuration and signing secrets.
The original browser app’s HP, power spending and weight calculation were checked. The new native shell still needs the device tests above.
Project layout
web/: editable app source. dist/: production web build. android/: Android Studio project. ios/App/App.xcodeproj: Xcode project. assets/: source app icon. store/: listing draft, release checklist and store graphics. scripts/verify.mjs: automated project integrity checks.
App data is stored locally and does not synchronize with the web version. To move your existing web character: Export backup in the web app and import that JSON file in the native app. Keep separate backups before uninstalling or clearing data.
