# Amapati — Showcase Your Small Business

**Amapati** is a simple, mobile-first social media application built for local artisans, craftsmen, and small business owners to showcase their work with pictures, videos, and audio. Think of it as a clean, noise-free TikTok tailored specifically for small businesses.

---

## 1. Project Folder Structure

```
amapati/
├── public/
│   ├── apple-touch-icon.png               # iOS Safari home screen icon
│   ├── favicon.ico                        # Browser tab icon
│   ├── icon.svg                           # Brand SVG vector
│   ├── pwa-192x192.png                    # Android standard PWA icon
│   ├── pwa-512x512.png                    # Android splash screen icon
│   └── pwa-maskable-512x512.png           # Android adaptive maskable icon
├── src/
│   ├── assets/
│   │   └── images/                        # Generated domain showcase images
│   ├── components/
│   │   ├── common/
│   │   │   └── ToastContainer.tsx         # Notification toasts
│   │   ├── feed/
│   │   │   ├── AudioPlayer.tsx            # Custom audio waveform player
│   │   │   ├── DiscoverView.tsx           # Discover tab with search & category filters
│   │   │   ├── FeedView.tsx               # Following feed with infinite scroll & recommendations
│   │   │   ├── PostCard.tsx               # Showcase card with like, contact & report triggers
│   │   │   └── VideoPlayer.tsx            # Autoplay-in-view muted video player
│   │   ├── modals/
│   │   │   ├── ActivityLogModal.tsx       # Immutable append-only audit trail & JSON diff
│   │   │   ├── AuthModal.tsx              # Email / Phone SMS OTP authentication
│   │   │   ├── CreatePostModal.tsx        # Post creation with client compression & validation
│   │   │   ├── EditPostModal.tsx          # Caption edit and soft-delete confirmation
│   │   │   ├── ReportModal.tsx            # Community moderation report tool
│   │   │   ├── SettingsModal.tsx          # Security, block list, reset & logout
│   │   │   └── SupabaseConfigModal.tsx    # Live Supabase connection manager
│   │   ├── navigation/
│   │   │   ├── BottomNav.tsx              # 4-destination mobile thumb-zone navigation bar
│   │   │   └── Navbar.tsx                 # 3-zone desktop & mobile top header
│   │   ├── profile/
│   │   │   ├── EditProfileModal.tsx       # Business profile editing & private account switch
│   │   │   ├── FollowersModal.tsx         # Followers, following & "Remove follower" tool
│   │   │   └── ProfileView.tsx            # Business profile, stats, and media filter tabs
│   │   └── pwa/
│   │       ├── OfflineIndicator.tsx       # Offline connectivity banner
│   │       └── PWAInstallButton.tsx       # In-app install banner with iOS Safari guide
│   ├── context/
│   │   └── AppContext.tsx                 # Global reactive application & session state
│   ├── hooks/
│   │   ├── useOnlineStatus.ts             # Online/offline network listener
│   │   └── usePWAInstall.ts               # beforeinstallprompt PWA installation hook
│   ├── lib/
│   │   ├── media.ts                       # Client-side image compression & video/audio validation
│   │   ├── mockEngine.ts                  # Persistent local database engine mirroring Supabase
│   │   └── supabase.ts                    # Supabase JS client configuration loader
│   ├── types/
│   │   └── index.ts                       # TypeScript schemas (Profiles, Posts, Follows, Logs)
│   ├── App.tsx                            # Root application view coordinator
│   ├── index.css                          # Tailwind CSS & typography base
│   └── main.tsx                           # React 19 entry point
├── supabase/
│   ├── migrations/
│   │   └── 20260928000000_init_amapati.sql # Postgres tables, indexes, triggers & RLS policies
│   └── storage.sql                        # Storage bucket and storage RLS policies
├── index.html                             # PWA viewport, theme color & font links
├── metadata.json                          # AI Studio application metadata
├── package.json                           # App dependencies & scripts
├── tsconfig.json                          # TypeScript configuration
└── vite.config.ts                         # Vite with VitePWA & Tailwind CSS plugins
```

---

## 2. Supabase SQL Migration Files

### Table Schemas
- `profiles`: Business name, short bio, category, contact, avatar, privacy status (`is_private`), verified badge (`is_verified`), timestamps.
- `posts`: Media type (`image`, `video`, `audio`), media URL, thumbnail URL, caption, duration, soft-delete flag (`is_deleted`), timestamps.
- `comments`: Post ID, User ID, Content, timestamps. RLS ensures anyone can view comments on public posts, authors and post owners can delete comments.
- `messages`: Sender ID, Recipient ID, Content, `is_read`, timestamps. Protected by `can_send_message()` rule: **limits message sending when there is no reply in the inbox** to prevent unsolicited spam.
- `follows`: Follower ID, following ID, status (`pending`, `accepted`), timestamp.
- `blocks`: Blocker ID, blocked ID, timestamp.
- `reports`: Reporter ID, target type (`post`, `profile`), target ID, reason, status (`open`, `resolved`, `dismissed`).
- `staff_roles`: User ID, role (`admin` or `moderator`), creation metadata.
- `verification_requests`: User ID, business proof URL, trade license details, review notes and approval status.
- `activity_log`: Append-only transaction and update log with `user_id`, `action`, `entity_type`, `entity_id`, `old_data` (JSONB), and `new_data` (JSONB).

### Triggers & Functions
- `set_updated_at()`: Automatically refreshes `updated_at` on profile and post modifications.
- `log_activity_event()`: Trigger function automatically populating `activity_log` on `INSERT`, `UPDATE`, and `DELETE` for `profiles`, `posts`, `comments`, `follows`, `blocks`, and `reports`.
- `can_send_message(sender_id, recipient_id)`: Enforces inbox reply requirement before sending subsequent messages.
- `is_admin()` and `is_moderator()`: SQL security definer functions for admin access control.

### Row Level Security (RLS)
- **Profiles**: Readable by anyone unless blocked. Editable only by profile owner.
- **Posts**: Soft-deleted posts are hidden (`is_deleted = false`). Private profiles only visible to approved followers. Only owner can insert, update, or soft-delete.
- **Comments**: Public read on active posts. Comment author OR post owner can delete comments.
- **Messages**: Users can only read messages where they are sender or recipient. New messages require previous message to have a reply from the recipient.
- **Follows**: Profile owner can approve pending follow requests. Profile owner can REMOVE a follower.
- **Activity Log**: Strictly **append-only**; updates and deletes are prohibited.

---

## 3. Creating the First Admin in Supabase

To assign staff privileges for the `/admin` dashboard:

```sql
-- Replace <user_id> with the UUID of the target business/user profile:
INSERT INTO public.staff_roles (user_id, role, created_at)
VALUES ('<user_id>', 'admin', NOW())
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

In development and demo mode, the account **Amapati Staff & Trust (`user_admin`)** is pre-configured with the `admin` role and ready to review reports, manage verification badges, and inspect the immutable audit log.

---

## 3. Supabase Storage Setup

The storage bucket `media` is configured in `supabase/storage.sql`:
- **Path format**: `{user_id}/{filename}`
- **File limits**:
  - Images: Max 5 MB (`image/jpeg`, `image/png`, `image/webp`)
  - Video: Max 50 MB / 60 seconds (`video/mp4`, `video/webm`, `video/quicktime`)
  - Audio: Max 20 MB / 10 minutes (`audio/mpeg`, `audio/mp4`, `audio/ogg`, `audio/wav`, `audio/webm`)
- **RLS policies**: Public read access; write/update/delete restricted to `{user_id}` folder owner.

---

## 4. Setup Steps & Environment Variables

### Environment Variables
Configure the following in `.env` (or via the in-app **"Supabase Connection"** modal):

```env
# Optional Supabase Connection (Defaults to high-speed local engine if omitted)
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Running Locally
```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Build for production
npm run build
```

### Applying Migrations to Supabase
1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor**.
3. Copy the contents of `supabase/migrations/20260928000000_init_amapati.sql` and click **Run**.
4. Copy the contents of `supabase/storage.sql` and click **Run**.
5. Set your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Amapati's settings!

---

## 5. Key Features Implemented

1. **Authentication**: Sign up / Log in with Email or Phone (SMS OTP) with persistent session. Includes instant demo code (`123456`).
2. **Profile & Craft Showcase**: Business name, category, short bio, direct contact phone/link, avatar, and post grid with All, Videos, Photos, and Audio filters.
3. **Followers System**: Follow/unfollow, private accounts with pending request approvals, and the ability for profile owners to **remove followers** from their list.
4. **Feeds**: Home following feed (newest first) + Discover tab with instant search and artisan spotlight carousel.
5. **Rich Media Handling**:
   - Client-side image compression via HTML Canvas.
   - Autoplay muted videos in viewport with tap-to-pause and progress scrubbing.
   - Dedicated acoustic audio player with interactive waveform scrubber.
6. **Safety & Moderation**: Report posts/businesses, block users with bidirectional mutual exclusion.
7. **Activity Log**: Append-only transaction audit trail showing full JSON snapshots of previous vs new state.
8. **PWA Installability**: Install button, offline detection, and Web App Manifest.
9. **CommentSection Thread (Bottom Sheet & Side Panel)**:
   - Responsive dual UI: Bottom sheet on mobile devices, slide-over drawer panel on desktop/tablet.
   - Top / Newest sorting toggles, 1-level collapsible nested replies ("View N more replies").
   - Instant optimistic updates with automatic rollback on error.
   - Author pinning, @mentions autocomplete for artisan businesses, live 500-char counter, 5-minute edit window, and moderation soft-delete.
10. **Post View Tracking & Trending Ranking**:
    - **View Tracking**: Logged when a post is ≥ 60% visible for 1+ second continuously via `IntersectionObserver`.
    - **Rolling 24-Hour Deduplication**: Deduplicated on both client and database levels—scrolling past the same post 5 times in one session only records 1 view.
    - **Batched Client Flushes**: Views are queued and flushed in batches every 3 seconds to reduce network calls.
    - **Trending Formula**:
      $$\text{trending\_score} = \frac{\text{views}_{24h} \times 1 + \text{likes}_{24h} \times 3 + \text{comments}_{24h} \times 5 + \text{shares}_{24h} \times 8 + \text{saves}_{24h} \times 4}{(\text{hours\_since\_created} + 2)^{1.5}}$$
    - **Fresh Boost**: Posts < 2 hours receive a guaranteed minimum score ($8.5$) so new crafts surface in Discover before accumulating engagement.
    - **7-Day Cutoff**: Posts older than 7 days are excluded from Discover's trending sort.
    - **Diversity Guardrail**: No single business may occupy more than 2 of the top 20 Discover slots in one query, ensuring fair visibility for all artisans.
    - **Profile Popular Sort**: Profiles offer a "Popular" sort option ranking posts by lifetime engagement (likes + comments) rather than ephemeral trending score.
    - **In-App Acceptance Test Suite**: Test all 4 acceptance criteria directly inside Settings (`Settings > Ranking Engine & Diagnostics > Run View & Trending Tests`).
