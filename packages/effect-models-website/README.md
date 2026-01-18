# effect-models-website

Web application for managing and interacting with LLM models via effect-models.

## Overview

This is a private application package (not publishable) that provides a web interface and API for the effect-models library.

## Features

- HTTP server for API endpoints
- Database integration for model management
- Middleware for authentication and logging
- CLI scripts for database management

## Development

### Prerequisites

- Bun 1.1.33+
- Node.js 18.18+
- PostgreSQL (for database)

### Setup

```bash
# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
bun run db:migrate
```

### Running

```bash
# Development server
bun run dev

# Run tests
bun run test

# Type check
bun run typecheck

# Lint
bun run lint
```

## Database

This application uses Drizzle ORM with PostgreSQL.

```bash
# Generate migrations
bun run db:generate

# Run migrations
bun run db:migrate

# Open Drizzle Studio
bun run db:studio
```

## License

MIT
