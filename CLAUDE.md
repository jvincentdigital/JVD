# CLAUDE.md

## Project Overview

John Vincent Digital — a professional service website for an AI-powered web design studio based in Puerto Rico. Single-page Next.js 14 site with bilingual EN/ES support via next-intl, deployed on Vercel. Sections: Nav, Hero, TrustBar, Services, Work, Pricing ("How we work"), About, Contact, Footer.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with custom theme (cream/charcoal/green palette)
- **i18n:** next-intl (EN/ES, URL-based locale routing via `[locale]` segment)
- **Fonts:** Fraunces (serif headings), Plus Jakarta Sans (body) via next/font/google
- **Deployment:** Vercel (auto-deploy on push to main)
- **Contact:** mailto-based form (no backend)

## Commands

All operations go through the `Makefile` — the single entry point for build, run, test, and deploy. Run `make help` for the full list.

```bash
make build
make test
make run
make deploy TARGET=prod
make logs TARGET=prod
make status
```

Complex commands that need real bash logic live in `scripts/` and are called from Makefile targets.

## Project Structure

```
app/
  layout.tsx              # Root passthrough layout
  globals.css             # Tailwind imports + smooth scroll
  [locale]/
    layout.tsx            # Locale layout (fonts, i18n provider)
    page.tsx              # Single-page composition of all sections
components/               # One component per section
  Nav.tsx                 # Sticky nav, mobile hamburger, active section tracking
  Hero.tsx                # Headline, subheadline, CTAs
  TrustBar.tsx            # 4 outcome-focused stats
  Services.tsx            # 4 service cards (2x2 grid)
  Work.tsx                # 4 project cards with challenge blocks
  Pricing.tsx             # "How we work" — outcome paragraphs + covered lists
  About.tsx               # Bio + stats
  Contact.tsx             # Form (mailto action)
  Footer.tsx              # Location, GitHub, copyright
  ScrollReveal.tsx        # IntersectionObserver fade-in wrapper
i18n/
  request.ts              # Server-side i18n config
messages/
  en.json                 # English translations
  es.json                 # Spanish translations
middleware.ts             # Locale routing middleware
docs/                     # Living documentation
Makefile                  # Project operations — single entry point
scripts/                  # Complex build/deploy scripts
TODO.md                   # Task tracking
.claude/
  skills/                 # Claude skills
```

## Architecture

Single-page scrolling site. All sections are React components composed in `app/[locale]/page.tsx`. The `[locale]` dynamic segment powers bilingual routing — `middleware.ts` redirects `/` to `/en`. All translatable copy lives in `messages/*.json`. Client components (Nav, Contact, ScrollReveal) use hooks; everything else is server-rendered.

## Key Workflows

### Docs

The `docs/` folder is the single source of truth for institutional knowledge.

**For AI agents:** Before starting work on an unfamiliar area, check `docs/` for existing context. When you learn something significant during a task — integration quirks, architectural decisions, incident learnings — write it up or update an existing doc. Don't wait to be asked.

- Markdown files organized by topic — one topic per file
- Write as if explaining to a new team member who may be an AI agent

### TODO

`TODO.md` is a lightweight task tracker for human/AI collaboration.

**For AI agents:** Mark items `[~]` (pending) before starting so parallel agents don't collide. Mark `[x]` when done. Start from the top unless told otherwise.

### Skills

`.claude/skills/` teaches Claude project-specific conventions and provides reusable workflows as slash commands. See `docs/vibestack.md` for how to create new ones.

**Reference skills** (auto-loaded as context):

- `cli-first` — Use CLI tools and `.env*` files for third-party services
- `lsp` — Use language servers for type checking, references, and code navigation

**Task skills** (invoked via `/command`):

- `/vibestack` — Set up VibeStack conventions for an existing project (CLAUDE.md, Makefile, docs, TODO.md)
- `/docs` — Capture conversation learnings into docs and clean up stale content
- `/todo` — Work through TODO.md tasks sequentially (`/todo populate` to re-analyze the codebase and seed the next batch of tasks)
- `/squad` — Analyze the project and generate domain-specific rules and specialist subagents (`/squad refresh` to update)

**Staged skills** (lab; in `docs/skills/`, copy into `.claude/skills/` to enable):

- `design-polish` — Audit / polish / redesign pass with floor, reflex and finish tiers. Backed by `make design-lint` (`scripts/design/lint.mjs`).
- `diagram` — JSON spec to an offline HTML/SVG diagram in JVD colours. `make diagrams` renders `docs/diagrams/*.json`; `make design-test` self-tests both tools.

## External Services

- **Vercel** — Hosting and deployment. Auto-deploys from GitHub on push to `main`. Project: `john-vincent-digital`.
- **Google Fonts** — Fraunces + Plus Jakarta Sans loaded via `next/font/google`.
- **Contact email** — `iamjohnvdiaz@gmail.com` (hardcoded in `components/Contact.tsx`).
- **GitHub** — Repo at `github.com/jvincentdigital/JVD`.

## Conventions

- All user-facing copy goes in `messages/en.json` and `messages/es.json` — never hardcode text in components.
- Section IDs (`services`, `work`, `pricing`, `about`, `contact`) are used for nav scroll tracking and anchor links. Don't rename without updating Nav.tsx.
- Custom Tailwind colors: `cream`, `charcoal`, `warm-gray`, `accent`, `accent-dark`, `border`, `dark`. Use these instead of raw hex values.
- Font classes: `font-serif` for headings (Fraunces), `font-sans` for body (Plus Jakarta Sans).
- Scroll animations use the `ScrollReveal` wrapper component — no external animation libraries.
- Cards use `border-border` base with `hover:border-accent hover:-translate-y-0.5` pattern.
