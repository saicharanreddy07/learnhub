# LearnHub

A personal learning tracker and knowledge base built with React, FastAPI, PostgreSQL, Docker Compose and GoCD.

## Run locally with Docker

Requirements: Docker Desktop with Linux containers enabled.

```powershell
docker compose up --build -d
```

Open:
- App: http://localhost:3000
- API docs: http://localhost:8000/docs (backend is not published to host by default; use the optional port mapping below)
- Health through frontend: http://localhost:3000/health

To access FastAPI docs directly, temporarily add this to the backend service in docker-compose.yml:

```yaml
ports:
  - "8000:8000"
```

Then recreate:

```powershell
docker compose up --build -d
```

## Useful commands

```powershell
docker compose ps
docker compose logs -f
docker compose logs -f backend
docker compose down
```

Database data persists in the `learnhub_data` named volume. `docker compose down -v` deletes that volume and its data.

## Current MVP

- Create and search learning topics
- Add and complete lessons
- Save and delete notes
- Save learning resources
- Automatically calculate topic and overall progress

This is a local learning project, not a production-hardened service. Add authentication, proper secret management, migrations and automated tests before exposing it to a network.
