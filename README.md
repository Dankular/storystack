# StoryStack

A modern story hosting platform built with Next.js and NestJS. StoryStack provides authors with powerful tools to publish and monetize their stories, while giving readers an engaging discovery and reading experience.

## Features

### For Readers
- **Browse & Discover** - Advanced search with filters for word count, rating, status, tags
- **Reading Lists** - Create and organize custom reading lists
- **Follow System** - Follow authors and stories for updates
- **Reviews & Ratings** - 5-star review system with rating distributions
- **Notifications** - Get notified about new chapters, comments, and follows

### For Authors
- **Story Management** - Create stories with chapters, tags, and cover images
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
│   │       └── analytics/   # View tracking & stats
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
- `POST /api/stories/:storyId/chapters` - Create chapter
- `PUT /api/stories/:storyId/chapters/:id` - Update chapter

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

### Planned
- [ ] Meilisearch/Typesense integration
- [ ] Customizable reader (fonts, themes, dark mode)
- [ ] EPUB/PDF export
- [ ] Scheduled chapter publishing
- [ ] Rich text editor
- [ ] Email notifications
- [ ] Block/mute users
- [ ] Report system
- [ ] Mobile app

## License

MIT
