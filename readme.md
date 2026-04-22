# DevOpsConnect Monorepo

This repository contains the full-stack DevOpsConnect application, organized as a monorepo with separate folders for backend, frontend, and infrastructure services.

## Project Structure

- `backend/` — Node.js/Express API (PostgreSQL, Redis, RabbitMQ, AWS S3)
- `frontend/` — Next.js/React client
- `rabbitMq/` — Docker setup for RabbitMQ
- `reddis/` — Docker setup for Redis

## Quick Start

1. **Clone the repository:**
	```bash
	git clone <repo-url>
	cd "DevOpsConnect application with different Architectures"
	```

2. **Setup Backend:**
	```bash
	cd backend
	cp .env.example .env
	npm install
	npm run dev
	```

3. **Setup Frontend:**
	```bash
	cd ../frontend
	cp .env.example .env
	npm install
	npm run dev
	```

4. **(Optional) Run Redis and RabbitMQ with Docker:**
	```bash
	cd ../reddis
	docker build -t devopsconnect-redis .
	docker run -d --name redis -p 6379:6379 devopsconnect-redis

	cd ../rabbitMq
	docker build -t devopsconnect-rabbitmq .
	docker run -d --name rabbitmq \
	  -e RABBITMQ_DEFAULT_USER=admin \
	  -e RABBITMQ_DEFAULT_PASS=adminpassword \
	  -p 5672:5672 -p 15672:15672 devopsconnect-rabbitmq
	```

## Environment Variables

Each folder contains a `.env.example` file. Copy it to `.env` and fill in your values. **Do not commit `.env` files.**

## Production

- Build frontend: `npm run build` in `frontend/`
- Start backend: `npm start` in `backend/`
- Start frontend: `npm start` in `frontend/`

---

For more details, see the `README.md` in each folder.
