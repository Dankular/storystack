# StoryStack

A modern story hosting platform built with Next.js and NestJS. StoryStack provides authors with powerful tools to publish and monetize their stories, while giving readers an engaging discovery and reading experience.

## Features

### For Readers
- **Browse & Discover** - Advanced search with filters for word count, rating, status, tags
- **Full-Text Search** - Meilisearch-powered search across story content, authors, and tags
- **Customizable Reader** - Adjustable fonts, themes (light/sepia/dark), line spacing, and text width
- **Reading Lists** - Create and organize custom reading lists
- **Follow System** - Follow authors and stories for updates
- **Reviews & Ratings** - 5-star review system with rating distributions
- **Notifications** - Get notified about new chapters, comments, and follows

### For Authors
- **Story Management** - Create stories with chapters, tags, and cover images
- **Scheduled Publishing** - Queue chapters for automatic publishing at scheduled times
- **Analytics Dashboard** - Track views, engagement, follower growth, and chapter performance
- **Monetization** - Accept tips from readers via Stripe Connect
- **Comments & Reviews** - Engage with readers through comments and reviews

## Tech Stack

### Frontend (`apps/web`)
- **Next.js 15** with App Router
- **React 19** with React Compiler
- **TanStack Query** for server state
- **Zustand** for client state
- **Tailwind CSS** for styling

### Backend (`apps/api`)
- **NestJS** with TypeScript
- **Prisma** ORM
- **PostgreSQL** database
- **Meilisearch** for full-text search
- **JWT** authentication
- **Stripe** for payments

## Project Structure

```
storystack/
├── apps/
│   ├── api/                 # NestJS backend
│   │   ├── prisma/          # Database schema
│   │   └── src/
│   │       ├── auth/        # Authentication
│   │       ├── users/       # User management
│   │       ├── stories/     # Story CRUD
│   │       ├── chapters/    # Chapter management
│   │       ├── tags/        # Tagging system with synonyms
│   │       ├── comments/    # Comment system
│   │       ├── reviews/     # Review system
│   │       ├── follows/     # Follow system
│   │       ├── notifications/
│   │       ├── reading-lists/
│   │       ├── monetisation/ # Stripe integration
│   │       ├── analytics/   # View tracking & stats
│   │       ├── search/      # Meilisearch integration
│   │       └── export/      # PDF/EPUB/HTML export
│   │
│   └── web/                 # Next.js frontend
│       └── src/
│           ├── app/         # App Router pages
│           ├── components/  # React components
│           ├── lib/         # API client
│           └── stores/      # Zustand stores
│
└── package.json             # Monorepo root
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Stripe account (for monetization)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/storystack.git
cd storystack
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

**API** (`apps/api/.env`):
```env
DATABASE_URL="postgresql://user:password@localhost:5432/storystack"
JWT_SECRET="your-jwt-secret"
STRIPE_SECRET_KEY="sk_test_..."
MEILISEARCH_HOST="http://localhost:7700"
MEILISEARCH_API_KEY="your-meilisearch-key"
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@yourdomain.com"
APP_URL="https://yourdomain.com"
```

**Web** (`apps/web/.env.local`):
```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
```

4. Set up the database:
```bash
cd apps/api
npx prisma migrate dev
```

5. Start development servers:
```bash
# Terminal 1 - API
cd apps/api
npm run dev

# Terminal 2 - Web
cd apps/web
npm run dev
```

The API runs on `http://localhost:3001` and the web app on `http://localhost:3000`.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Stories
- `GET /api/stories` - List stories (with advanced filters)
- `GET /api/stories/:id` - Get story details
- `POST /api/stories` - Create story
- `PUT /api/stories/:id` - Update story
- `DELETE /api/stories/:id` - Delete story
- `GET /api/stories/:id/similar` - Get similar stories

### Chapters
- `GET /api/stories/:storyId/chapters` - List chapters
- `GET /api/stories/:storyId/chapters/:id` - Get chapter
- `POST /api/stories/:storyId/chapters` - Create chapter (supports scheduledPublishAt)
- `PUT /api/stories/:storyId/chapters/:id` - Update chapter
- `GET /api/me/scheduled-chapters` - Get all scheduled chapters (auth)

### Reviews
- `GET /api/reviews/story/:storyId` - Get story reviews
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### Analytics
- `GET /api/analytics/dashboard` - Author dashboard stats
- `GET /api/analytics/stories/:storyId` - Story analytics
- `POST /api/analytics/views/story` - Record story view

### Monetization
- `POST /api/monetisation/connect` - Create Stripe Connect link
- `GET /api/monetisation/connect/status` - Check onboarding status
- `POST /api/monetisation/tips` - Create tip payment
- `GET /api/monetisation/tips/stats` - Get tip statistics

### Search (Meilisearch)
- `GET /api/search/status` - Check if Meilisearch is enabled
- `GET /api/search/stories` - Full-text search stories with filters
- `GET /api/search/users` - Search users/authors
- `GET /api/search/tags` - Search tags with synonyms
- `GET /api/search/all` - Global search across all content
- `GET /api/search/saved` - Get saved searches (auth)
- `POST /api/search/saved` - Create saved search (auth)
- `POST /api/search/reindex` - Trigger full reindex (admin)

### Export
- `GET /api/export/stories/:id/pdf` - Download story as PDF
- `GET /api/export/stories/:id/epub` - Download story as EPUB
- `GET /api/export/stories/:id/html` - Download story as HTML

### Reading History
- `GET /api/reading-history` - Get reading history (auth)
- `GET /api/reading-history/continue` - Get continue reading list (auth)
- `GET /api/reading-history/stories/:storyId` - Get progress for story (auth)
- `POST /api/reading-history/stories/:storyId/chapters/:chapterId` - Update progress (auth)
- `DELETE /api/reading-history/stories/:storyId` - Remove from history (auth)

### Moderation
- `POST /api/users/:userId/block` - Block a user (auth)
- `DELETE /api/users/:userId/block` - Unblock a user (auth)
- `GET /api/me/blocked-users` - Get blocked users list (auth)
- `POST /api/reports` - Create a report (auth)
- `GET /api/me/reports` - Get my submitted reports (auth)

### Import/Export
- `GET /api/import-export/stories/:storyId` - Export story as JSON (auth)
- `POST /api/import-export/import/json` - Import story from JSON (auth)
- `POST /api/import-export/import/text` - Import story from plain text (auth)
- `POST /api/import-export/import/story` - Import story with structured data (auth)

### Collaborators
- `GET /api/collaborators/my-collaborations` - Get stories I'm collaborating on (auth)
- `GET /api/collaborators/invitations` - Get my pending invitations (auth)
- `POST /api/collaborators/invitations/:invitationId/respond` - Accept/decline invitation (auth)
- `GET /api/collaborators/stories/:storyId` - Get story collaborators (auth)
- `POST /api/collaborators/stories/:storyId/invite` - Invite collaborator (auth)
- `GET /api/collaborators/stories/:storyId/invitations` - Get sent invitations (auth)
- `DELETE /api/collaborators/invitations/:invitationId` - Cancel invitation (auth)
- `PUT /api/collaborators/stories/:storyId/collaborators/:collaboratorId` - Update collaborator role (auth)
- `DELETE /api/collaborators/stories/:storyId/collaborators/:collaboratorId` - Remove collaborator (auth)

### Inline Comments
- `GET /api/inline-comments/chapters/:chapterId` - Get inline comments for chapter
- `GET /api/inline-comments/:commentId` - Get comment thread
- `POST /api/inline-comments/chapters/:chapterId` - Create inline comment (auth)
- `PUT /api/inline-comments/:commentId` - Update comment (auth)
- `DELETE /api/inline-comments/:commentId` - Delete comment (auth)
- `PUT /api/inline-comments/:commentId/resolve` - Resolve/unresolve comment (auth)

## Database Schema

Key models:
- **User** - Authors and readers
- **Story** - Stories with metadata, tags, stats
- **Chapter** - Story chapters with content
- **Tag** - Canonical tags with synonyms
- **Comment** - Nested comments on stories/chapters
- **Review** - Star ratings and reviews
- **UserFollow** / **StoryFollow** - Follow relationships
- **ReadingList** - Custom reading lists
- **Notification** - User notifications
- **AuthorProfile** / **Tip** - Monetization
- **StoryView** / **ChapterView** - Analytics
- **SavedSearch** - Saved search configurations
- **UserBlock** / **Report** - Moderation

## Development

### Build
```bash
# Build API
cd apps/api && npm run build

# Build Web
cd apps/web && npm run build
```

### Database Migrations
```bash
cd apps/api
npx prisma migrate dev --name description
npx prisma generate
```

## Roadmap

### Completed
- [x] User authentication & profiles
- [x] Story/chapter CRUD
- [x] Tagging system with synonyms
- [x] Comments & reviews
- [x] Follow system & notifications
- [x] Reading lists
- [x] Stripe monetization
- [x] Analytics dashboard
- [x] Advanced search filters
- [x] Meilisearch full-text search
- [x] Customizable reader (themes, fonts, spacing)
- [x] EPUB/PDF/HTML export
- [x] Scheduled chapter publishing
- [x] Rich text editor (TipTap)
- [x] Reading history tracking
- [x] Block/mute and report system
- [x] Story import/export

### Completed (Phase 4)
- [x] Co-author support

### Completed (Phase 4 continued)
- [x] Inline paragraph comments

### Completed (Phase 4 final)
- [x] Email notifications (Resend)

### Planned
- [ ] Mobile app

## License

MIT
