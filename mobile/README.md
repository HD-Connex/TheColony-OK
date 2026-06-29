# The Colony OK — Mobile App

Native iOS + Android app built with Expo SDK 53+ that mirrors the web platform (Next.js + Supabase + Mux).

## Feature Parity

| Feature | Web | Mobile | Status |
|---------|-----|--------|--------|
| 24/7 VOD schedule with auto-advance | `EliteMux24x7Player` | `EliteMobile24x7Player` | ✅ |
| Live stream support | `LiveStage` / `VideoPlayer` | `VideoPlayer` (HLS) | ✅ |
| Real-time schedule updates | `use24x7Schedule` + Realtime | `use24x7Schedule` + Realtime | ✅ |
| Browse / discover programs | `/watch` page | Browse tab | ✅ |
| Program detail | `/shows/[slug]` | `program/[id]` screen | ✅ |
| Schedule / program guide | Schedule view | Schedule tab | ✅ |
| Full-screen native player | Mux Player web component | `expo-video` + custom controls | ✅ |
| Picture-in-Picture | Browser PiP API | `expo-video` PiP (iOS/Android) | ✅ |
| Background playback | Audio context + MiniPlayer | `expo-video` background mode | ✅ |
| Email magic link auth | Supabase + redirect | Supabase + deep link | ✅ |
| OAuth (Google, Apple) | Supabase OAuth | Supabase OAuth + ASWebAuthSession | ✅ |
| Membership management | `/membership` page | Profile tab | ✅ |
| Watch progress sync | `watch_progress` table | Future (same table) | 🔄 |
| Deep linking | Next.js links | `expo-router` + `expo-linking` | ✅ |
| Search | `/search` page | Browse search | ✅ |
| Error resilience | ErrorBoundary, retry | ErrorBoundary, retry, offline states | ✅ |
| Playback analytics | `playback_sessions` table | `usePlaybackAnalytics` → same table | ✅ |

## How Mobile Consumes the Same Data as Web

The mobile app reads from the **identical Supabase tables and views** as the web:

- `public.programs` — Program metadata + Mux playback IDs
- `public.schedules` — Ordered playlist entries
- `public.current_program` (view) — Currently-active program
- `public.upcoming_queue` (view) — Next programs in queue
- `public.player_configs` — Global channel settings
- `public.playback_sessions` — Analytics writes (same table)
- `public.series` / `public.video_episodes` — Shows and episodes
- `mux.assets` — Mux asset enrichment (via @mux/supabase sync)

**Key principle**: Mobile never duplicates server logic. It queries the same views and reacts to the same Realtime events. The `@mux/supabase` sync layer (webhook → `mux.assets` → `public.programs`) works identically for both platforms — upload a video via web admin, and it appears on mobile instantly.

## Architecture

```
mobile/
├── app/                         # expo-router file-based routes
│   ├── _layout.tsx              # Root layout (providers, deep links)
│   ├── index.tsx                # Redirect to tabs
│   ├── +not-found.tsx           # 404 fallback screen
│   ├── (tabs)/                  # Bottom tab navigator
│   │   ├── _layout.tsx
│   │   ├── index.tsx            # Home (24/7 player)
│   │   ├── browse.tsx           # Browse programs
│   │   ├── schedule.tsx         # Schedule guide
│   │   └── profile.tsx          # Profile / settings
│   ├── (auth)/
│   │   └── sign-in.tsx          # Magic link sign in
│   ├── player/[id].tsx          # Full-screen player
│   ├── program/[id].tsx         # Program detail
│   ├── series/[slug].tsx        # Series detail
│   ├── episode/[id].tsx         # Episode detail
│   └── settings/
├── src/
│   ├── types/index.ts           # Zod schemas + TS types
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client (singleton)
│   │   ├── constants.ts         # Env vars, URL builders
│   │   ├── resilience.ts        # Error classification, backoff
│   │   └── storage.ts           # (reserved for future)
│   ├── hooks/
│   │   ├── useAuth.ts           # Auth state + membership
│   │   ├── use24x7Schedule.ts   # Schedule + Realtime
│   │   ├── usePlaybackAnalytics.ts # Analytics tracking
│   │   ├── useNetworkStatus.ts  # Online/offline detection
│   │   └── useMobilePlayer.ts   # Player state machine
│   ├── components/
│   │   ├── EliteMobile24x7Player.tsx # 24/7 player
│   │   ├── VideoPlayer.tsx       # expo-video wrapper
│   │   ├── PlayerControls.tsx    # Custom on-screen controls
│   │   ├── ErrorBoundary.tsx     # Global error boundary
│   │   ├── LoadingSkeleton.tsx   # Skeleton components
│   │   ├── EmptyState.tsx        # Empty state component
│   │   ├── ErrorState.tsx        # Error state + retry
│   │   ├── NetworkStatusBar.tsx  # Offline banner
│   │   ├── AuthGuard.tsx         # Route protection
│   │   ├── ProgramCard.tsx       # Program list card
│   │   └── ScheduleList.tsx      # Schedule list (FlashList)
│   └── providers/
│       ├── AuthProvider.tsx      # Auth context
│       ├── QueryProvider.tsx     # TanStack Query
│       └── PlayerProvider.tsx    # Global player context
```

## Data Flow: Schedule → Player

```
Supabase DB
  ├─ current_program (view) ──────┐
  ├─ upcoming_queue (view) ───────┤
  └─ player_configs (table) ──────┤
                                   ▼
                         use24x7Schedule() hook
                           ├─ Fetches on mount
                           ├─ Subscribes to Realtime
                           └─ Returns { current, upcoming, config }
                                   │
                                   ▼
                    EliteMobile24x7Player
                      ├─ loadProgram(current)
                      ├─ Waits for program end
                      ├─ advanceToNext(upcoming[0])
                      └─ On error → fallback chain
```

## Error Resilience Strategy

Every screen handles these states:
- **Loading**: Skeleton components (never blank)
- **Error**: ErrorState with retry button (never crash)
- **Empty**: EmptyState with contextual message (never blank)
- **Success**: Full content

Player-specific resilience:
- **Transient errors** (buffer, stall, timeout) → exponential backoff with jitter (5 attempts)
- **Fatal errors** (not found, forbidden) → immediate fallback chain
- **Offline** → "No internet connection" banner + auto-resume on reconnect
- **Fallback chain**: primary playbackId → per-program fallback → global fallback → offline slate

Navigation resilience:
- **Typed routes** via expo-router (dead links impossible at compile time)
- **+not-found.tsx** catches all unknown routes (never blank/crash)
- **Deep links** parsed with fallback to home screen

## Setup & Development

### Prerequisites
- Node.js 20+
- pnpm (or npm)
- Expo CLI: `pnpm add -g expo-cli`
- EAS CLI: `pnpm add -g eas-cli`
- iOS: Xcode 16+ (for iOS simulator)
- Android: Android Studio (for Android emulator)

### Install
```bash
cd mobile
pnpm install
```

### Environment
```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

### Run
```bash
# iOS
pnpm ios

# Android
pnpm android

# Web (for debugging)
pnpm web
```

### Type Checking
```bash
pnpm typecheck
```

## Build & Deploy

### Development Build (internal testing)
```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

### Preview Build (TestFlight / internal distribution)
```bash
eas build --profile preview --platform ios
eas build --profile preview --platform android
```

### Production Build (App Store / Play Store)
```bash
eas build --profile production --platform ios
eas build --profile production --platform android

# Submit
eas submit --platform ios
eas submit --platform android
```

## Testing Checklist

### Navigation (zero dead links)
- [ ] All tab screens load without error
- [ ] Program card tap → program detail screen
- [ ] "Watch Now" button → full-screen player
- [ ] Schedule item tap → player
- [ ] Deep link `thecolony://program/{id}` opens correct screen
- [ ] Unknown route → 404 fallback (not crash)
- [ ] Back button works on all screens
- [ ] Auth redirect deep link → correct destination

### Player (zero crashes)
- [ ] Loads current program on app start
- [ ] Auto-advances to next program
- [ ] Play/pause toggle works
- [ ] Seek bar works
- [ ] Volume control works
- [ ] Fullscreen toggle works (landscape orientation)
- [ ] PiP works (iOS Safari / Android)
- [ ] Background audio continues when app is backgrounded
- [ ] Rotation doesn't cause crash or layout glitch
- [ ] Network loss → offline state → reconnect resumes
- [ ] Schedule update via admin → player updates via Realtime

### Auth
- [ ] Sign in with email → magic link sent
- [ ] Deep link from magic link → session established
- [ ] Session persists across app restart
- [ ] Sign out clears session
- [ ] Protected content shows sign-in prompt for anonymous users

### Data & Sync
- [ ] Browse loads programs from Supabase
- [ ] Category filter works
- [ ] Search filters by title/description
- [ ] Schedule shows current + upcoming programs
- [ ] Schedule updates in real-time when admin makes changes
- [ ] Series detail shows episodes
- [ ] Analytics session created on playback start

### Error Handling
- [ ] No internet → offline banner shown
- [ ] API failure → ErrorState with retry
- [ ] Program not found → "not found" message
- [ ] Empty data → EmptyState with message
- [ ] Player error → fallback chain attempted

## Monitoring Recommendations

1. **Sentry**: Install `@sentry/react-native` for crash reporting with navigation breadcrumbs
2. **LogRocket**: Session replay for debugging user issues
3. **Supabase Logs**: Monitor Realtime connection health
4. **EAS Metadata**: Track build versions and crash-free rates

## Future Enhancements

- Offline downloads (via `expo-file-system` + `public.downloads` table)
- Live stream support (currently VOD-first; add `isLive` flag)
- Background playback with `react-native-track-player` (for audio episodes)
- Push notifications for live events (`expo-notifications`)
- Watch progress syncing (`watch_progress` table — same as web)
- Apple TV / Android TV support (via `react-native-tvos`)
