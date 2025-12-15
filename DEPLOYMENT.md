# Hive - Deployment Guide

## Quick Start (Development)

### Docker (Recommended)
```bash
# 1. Setup environment
cp .env.example .env
cp frontend/.env.example frontend/.env

# 2. Build & Run
docker compose up --build

# 3. Seed Database (optional)
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py seed_offers
```

**Access:** 
- Application: http://localhost
- Backend API: http://localhost/api
- Admin: http://localhost/admin

### Local (Without Docker)
```bash
# Backend
cd backend
python -m venv myvenv
source myvenv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend (new terminal)
cd frontend
# Edit .env: VITE_API_URL=http://localhost:8000/api
npm install
npm run dev
```

**Access:** Frontend: http://localhost:3000 | Backend: http://localhost:8000/api

---

## Production Deployment

### 1. Environment Configuration

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

**Required `.env` settings:**
```env
DEPLOY_TYPE=prod
DEBUG=False
SECRET_KEY=<generate-strong-key>
FRONTEND_URL=https://yourdomain.com
```

**Frontend `frontend/.env`:**
```env
VITE_API_URL=/api
VITE_MAPBOX_TOKEN=your-mapbox-token
```

### 2. SSL Certificates

Place certificates in `nginx/ssl/`:

**Option A: Self-signed (Testing)**
```bash
# Quick script
./scripts/generate-dev-cert.sh

# Or manual
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem
```

**Option B: Let's Encrypt (Production)**
```bash
# Install certbot
sudo apt install certbot

# Get certificate (stop nginx first)
docker compose down
sudo certbot certonly --standalone -d yourdomain.com

# Copy to nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem

# Set permissions
sudo chown $USER:$USER nginx/ssl/*.pem
```

**Auto-renewal (cron):**

```bash
crontab -e
0 0 1 * * certbot renew --quiet && cp /etc/letsencrypt/live/yourdomain.com/*.pem /path/to/hive/nginx/ssl/
```

### 3. Backend Bootstrap

The container auto-runs via `backend/entrypoint.sh`:

| Command | Description |
|---------|-------------|
| `migrate --noinput` | Database migrations |
| `collectstatic --noinput` | Static files |
| `MinIO bucket setup` | Creates bucket if not exists (auto) |
| `seed_offers` | Demo data (if `RUN_SEED_OFFERS=true`) |
| `createsuperuser --noinput` | Admin user (if `DJANGO_SUPERUSER_*` vars set) |

> **Note:** MinIO bucket is automatically created on first startup. The bucket policy is set to public-read for media files.

**Optional `.env` for auto-admin:**
```env
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_EMAIL=admin@example.com
DJANGO_SUPERUSER_PASSWORD=change-me
RUN_SEED_OFFERS=false  # Skip demo data in production
```

### 4. Deploy

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 5. Post-Deploy (Manual)

```bash
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
docker compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

---

## Environment Variables Reference

### Root `.env` (Docker)

| Variable | Dev | Prod | Default | Description |
|----------|-----|------|---------|-------------|
| **Django** |||||
| `SECRET_KEY` | ✅ | ✅ | - | Django secret key (generate below) |
| `DEBUG` | - | ✅ | `True` | **Must be `False` in production** |
| `DEPLOY_TYPE` | ✅ | ✅ | `dev` | `dev` or `prod` - affects cookie security |
| `FRONTEND_URL` | ✅ | ✅ | - | Frontend URL for CORS |
| **Database** |||||
| `DB_NAME` | - | - | `hive_db` | PostgreSQL database name |
| `DB_USER` | - | - | `postgres` | PostgreSQL username |
| `DB_PASSWORD` | ✅ | ✅ | - | PostgreSQL password |
| `DB_HOST` | - | - | `db` | Database host |
| `DB_PORT` | - | - | `5432` | PostgreSQL port |
| **MinIO (File Storage)** |||||
| `MINIO_ROOT_USER` | - | ✅ | `minioadmin` | MinIO admin username |
| `MINIO_ROOT_PASSWORD` | ✅ | ✅ | - | MinIO admin password |
| `MINIO_BUCKET_NAME` | - | - | `hive-media` | S3 bucket name |
| **Email (SMTP)** |||||
| `EMAIL_HOST` | - | ✅ | `smtp.gmail.com` | SMTP server host |
| `EMAIL_PORT` | - | ✅ | `465` | SMTP port |
| `EMAIL_HOST_USER` | - | ✅ | - | SMTP username/email |
| `EMAIL_HOST_PASSWORD` | - | ✅ | - | SMTP password (App Password) |
| **Auto Bootstrap** |||||
| `DJANGO_SUPERUSER_USERNAME` | - | - | - | Auto-create admin username |
| `DJANGO_SUPERUSER_EMAIL` | - | - | - | Auto-create admin email |
| `DJANGO_SUPERUSER_PASSWORD` | - | - | - | Auto-create admin password |
| `RUN_SEED_OFFERS` | - | - | `true` | Set `false` for production |

✅ = Required, - = Optional

### Frontend `frontend/.env`

| Variable | Dev | Prod | Default | Description |
|----------|-----|------|---------|-------------|
| `VITE_API_URL` | ✅ | ✅ | `/api` | Backend API URL |
| `VITE_MAPBOX_TOKEN` | - | ✅ | - | Mapbox access token (required for map features) |

✅ = Required, - = Optional

### Example Configurations

**Development (Docker):**
```env
# .env
SECRET_KEY=dev-secret-key-change-in-prod
DEBUG=True
DEPLOY_TYPE=dev
FRONTEND_URL=http://localhost:3000

DB_NAME=hive_db
DB_USER=postgres
DB_PASSWORD=devpassword123
DB_HOST=db
DB_PORT=5432

MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=miniodevpass
MINIO_BUCKET_NAME=hive-media

# Email (optional for dev)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=

# Mapbox
VITE_MAPBOX_TOKEN=

# Bootstrap
RUN_SEED_OFFERS=true
```

```env
# frontend/.env
VITE_API_URL=/api
VITE_MAPBOX_TOKEN=
```

**Production:**
```env
# .env
SECRET_KEY=super-long-random-string-here-50chars-minimum
DEBUG=False
DEPLOY_TYPE=prod
FRONTEND_URL=https://yourdomain.com

DB_NAME=hive_db
DB_USER=postgres
DB_PASSWORD=very-strong-db-password-here
DB_HOST=db
DB_PORT=5432

MINIO_ROOT_USER=hiveadmin
MINIO_ROOT_PASSWORD=very-strong-minio-password
MINIO_BUCKET_NAME=hive-media

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_HOST_USER=noreply@yourdomain.com
EMAIL_HOST_PASSWORD=your-gmail-app-password

VITE_MAPBOX_TOKEN=pk.eyJ1IjoieW91ci10b2tlbiIsImEiOiJjbGFiY2RlZiJ9.abc123

# Bootstrap
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_EMAIL=admin@yourdomain.com
DJANGO_SUPERUSER_PASSWORD=strong-admin-password
RUN_SEED_OFFERS=false
```

```env
# frontend/.env
VITE_API_URL=/api
VITE_MAPBOX_TOKEN=pk.eyJ1IjoieW91ci10b2tlbiIsImEiOiJjbGFiY2RlZiJ9.abc123
```

**Generate Secret Key:**
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

---

## Cookie Security

Automatically configured via `DEPLOY_TYPE`:

| Mode | secure | samesite | Protocol |
|------|--------|----------|----------|
| **dev** | False | Lax | HTTP |
| **prod** | True | Strict | HTTPS |

⚠️ **HTTPS required** for production (cookies use `secure=True`)

---

## Quick Reference

```bash
# Logs
docker compose logs -f backend
docker compose logs -f nginx

# Stop all
docker compose down

# Shell access
docker compose exec backend python manage.py shell

# Restart services
docker compose restart nginx
docker compose restart backend

# Database
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
```

---

## Related Documentation

- **[DEMO_SETUP.md](./DEMO_SETUP.md)** - Demo data, test users, testing guide
- **[THIRD_PARTY_SETUP.md](./THIRD_PARTY_SETUP.md)** - Gmail & Mapbox configuration
- **[TEST_TRACEABILITY_MATRIX.md](./backend/TEST_TRACEABILITY_MATRIX.md)** - Test coverage
- **[573 Project SRS.md](./573%20Project%20SRS.md)** - Software Requirements Specification
