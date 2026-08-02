# Melhem

React Native mobile app built with [`@react-native-community/cli`](https://github.com/react-native-community/cli).

## Prerequisites

- Node.js >= 20
- [pnpm](https://pnpm.io/) 10.12+
- Ruby >= 2.6.10
- Xcode (for iOS)
- Android Studio (for Android)

See the [React Native Environment Setup](https://reactnative.dev/docs/set-up-your-environment) guide for details.

## Setup

```sh
pnpm install
bundle install
```

For iOS, install CocoaPods dependencies (run after first clone or updating native deps):

```sh
bundle exec pod install --project-directory=ios
```

## Running the app

Start Metro bundler:

```sh
pnpm start
```

In a separate terminal, build and run on a platform:

```sh
# iOS (iPhone 17 Pro simulator)
pnpm ios

# Android
pnpm android
```

You can also build directly from Xcode or Android Studio.

## Scripts

| Command         | Description                        |
| --------------- | ---------------------------------- |
| `pnpm start`    | Start Metro dev server             |
| `pnpm ios`      | Build and run on iOS simulator     |
| `pnpm android`  | Build and run on Android emulator  |
| `pnpm test`     | Run Jest tests                     |
| `pnpm lint`     | Run ESLint                         |

## Project structure

```
src/            - Application source code
ios/            - iOS native project
android/        - Android native project
assets/         - Static assets
__tests__/      - Tests
```
