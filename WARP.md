# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Running the Application
```bash
# Development server (runs on port 3000)
bun run dev

# Production build
bun run build

# Preview production build
bun run preview
```

### Testing & Quality
```bash
# Run tests with Vitest
bun run test

# Lint code
bun run lint

# Format code with Prettier
bun run format

# Format and lint (fix issues)
bun run check
```

### Database Management
```bash
# Generate migration files from schema changes
bunx drizzle-kit generate

# Apply migrations to database
bunx drizzle-kit migrate

# Open Drizzle Studio (database GUI)
bunx drizzle-kit studio
```

## Architecture Overview

### Tech Stack
- **Framework**: TanStack Start (React SSR framework with file-based routing)
- **Runtime**: Bun (used for package management, build, and production server)
- **Database**: PostgreSQL via Neon serverless (`@neondatabase/serverless`)
- **ORM**: Drizzle ORM with Drizzle Kit for migrations
- **Authentication**: better-auth with username plugin
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Translation**: Google Translate API (primary) with LibreTranslate fallback

### Project Structure
```
src/
├── routes/              # File-based routing (TanStack Router)
│   ├── __root.tsx      # Root layout with ThemeProvider
│   ├── index.tsx       # Home page - text input/display
│   ├── login.tsx       # Authentication page
│   ├── vocabulary.tsx  # User vocabulary management
│   └── api/            # API route handlers
│       ├── auth/       # better-auth endpoints
│       ├── translate.ts
│       ├── detect.ts
│       ├── texts.ts    # CRUD for saved texts
│       └── vocabulary.ts
├── components/          # React components
│   └── ui/             # shadcn/ui components
├── db/
│   ├── index.ts        # Drizzle DB client setup (Neon)
│   └── schema.ts       # Database schema (better-auth tables + app tables)
├── lib/                # Business logic and utilities
│   ├── auth.ts         # better-auth configuration
│   ├── auth-client.ts  # Client-side auth hooks
│   ├── translate.ts    # Translation service (Google + LibreTranslate)
│   ├── tokenizer.ts    # Text tokenization for word selection
│   ├── vocabulary.ts   # Vocabulary management logic
│   ├── saved-texts.ts  # Saved text management
│   └── theme.tsx       # Theme provider (dark/light mode)
└── hooks/              # Custom React hooks
```

### Database Schema
The database has two categories of tables:
1. **better-auth tables**: `user`, `session`, `account`, `verification` (required by authentication library)
2. **App-specific tables**: `saved_text`, `translation`, `vocabulary` (all reference `user.id` with cascade delete)

Schema is defined in `src/db/schema.ts`. After schema changes, regenerate migrations with `bunx drizzle-kit generate`.

### Routing Pattern
TanStack Router uses file-based routing. Routes are defined in `src/routes/` and auto-generated route tree is at `src/routeTree.gen.ts`.
- Page routes: `src/routes/*.tsx` (e.g., `index.tsx`, `login.tsx`)
- API routes: `src/routes/api/*.ts` (server-side handlers)

### Authentication Flow
- Uses better-auth with email/password and username support
- Session expires in 7 days, updates every 24 hours
- Client-side: `useSession()` hook from `@/lib/auth-client`
- Server-side: auth configured in `src/lib/auth.ts` with Drizzle adapter

### Translation System
Translation API (`src/lib/translate.ts`) tries Google Translate first, then falls back to LibreTranslate:
- Requires `GCP_TRANSLATE_API_KEY` for Google (primary)
- Falls back to `LIBRETRANSLATE_URL` and `LIBRETRANSLATE_API_KEY`
- Supports language detection and alternative translations

### Path Aliases
TypeScript path alias `@/*` maps to `src/*` (configured in `tsconfig.json` and `vite-tsconfig-paths`)

## Environment Variables
Copy `.env.example` to `.env` and configure:
- `DATABASE_URL`: PostgreSQL connection string (Neon serverless)
- `BETTER_AUTH_SECRET`: Random secret for session signing
- `BETTER_AUTH_URL`: Application URL (http://localhost:3000 in dev)
- `GCP_TRANSLATE_API_KEY`: Google Translate API key (primary translation service)
- `LIBRETRANSLATE_URL`: LibreTranslate endpoint (fallback)
- `LIBRETRANSLATE_API_KEY`: LibreTranslate API key (fallback)

## Docker
Build and run with:
```bash
docker build -t lang-ilessons .
docker run -p 3000:3000 --env-file .env lang-ilessons
```

## Important Conventions
- Use Bun for all package management and script execution
- shadcn/ui components are in `src/components/ui/` - modify these directly as they're copied into the project
- All database operations use Drizzle ORM - don't write raw SQL
- API routes return JSON and handle errors with appropriate HTTP status codes
- better-auth tables should not be modified - they're managed by the library
- Translation fallback is automatic - don't manually implement retry logic
