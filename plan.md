# StoryStack - Story Hosting Platform Plan

## Key Features for a Story Hosting Service

### 1. Search & Discovery
**Critical needs:**

- **Robust, reliable search** — Wattpad's broken search is universally criticised. Users recommend bypassing it entirely for Google
- **Full-text search** with ability to search story content, not just titles/tags
- **Advanced filters** — word count ranges, completion status, update frequency, rating, language
- **Negative/exclusion filters** — "show me X but NOT Y" (AO3 does this reasonably well)
- **Saved searches / search alerts** — notify when new content matches criteria
- **"Similar to this" recommendations** — Royal Road has basic version, could be improved
- **Reading history** — Wattpad notably lacks this, frustrating users who lose track of stories

### 2. Tagging & Categorisation
**Balance between flexibility and usability:**

- **Structured tags with synonyms** — AO3's "curated folksonomy" approach where "kid!Loki", "kid loki", "bb!Loki" all resolve to one canonical tag
- **Tag limits** — prevent over-tagging (AO3 capped at 75 after abuse)
- **Separate tag types** — distinguish content warnings, tropes, characters, relationships, themes
- **Author-defined vs system tags** — let authors use custom tags while maintaining searchable canonical ones
- **Content warnings that are enforceable** — clear distinction between archive warnings and optional tags

### 3. Reading Experience
**Reader-focused features:**

- Offline reading / downloads — multiple formats (EPUB, PDF, HTML)
- Reading position sync across devices
- Customisable reader — fonts, themes, dark mode, line spacing
- Chapter bookmarking within stories
- Text-to-speech support
- "Mark as read" and progress tracking
- Library organisation — folders, shelves, custom lists
- Story notifications — new chapters, completed status

### 4. Author Tools
**Writing & publishing:**

- Flexible rich text editor with markdown support — RR is best for writing with formats
- Scheduled publishing — queue chapters in advance
- Draft management and version history
- Import from other platforms
- Export/backup tools — portability of your own content
- Find and replace across entire works
- Co-author support
- Author notes (beginning/end of chapters)

**Analytics:**

- Detailed analytics for tracking reader engagement
- Reading time per chapter, drop-off points
- Geographic/demographic data (anonymised)
- Referral sources

### 5. Community & Engagement
**Interaction features:**

- Comments system — inline/paragraph comments AND chapter-end comments
- Reviews vs comments distinction — reviews are public assessments, comments are conversation
- A proper rating system, reviews, more discovery features, forums
- Kudos/likes with granularity (AO3 has one kudos per user per work — some want per-chapter)
- Beta reader tools — invite-only early access, annotation features
- Author-reader messaging without exposing personal details
- Forums or community spaces — Royal Road forums praised as differentiator
- Reading lists shareable publicly

### 6. Content Moderation & Safety
**Balanced approach:**

- Submissions have to be approved, which would stop about 90% of abuse
- Age verification for mature content that actually works
- Content ratings that are enforced and accurate
- Block/mute users effectively
- Report tools with actual follow-up
- "Orphan" works feature — disassociate from account while preserving content (AO3 feature)
- Pseudonym support — multiple pen names on one account

### 7. Monetisation Options
**Flexible revenue models:**

- Patreon/Ko-fi integration — many successful authors monetize through Patreon, tips, or donations
- Tip jar / one-time donations
- Early access tiers — paid chapters in advance, free catch-up
- Subscription model option (like Wattpad Paid Stories)
- No predatory contracts — avoid locking authors into exclusivity
- Transparent revenue split if platform takes a cut

### 8. Platform Reliability
**Technical stability:**

- No ads or minimal, non-intrusive ads
- Fast, reliable uptime
- Email notifications that actually work
- Mobile app that functions properly
- API access for third-party tools
- Content preservation — stories shouldn't vanish without warning

### 9. Cross-Platform & Portability
**Data ownership:**

- Export all your content easily
- Import from common formats
- Canonical URLs that don't break
- RSS feeds for stories
- Embeddable widgets for personal sites

### 10. Genre Flexibility
**Avoiding niche lock-in:**

- Royal Road is Fantasy genre-specialist, Wattpad is Romance genre-specialist
- A platform should support diverse genres without algorithmic bias toward one type
- Clear gap in market for "AO3 for original fiction"

---

## Technical Stack

### 1. Frontend
**Primary: Next.js 16+ (React 19)**

- Server Components for fast initial page loads (critical for reading experience)
- App Router with streaming for progressive loading of long chapters
- Built-in image optimisation for cover art
- React Compiler (v1.0 October 2025) — no more manual useMemo, useCallback, React.memo

**State Management:**
- Zustand for global UI state (reading preferences, theme)
- TanStack Query for server state and caching

**Styling:**
- Tailwind CSS — utilities with native CSS features
- CSS custom properties for reader customisation (font size, line height, theme)

### 2. Backend
**Primary: Node.js with NestJS**

- TypeScript end-to-end consistency with frontend
- Modular architecture suits the feature set (stories, users, comments, payments)
- Strong ecosystem for auth, validation, queue workers

**API Design:**
- REST for most CRUD operations
- GraphQL (optional) for complex filtering/queries on stories
- WebSockets (via Socket.io or native) for real-time notifications, comments, reading sync

### 3. Database
**Primary: PostgreSQL**

- Stories have clear relational structure (users → stories → chapters → comments → tags)
- Complex queries needed for search filters, recommendations, analytics
- JSONB columns for flexible metadata (reading preferences, custom tags)
- PgVector 0.7 for semantic search & AI agents — useful for "similar stories" recommendations

**ORM:** Prisma or Drizzle

**Caching Layer: Redis**
- Session storage
- Rate limiting
- Reading progress cache
- Real-time features (online users, notifications)

**File Storage:**
- Story content: PostgreSQL (text is relational data)
- Cover images/media: S3-compatible (AWS S3, Cloudflare R2, or Backblaze B2)

### 4. Search Engine
**Recommended: Meilisearch or Typesense**

| Aspect | Meilisearch | Typesense |
|--------|-------------|-----------|
| Setup | Easiest | Easy |
| Speed | Excellent | Excellent |
| Typo tolerance | Built-in | Built-in |
| Faceted search | Yes | Yes |
| Self-hosted cost | Free | Free |
| Managed cloud | Available | Available |

**Search index structure:**
- Stories (title, description, author, tags, word count, rating)
- Authors (username, bio)
- Tags (with synonyms — key for the tagging system)

### 5. Tagging System Architecture

```sql
-- Tables
tags (id, canonical_name, type: enum[fandom|character|relationship|additional])
tag_synonyms (id, tag_id, synonym_name)
tag_relationships (parent_tag_id, child_tag_id, relationship_type)
story_tags (story_id, tag_id, added_by_author: boolean)
```

**Key features:**
- Canonical tags appear in autocomplete and filters
- Synonyms automatically resolve (e.g., "kid!Loki" → "Kid Loki")
- Metatags for hierarchical organisation
- Background job to sync tags to search engine

### 6. Infrastructure & Deployment

| Option | Pros | Cons |
|--------|------|------|
| Vercel | Zero-config Next.js, edge functions | Limited backend flexibility |
| Railway/Render | Easy, affordable, good DX | Less control at scale |
| Fly.io | Global distribution, containers | More setup |
| AWS/GCP | Maximum control | Complexity, cost management |

**Recommended starting point:**
- Vercel for frontend
- Railway or Render for backend + database
- Cloudflare R2 for file storage (S3-compatible, no egress fees)

### 7. Additional Services

| Need | Service |
|------|---------|
| Authentication | Clerk, Auth.js (NextAuth), or Lucia |
| Payments | Stripe (subscriptions, tips) |
| Email | Resend, Postmark, or Amazon SES |
| CDN | Cloudflare (free tier is excellent) |
| Monitoring | Sentry (errors), Posthog (analytics) |
| Background Jobs | BullMQ (Redis-based), or Trigger.dev |
| Real-time | Socket.io, Pusher, or Ably |

### 8. Complete Stack Summary

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│  Next.js 16 + React 19 + TanStack Query + Tailwind CSS     │
├─────────────────────────────────────────────────────────────┤
│                         BACKEND                             │
│  NestJS + TypeScript + Prisma/Drizzle                      │
├─────────────────────────────────────────────────────────────┤
│                        DATABASE                             │
│  PostgreSQL + PgVector + Redis                             │
├─────────────────────────────────────────────────────────────┤
│                         SEARCH                              │
│  Meilisearch or Typesense                                  │
├─────────────────────────────────────────────────────────────┤
│                        STORAGE                              │
│  Cloudflare R2 / AWS S3                                    │
├─────────────────────────────────────────────────────────────┤
│                        SERVICES                             │
│  Stripe (payments) + Resend (email)                        │
└─────────────────────────────────────────────────────────────┘
```

### 9. Cost Estimate (Starting Out)

| Service | Monthly Cost |
|---------|--------------|
| Vercel (Pro) | $20 |
| Railway (backend + Postgres) | $20-50 |
| Meilisearch Cloud (Starter) | $30 |
| Cloudflare R2 | ~$5 (usage-based) |
| Redis (Upstash) | Free tier → $10 |
| Domain + misc | $20 |
| **Total** | **~$100-130/month** |

This scales well until you hit significant traffic (10k+ daily users).

---

## Development Priorities

### Phase 1 (MVP) - COMPLETE
- [x] User auth + profiles
- [x] Story/chapter CRUD
- [x] Basic tagging (no synonyms yet)
- [x] Search integration
- [x] Reading experience (progress tracking, basic customisation)

### Phase 2 - COMPLETE
- [x] Tag synonym system
- [x] Comments
- [x] Follows/notifications
- [x] Reading lists/library

### Phase 3 - COMPLETE
- [x] Reviews vs comments distinction
- [x] Monetisation (Stripe integration)
- [x] Analytics dashboard for authors
- [x] Advanced search filters
- [x] Meilisearch full-text search integration

### Phase 4 (In Progress)
- [x] Customizable reader (fonts, themes, dark mode)
- [x] EPUB/PDF export
- [x] Scheduled chapter publishing
- [x] Rich text editor (TipTap)
- [x] Story import/export
- [x] Co-author support
- [x] Inline paragraph comments
- [x] Block/mute and report system
- [x] Email notifications (Resend)
- [x] Reading history tracking
