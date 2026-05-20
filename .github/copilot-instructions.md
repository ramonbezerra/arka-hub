# Copilot Instructions for Arka Hub

Use `AGENTS.md` as the primary project guide. This repository has a Python Flask backend and a React frontend.

## What to focus on
- Backend work belongs in `backend/`; frontend work belongs in `frontend/`.
- Avoid adding production secrets directly to `backend/app.py`.
- Prefer `backend/config.py` for new backend configuration.
- Do not assume a test suite exists; add tests only when explicitly requested.

## Local run commands
- Backend: `cd backend && pip install -r requirements.txt && python app.py`
- Frontend: `cd frontend && npm install && npm start`

## Important rules
- Do not use `react-scripts eject` unless required by a specific frontend task.
- Treat `README.md` as product/user-story documentation, not implementation guidance.
- Keep instructions concise, clean, and avoid bad practices.
