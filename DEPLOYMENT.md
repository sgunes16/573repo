# Hive - Build Instructions

## Development Build

### Docker (Recommended)
```bash
# 1. Setup environment
cp .env.example .env
cp frontend/.env.example frontend/.env

# 2. Build & Run
docker-compose up --build

# 3. Seed Database
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py seed_offers
```

**Access:** 
- Application: http://localhost
- Frontend: http://localhost (via nginx)
- Backend API: http://localhost/api (via nginx)
- Admin: http://localhost/admin

### Local (Without Docker)
```bash
# Backend
cd backend
python -m venv myvenv
source myvenv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_offers
python manage.py runserver

# Frontend (new terminal)
cd frontend
# Edit .env: VITE_API_URL=http://localhost:8000/api
npm install
npm run dev
```

**Access:** Frontend: http://localhost:3000 | Backend: http://localhost:8000/api

**Note:** Without Docker, use full API URL in `frontend/.env`

---

## Production Build

### 1. Environment Setup
```bash
cp .env.example .env
```

Edit `.env`:
```env
DEPLOY_TYPE=prod
DEBUG=False
SECRET_KEY=<generate-strong-key>
FRONTEND_URL=https://yourdomain.com
```

Edit `frontend/.env`:
```env
VITE_API_URL=/api
VITE_MAPBOX_TOKEN=your-mapbox-token
```

### 2. SSL Certificates (Production Only)

Place SSL certificates in `nginx/ssl/`:
```bash
# Self-signed (testing)
./scripts/generate-dev-cert.sh  # quick helper

# or craft your own certificate manually
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem

# Or use Let's Encrypt (recommended)
# See nginx/ssl/README.md for details
```

### 3. Backend Bootstrap Automation

The backend container now runs `backend/entrypoint.sh` before Gunicorn starts. The script retries migrations until Postgres is reachable, collects static files, seeds demo data, and optionally creates a Django superuser. Control it via `.env`:

```env
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_EMAIL=admin@example.com
DJANGO_SUPERUSER_PASSWORD=change-me
RUN_SEED_OFFERS=true  # set to false to skip demo content
```

Commands executed automatically on container start:

- `python manage.py migrate --noinput`
- `python manage.py collectstatic --noinput`
- `python manage.py seed_offers` (skipped if `RUN_SEED_OFFERS=false`)
- `python manage.py createsuperuser --noinput` (runs only when all `DJANGO_SUPERUSER_*` vars are set)

If you need to rerun them manually, the `docker compose exec backend ...` commands below still work.

### 4. Deploy
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### 5. Database Setup
```bash
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate
docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
docker-compose -f docker-compose.prod.yml exec backend python manage.py seed_offers
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

**Note:** HTTPS required for production (cookies use `secure=True`)

---

## Seed Database

### Development
```bash
docker-compose exec backend python manage.py seed_offers
```

### Production
```bash
docker-compose -f docker-compose.prod.yml exec backend python manage.py seed_offers
```

### Reset & Re-seed
```bash
# Delete all offers
docker-compose exec backend python manage.py shell -c "from rest_api.models import Offer; Offer.objects.all().delete()"

# Re-seed
docker-compose exec backend python manage.py seed_offers
```

---

## Cookie Security

Automatically configured via `DEPLOY_TYPE`:

| Mode | secure | samesite | Protocol |
|------|--------|----------|----------|
| **dev** | False | Lax | HTTP |
| **prod** | True | Strict | HTTPS |

---

## Quick Reference

```bash
# Logs
docker-compose logs -f nginx
docker-compose logs -f backend

# Stop
docker-compose down

# Shell
docker-compose exec backend python manage.py shell

# Restart nginx
docker-compose restart nginx
```
