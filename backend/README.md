# DevOpsConnect Backend Template

Minimal Node.js/Express backend template for DevOpsConnect with PostgreSQL (AWS RDS) and Redis cache.

## Setup

1. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm run dev
   ```

## Core services

- PostgreSQL via `DATABASE_URL`
- Redis via `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- JWT auth with `JWT_SECRET`

## Main endpoint groups

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/users`
- `GET /api/users/:id`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`
- `POST /api/users/:id/follow`
- `POST /api/users/:id/unfollow`
- `GET /api/users/:id/followers`
- `GET /api/users/:id/following`
- `GET /api/users/:id/posts`
- `POST /api/posts`
- `GET /api/posts`
- `GET /api/posts/:id`
- `PUT /api/posts/:id`
- `DELETE /api/posts/:id`
- `POST /api/posts/:id/like`
- `POST /api/posts/:id/unlike`
- `GET /api/posts/:id/likes`
- `POST /api/posts/:id/comments`
- `GET /api/posts/:id/comments`
- `DELETE /api/comments/:id`
- `GET /api/feed`
- `GET /api/feed/followed`
- `GET /api/search/users?q=...`
- `GET /api/search/posts?q=...`
- `GET /api/notifications`

## Notes

- This is a starter template. Extend controllers with business logic and validation as needed.
- Use separate microservices later by splitting route modules into dedicated services.

## Docker setup

1. Build and run with Docker Compose:
   ```bash
   docker compose up --build
   ```

2. Backend will be available at `http://localhost:4000`.

3. Redis runs in a linked service and is reachable from the backend using `REDIS_HOST=redis`.

4. Use your AWS RDS `DATABASE_URL` in `.env` when running in Docker.
