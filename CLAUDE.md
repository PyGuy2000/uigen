# uigen

AI-powered UI component generator. Users describe components in natural language via a chat interface, and an LLM generates React/JSX code with live preview.

## Tech Stack

- **Framework**: Next.js 15 (App Router, Turbopack)
- **Language**: TypeScript (strict mode)
- **UI**: shadcn/ui (new-york style), Radix primitives, Tailwind CSS v4, Lucide icons
- **AI**: Vercel AI SDK (`ai`) + `@ai-sdk/anthropic`, model: `claude-haiku-4-5`
- **Database**: SQLite via Prisma ORM (generated client at `src/generated/prisma`)
- **Auth**: Custom JWT auth using `jose` + `bcrypt`
- **Editor**: Monaco Editor (`@monaco-editor/react`)
- **Testing**: Vitest + Testing Library (jsdom environment)

## Project Structure

```
src/
  app/                    # Next.js App Router pages and API routes
    api/chat/route.ts     # Main AI chat endpoint (streaming)
    [projectId]/page.tsx  # Project workspace page
  components/
    ui/                   # shadcn/ui primitives
    chat/                 # Chat interface components
    auth/                 # Auth dialog, sign-in/up forms
    editor/               # Code editor, file tree
    preview/              # Live preview iframe
  lib/
    tools/                # AI tool definitions (str-replace, file-manager)
    contexts/             # React contexts (chat, file-system)
    transform/            # JSX transformer (Babel standalone)
    prompts/              # System prompts for generation
    provider.ts           # LLM provider (Anthropic or mock fallback)
    file-system.ts        # Virtual file system implementation
    auth.ts               # JWT session management
    prisma.ts             # Prisma client singleton
  actions/                # Server actions (create/get projects)
  hooks/                  # Custom React hooks
prisma/
  schema.prisma           # DB schema (User, Project models)
  dev.db                  # SQLite dev database
```

## Commands

```bash
npm run dev              # Start dev server (Turbopack)
npm run dev:daemon       # Start dev server in background (logs to logs.txt)
npm run build            # Production build
npm run lint             # ESLint
npm run test             # Vitest (all tests)
npx vitest run <file>    # Run specific test file
npm run setup            # Install deps + generate Prisma client + run migrations
npm run db:reset         # Reset database (destructive)
```

## Key Patterns

- **Path alias**: `@/*` maps to `./src/*`
- **Mock provider**: When `ANTHROPIC_API_KEY` is not set, a `MockLanguageModel` provides static responses for development without API costs
- **Virtual file system**: Generated code lives in an in-memory VFS (`VirtualFileSystem` class), serialized as JSON in the Project `data` column
- **Messages storage**: Chat messages stored as JSON string in Project `messages` column
- **Prisma client output**: Generated to `src/generated/prisma` (not default location)
- **Node compat**: Dev/build/start scripts use `--require ./node-compat.cjs` for compatibility shims

## Environment Variables

- `ANTHROPIC_API_KEY` — Required for real AI generation; without it, mock provider is used
