# SkyPulse Backend

TypeScript/Express rewrite of the original Flask app in [original/](/home/akirus/backend-engineer-assigment/original).

## Repository Layout

- `original/`: original Python implementation, kept unchanged
- `src/`: Node.js/TypeScript rewrite
- `terraform/`: infrastructure files plus an ECS example in `terraform/ECS-Example/`
- `Dockerfile`
- `docker-compose.yml`
- `README.md`

## Requirements

- Node.js 18+
- npm
- Docker and Docker Compose plugin for containerized runs
- For the deploy script: `ssh`, `scp`, `tar`, and Docker on the target host

## Local Run

1. Install dependencies:

```bash
npm install
```

2. Create an env file:

```bash
cp .env.sample .env
```

3. Set at least:

```bash
ANALYTICS_API_KEY=your-local-value
```

You can take it from the original project.

4. Start the app:

```bash
npm start
```

The app listens on `http://localhost:3000`.

By default, the SQLite database path is `./skypulse.db`.

## Environment Variables

Required:

- `ANALYTICS_API_KEY`

Optional:

- `ANALYTICS_ENDPOINT`
- `PORT`
- `UPSTREAM_TIMEOUT_MS`
- `WEATHER_CACHE_TTL_MS`
- `WEATHER_CACHE_MAX_SIZE`
- `DB_PATH`

## Useful Commands

Run tests:

```bash
npm test
```

Build only:

```bash
npm run build
```

## Docker

Run locally with Docker Compose:

```bash
docker compose up --build
```

The service is exposed on `http://localhost:3000`.

The SQLite database is mounted at `/data/skypulse.db` inside the container.

## Health Endpoints

- `GET /health/live`
- `GET /health/ready`

## Main Differences From Original

- Refactored from a single Flask file into a small TypeScript/Express structure
- `/api/v1/locations` supports pagination
- `/api/v1/locations` supports optional `user_id` filtering
- `/api/v1/locations` returns structured locations with `location_id`, `lat`, and `lon`
- `/api/v1/activity-score` includes matched user preferences in the response
- `/api/v1/activity-score` recommendation text can use user preferences when `user_id` is provided
- Added upstream request timeout handling
- Added a bounded in-memory cache with TTL invalidation for weather and air-quality lookups
- Added DB indexes for `location_id` and `(user_id, location_id)`
- Analytics failures no longer fail the main request
- Added health endpoints
- Moved secrets out of code and into environment variables

## What I Would Change For Real Production

- Move from SQLite to Postgres
- Add explicit DB migrations instead of startup-time schema bootstrap
- Add observability: metrics, tracing, alerts, and log aggregation
- Add load testing against realistic data volume
- Add stronger upstream resilience: retries, circuit breaking, and degraded-mode handling
- Replace process-local cache with a shared cache (e.g. Redis) if traffic patterns justify it
- Derive `user_id` from authentication rather than query params

## Deploy

Deployment is handled by [deploy.sh](/home/akirus/backend-engineer-assigment/deploy.sh).

It uploads the application files to a remote machine, writes a remote `.env` file containing `ANALYTICS_API_KEY`, and runs:

```bash
docker compose up --build -d
```

### Deploy Script Behavior

1. Resolves the SSH key
2. Resolves the target host
3. Ensures `/opt/skypulse` and `/opt/skypulse/data` exist
4. Reuses `/opt/skypulse/data/skypulse.db` if present
5. Uploads the DB if the remote DB is missing
6. Uploads application files for a remote Docker build
7. Writes `/opt/skypulse/.env`
8. Rebuilds and restarts the containers with Docker Compose

### Example Deploy Commands

Use an explicit host:

```bash
ANALYTICS_API_KEY=your-real-key INSTANCE_IP=203.0.113.10 DB_FILE_PATH=./skypulse.db ./deploy.sh
```

Use a custom SSH key:

```bash
ANALYTICS_API_KEY=your-real-key SSH_KEY_PATH=~/.ssh/my_key INSTANCE_IP=203.0.113.10 DB_FILE_PATH=./skypulse.db ./deploy.sh
```

Use Terraform output for the host:

```bash
ANALYTICS_API_KEY=your-real-key DB_FILE_PATH=./skypulse.db ./deploy.sh
```

## Production Direction

For a real production deployment, I would run the container on AWS ECS, either on EC2-backed capacity or on Fargate, behind an AWS ALB. That raises cost compared with a single-host deployment, but improves availability, health-checking, rollout safety, and scaling.

I would also replace `deploy.sh` with CI/CD such as GitHub Actions or GitLab CI, with managed secrets, image publishing, automated deployment, and approval gates.


## AI Tools Used:
ChatGPT
Codex
