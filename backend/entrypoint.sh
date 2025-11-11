#!/bin/sh
set -e

echo "Starting backend bootstrap..."

echo "Running database migrations..."
until python manage.py migrate --noinput; do
    echo "Migrations failed - retrying in 3 seconds..."
    sleep 3
done

echo "Collecting static files..."
python manage.py collectstatic --noinput

RUN_SEED_VALUE="${RUN_SEED_OFFERS:-true}"
if [ -z "${RUN_SEED_VALUE}" ]; then
    RUN_SEED_VALUE="true"
fi

if [ "${RUN_SEED_VALUE}" = "true" ]; then
    echo "Seeding database with default data (can be disabled with RUN_SEED_OFFERS=false)..."
    python manage.py seed_offers || echo "Seed command failed (probably already seeded); continuing..."
fi

if [ -n "${DJANGO_SUPERUSER_USERNAME:-}" ] && \
   [ -n "${DJANGO_SUPERUSER_EMAIL:-}" ] && \
   [ -n "${DJANGO_SUPERUSER_PASSWORD:-}" ]; then
    echo "Ensuring Django superuser ${DJANGO_SUPERUSER_USERNAME} exists..."
    python manage.py createsuperuser \
        --noinput \
        --username "${DJANGO_SUPERUSER_USERNAME}" \
        --email "${DJANGO_SUPERUSER_EMAIL}" \
        || echo "Superuser already exists or creation failed; continuing..."
else
    echo "DJANGO_SUPERUSER_* variables not fully set. Skipping superuser creation."
fi

echo "Backend bootstrap complete. Launching application..."
exec "$@"
