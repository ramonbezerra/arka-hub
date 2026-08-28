FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    FLASK_CONFIG=production

WORKDIR /app

# System deps for psycopg2
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

# On startup: run migrations (if alembic is initialized), then init-db
# (creates tables when no migrations exist + seeds admin), then gunicorn.
CMD ["sh", "-c", "test -f migrations/env.py && flask db upgrade; flask init-db; gunicorn --bind 0.0.0.0:5000 app:app"]
