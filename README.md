# Melhem — Medicine Search & Ordering App for Turkmenistan

A React Native mobile application that lets users in Turkmenistan find medications, compare prices across pharmacies, place orders, and manage medication reminders — all in one place.

Supports **Turkmen** (primary) and **Russian** languages, with Light / Dark / System themes.

---

## Features

### Catalog & Search
- Full-text drug search by name, active substance, or brand name
- Recent search history (last 5 queries) with one-tap clear
- Browse by **Category**, **Manufacturer**, or **Country of origin**
- Drug detail with image carousel, dosage info, indications, contraindications, and side effects
- Price range shown across all pharmacies; sorted cheapest-first in the "Where to buy" section

### Pharmacies
- Pharmacy list with open/closed status based on real-time working hours
- Nearby pharmacies via geolocation (fallback: sorted by popularity)
- Pharmacy detail: logo, address, schedule, inventory list
- Quick actions: Call, Directions (Google/Apple Maps), Website, Email

### Cart & Checkout
- Add items from any pharmacy; cart is grouped **per pharmacy** (one order = one pharmacy)
- Quantity limited to in-stock inventory
- Background price & stock validation on cart open
- Checkout flow: cart review → delivery/pickup → contact info → payment → confirm
- Cash on delivery (primary); card/online payment coming later
- Delivery zone check against pharmacy's coverage area

### Orders
- Real-time order tracking with timeline (pending → accepted → preparing → on the way → delivered)
- Status polling every 30 s or via WebSocket
- Push notifications on every status change
- Order history with **Re-order** (checks current prices & availability)
- Cancel allowed until "preparing" status

### Medication Reminders
- Create reminders per medication with custom schedules
- Family member support (manage reminders for others)
- Missed-dose detection on app resume
- Snooze, take, and skip actions directly from notifications
- Adherence statistics and calendar view

### Favorites & Addresses
- Favorites stored locally, persisted across sessions; swipe to remove
- Delivery address book (up to 5 addresses): Home, Work, or custom label
- Default address pre-filled at checkout

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React Native 0.84.1 (New Architecture) |
| Language | TypeScript 5.8 |
| Navigation | React Navigation 7 (native stack + bottom tabs) |
| State management | Zustand 5 |
| Server state | TanStack Query 5 |
| HTTP | Axios |
| Local storage | react-native-mmkv |
| Styling | Tailwind CSS (Uniwind) + HeroUI Native |
| Animations | React Native Reanimated 4 |
| Maps | MapLibre React Native |
| Notifications | Notifee |
| Geolocation | @react-native-community/geolocation |
| Internationalisation | i18next + react-i18next |
| Lists | @shopify/flash-list |
| Images | react-native-turbo-image |
| Date handling | Day.js |
| Icons | Lucide React Native |
| Package manager | pnpm 10.12 |

---

## Project Structure

```
melhem-app/
├── src/
│   ├── components/        # Reusable UI components (DrugCard, PharmacyList, Carousel…)
│   ├── screens/           # One folder per screen (Home, Drug, Pharmacy, Cart, Checkout…)
│   ├── navigation/        # Tab navigator + per-tab stacks
│   ├── lib/
│   │   ├── api/           # Axios clients per domain (drug, pharmacy, order, auth…)
│   │   ├── store/         # Zustand stores (cart, auth, theme, reminders…)
│   │   ├── hooks/         # Custom hooks
│   │   ├── notifications/ # Notifee scheduler, channels, action handler, snooze
│   │   └── theme/         # Light / dark token files
│   ├── locales/           # tm.json + ru.json translation files
│   ├── types/             # Global TypeScript type definitions
│   └── utils/             # Pure helpers (pharmacy hours, price formatting…)
├── ios/                   # Xcode project
├── android/               # Gradle project
├── assets/                # Images, fonts, icons
└── __tests__/             # Jest test suite
```

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 20 |
| pnpm | 10.12+ |
| Ruby | ≥ 2.6.10 |
| Xcode | latest stable (iOS builds) |
| Android Studio | latest stable (Android builds) |
| CocoaPods | bundled via `bundle exec` |

See the [React Native Environment Setup](https://reactnative.dev/docs/set-up-your-environment) guide for full details.

---

## Setup

```sh
# 1. Install JS dependencies
pnpm install

# 2. Install Ruby gems (CocoaPods, fastlane, etc.)
bundle install

# 3. iOS — install CocoaPods (run again after updating native deps)
bundle exec pod install --project-directory=ios
```

---

## Running the App

Start Metro bundler first:

```sh
pnpm start
```

Then, in a separate terminal:

```sh
# iOS (iPhone 17 Pro simulator by default)
pnpm ios

# Android emulator
pnpm android
```

You can also build directly from **Xcode** or **Android Studio**.

---

## Scripts

| Command | Description |
|---|---|
| `pnpm start` | Start Metro dev server |
| `pnpm ios` | Build and run on iOS simulator |
| `pnpm android` | Build and run on Android emulator |
| `pnpm test` | Run Jest test suite |
| `pnpm lint` | Run ESLint |

---

## Supported Platforms

| Platform | Minimum version |
|---|---|
| iOS | 15+ |
| Android | 8.0+ (API 26) |

---

## API

The app connects to `https://cms.melhem.app/api`.

Key domain endpoints:

| Domain | Methods |
|---|---|
| Auth | `POST /auth/send-code`, `POST /auth/verify-code`, `GET /auth/me` |
| Drugs | `GET /drugs`, `GET /drugs/:id` |
| Pharmacies | `GET /pharmacies`, `GET /pharmacies/:id` |
| Inventory | `GET /inventories` (per pharmacy or drug) |
| Cart validation | `POST /cart/validate` |
| Orders | `POST /orders`, `GET /orders`, `GET /orders/:id`, `PUT /orders/:id/cancel` |
| Addresses | `GET /addresses`, `POST/PUT/DELETE /addresses/:id` |
| Delivery check | `POST /delivery/check` |
| Notifications | `POST /devices` (register push token) |

---

## Localisation

All UI strings live in `src/locales/tm.json` (Turkmen) and `src/locales/ru.json` (Russian).  
Language switches instantly at runtime — no restart required.  
Drug names, category labels, and pharmacy info are returned pre-localised from the backend.

---

## Notifications

Medication reminders are powered by **Notifee**:

- Android channels: one per notification category
- iOS: custom categories with Take / Skip / Snooze actions
- Reminders rescheduled on cold start and on every app resume
- Missed-dose detection runs in the foreground event handler
