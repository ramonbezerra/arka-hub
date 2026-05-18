# Arka Hub Agent Guide

## Purpose
This repository contains a React frontend and Flask backend for the Arka Hub application. Use this file to quickly understand the development entrypoints, directory layout, and conventions.

## Project layout
- `backend/` - Python Flask backend
  - `app.py` - main Flask application and blueprint registration
  - `models.py` - SQLAlchemy models and database definitions
  - `api/` - REST blueprint handlers for users and members
  - `auth/routes.py` - authentication routes and JWT flows
  - `instance/migrations/` - Alembic migration files
  - `requirements.txt` - Python dependencies
- `frontend/` - React frontend
  - `package.json` - npm scripts and dependencies
  - `src/` - React app source files
  - `public/` - static HTML shell

## Key conventions
- Backend uses Flask blueprints and SQLAlchemy. Keep backend API work inside `backend/api/` and `backend/auth/` unless adding a new blueprint.
- `backend/app.py` currently contains configuration values; avoid adding production secrets directly there. Prefer moving config to `backend/config.py` if you add new settings.
- Frontend is built with `react-scripts` and React Router v6.
- Authentication uses JWT access and refresh tokens, with username identity in JWT claims.

## How to run
### Backend
- from repository root: `cd backend`
- create/activate a Python venv
- install dependencies: `pip install -r requirements.txt`
- run migrations for database: `flask db init; flask db migrate -m "message"; flask db upgrade`
- run: `python app.py`

### Frontend
- from repository root: `cd frontend`
- install dependencies: `npm install`
- run: `npm start`
- run tests: `npm test` (watch) or `npm run test:ci` (single run with coverage)
- optional API base URL: set `REACT_APP_API_URL` (defaults to `http://localhost:5000`)

## Notes for AI agents
- `README.md` is business/user-story documentation, not implementation instructions.
- Backend tests live under `backend/tests/` (pytest). Frontend tests use Jest via `react-scripts` under `frontend/src/**/__tests__/`.
- Be careful with hardcoded secrets and database URI in `backend/app.py`.
- Do not use `react-scripts eject` unless there is no other way to implement the change.
- If adding backend configuration, prefer `backend/config.py` rather than increasing hardcoded values in `app.py`.
