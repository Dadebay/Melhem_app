# Melhem

Melhem is a React Native app for finding medicines and pharmacies, placing pharmacy orders, and managing medication reminders. The interface currently includes Turkmen and Russian translations. This is a React Native CLI project, so Flutter and Dart commands in the general completion checklist do not apply.

## Requirements

- Node.js 20 or newer and pnpm 10.12.1
- JDK 17, Android SDK and Android Studio for Android
- macOS, Xcode, Ruby 3.3 and CocoaPods for iOS

Follow the [React Native environment setup](https://reactnative.dev/docs/set-up-your-environment) for platform SDK details.

## Setup

```sh
pnpm install --frozen-lockfile
bundle install
bundle exec pod install --project-directory=ios
```

The Ruby and CocoaPods steps are needed only for iOS. Start Metro with `pnpm start`, then use `pnpm android` or `pnpm ios` in another terminal. The `ios` script targets an iPhone 17 Pro simulator; use Xcode to select another device.

## Checks and builds

```sh
pnpm exec prettier --check 'src/**/*.{ts,tsx}' 'App.tsx' '__tests__/**/*.{ts,tsx}'
pnpm exec tsc --noEmit
pnpm exec eslint . --quiet
pnpm test --runInBand --watch=false
(cd android && ./gradlew :app:assembleDebug --no-daemon)
```

For an iOS simulator build, install pods and build the `melhem` scheme in Xcode. The CI workflow runs these checks and both platform builds on pull requests.

## Project configuration

- Android application ID: `tm.com.umytgroup.sanlymelhem` (currently version 1.0.5, build 105).
- iOS bundle ID: `app.melhem` (currently version 2.0.0, build 2).
- API base URL: `https://cms.melhem.app/api`; image storage: `https://storage.melhem.app`.
- The app requests location to show nearby pharmacies and notifications for reminders. The backend and public legal-document URLs must be verified before distribution.

Production signing files and credentials are not part of this repository. Never distribute a debug APK. See [release readiness](docs/release-readiness.md) for verification, release, and operations steps.

## Distribution status

No current GitHub Release or store listing has been verified for these application IDs. Store and download links will be added after a signed build and device testing are complete.
