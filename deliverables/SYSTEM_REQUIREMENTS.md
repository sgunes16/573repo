# The Hive - System Requirements

## Table of Contents

1. [Overview](#1-overview)
2. [Hardware Requirements](#2-hardware-requirements)
3. [Operating System Requirements](#3-operating-system-requirements)
4. [Software Dependencies](#4-software-dependencies)
5. [Third-Party Services](#5-third-party-services)
6. [Network Requirements](#6-network-requirements)
7. [Browser Compatibility](#7-browser-compatibility)

---

## 1. Overview

The Hive is a full-stack web application consisting of:
- **Frontend**: React-based Single Page Application (SPA)
- **Backend**: Django REST API with WebSocket support
- **Database**: PostgreSQL for data persistence
- **Cache/Message Broker**: Redis for WebSocket channels
- **Object Storage**: MinIO (S3-compatible) for media files
- **Reverse Proxy**: Nginx for routing and static file serving

The application can be deployed using Docker containers (recommended) or directly on a host system.

---

## 2. Hardware Requirements

### 2.1 Minimum Requirements (Development)

| Component | Specification |
|-----------|---------------|
| **CPU** | 2 cores (x64 or ARM64) |
| **RAM** | 4 GB |
| **Storage** | 10 GB available space |
| **Network** | Broadband internet connection |

### 2.2 Recommended Requirements (Production - Small Scale)

| Component | Specification |
|-----------|---------------|
| **CPU** | 4+ cores |
| **RAM** | 8 GB |
| **Storage** | 50 GB SSD |
| **Network** | 100 Mbps+ connection |

### 2.3 Production Requirements (Medium Scale - 1000+ users)

| Component | Specification |
|-----------|---------------|
| **CPU** | 8+ cores |
| **RAM** | 16 GB |
| **Storage** | 100+ GB SSD (NVMe preferred) |
| **Network** | 1 Gbps connection |

### 2.4 Storage Breakdown

| Component | Estimated Size |
|-----------|----------------|
| Docker images | ~3 GB |
| PostgreSQL data | ~1 GB per 10,000 users |
| MinIO media storage | Variable (depends on uploads) |
| Redis data | ~100 MB |
| Application logs | ~500 MB |

---

## 3. Operating System Requirements

### 3.1 Supported Operating Systems

| OS | Version | Support Level |
|----|---------|---------------|
| **Ubuntu** | 20.04 LTS, 22.04 LTS, 24.04 LTS | ✅ Full Support |

### 3.2 Docker-Based Deployment (Recommended)

When using Docker, the host OS requirements are minimal:
- Docker Engine 24.0+
- Docker Compose 2.20+

### 3.3 Native Deployment Requirements

For running without Docker:

**Linux (Ubuntu/Debian):**
```bash
# Required packages
build-essential
python3.11+
python3-pip
python3-venv
nodejs 18+
npm 9+
postgresql-client
redis-tools
```

**macOS:**
```bash
# Via Homebrew
brew install python@3.11 node@18 postgresql redis
```

**Windows:**
- Python 3.11+ (from python.org)
- Node.js 18+ LTS (from nodejs.org)
- PostgreSQL 16+ (from postgresql.org)
- Redis via WSL2 or Memurai

---

## 4. Software Dependencies

### 4.1 Container Images (Docker Deployment)

| Service | Image | Version |
|---------|-------|---------|
| **Nginx** | `nginx:alpine` | Latest Alpine |
| **PostgreSQL** | `postgres:16-alpine` | 16.x |
| **Redis** | `redis:7-alpine` | 7.x |
| **MinIO** | `minio/minio:latest` | Latest |
| **Backend** | Custom (Python 3.11) | Built from Dockerfile |
| **Frontend** | Custom (Node 18) | Built from Dockerfile |

### 4.2 Backend Dependencies (Python)

#### Core Framework
| Package | Version | Purpose |
|---------|---------|---------|
| `Django` | 5.2.7 | Web framework |
| `djangorestframework` | 3.14.0 | REST API framework |
| `djangorestframework-simplejwt` | 5.3.1 | JWT authentication |
| `django-cors-headers` | 4.3.1 | CORS handling |
| `django-filter` | 24.1 | Query filtering |
| `django-extensions` | 3.2.3 | Development utilities |

#### Database & Storage
| Package | Version | Purpose |
|---------|---------|---------|
| `psycopg` | 3.2.12 | PostgreSQL adapter (async) |
| `psycopg2-binary` | 2.9.11 | PostgreSQL adapter (sync) |
| `django-storages` | 1.14.2 | Cloud storage backends |
| `boto3` | 1.34.0 | AWS/S3 SDK (MinIO) |
| `pillow` | 12.0.0 | Image processing |

#### WebSocket & Async
| Package | Version | Purpose |
|---------|---------|---------|
| `channels` | 4.0.0 | WebSocket support |
| `channels-redis` | 4.2.0 | Redis channel layer |
| `daphne` | 4.1.0 | ASGI server |
| `asgiref` | 3.10.0 | ASGI utilities |

#### Server & Utilities
| Package | Version | Purpose |
|---------|---------|---------|
| `gunicorn` | 21.2.0 | WSGI HTTP server |
| `whitenoise` | 6.6.0 | Static file serving |
| `python-dotenv` | 1.2.1 | Environment variables |
| `resend` | 2.19.0 | Email service |
| `certifi` | 2025.11.12 | SSL certificates |

#### Testing
| Package | Version | Purpose |
|---------|---------|---------|
| `pytest` | 8.3.4 | Test framework |
| `pytest-django` | 4.9.0 | Django test integration |
| `pytest-asyncio` | 0.24.0 | Async test support |
| `pytest-cov` | 7.0.0 | Code coverage |
| `factory_boy` | 3.3.0 | Test data factories |
| `coverage` | 7.13.0 | Coverage reporting |

### 4.3 Frontend Dependencies (Node.js)

#### Core Libraries
| Package | Version | Purpose |
|---------|---------|---------|
| `react` | 18.2.0 | UI library |
| `react-dom` | 18.2.0 | DOM rendering |
| `react-router-dom` | 6.21.3 | Client-side routing |
| `typescript` | 5.3.3 | Type safety |

#### UI Framework
| Package | Version | Purpose |
|---------|---------|---------|
| `@chakra-ui/react` | 2.8.2 | Component library |
| `@chakra-ui/icons` | 2.1.1 | Icon components |
| `@emotion/react` | 11.11.3 | CSS-in-JS (Chakra dep) |
| `@emotion/styled` | 11.11.0 | Styled components |
| `framer-motion` | 11.0.3 | Animations |
| `react-icons` | 5.0.1 | Icon library |

#### Data & State
| Package | Version | Purpose |
|---------|---------|---------|
| `axios` | 1.6.5 | HTTP client |
| `zustand` | 4.5.0 | State management |

#### Maps
| Package | Version | Purpose |
|---------|---------|---------|
| `mapbox-gl` | 3.16.0 | Map rendering |
| `react-map-gl` | 7.1.9 | React wrapper for Mapbox |

#### Development Tools
| Package | Version | Purpose |
|---------|---------|---------|
| `vite` | 5.0.11 | Build tool |
| `@vitejs/plugin-react` | 4.2.1 | React plugin for Vite |
| `eslint` | 8.56.0 | Code linting |
| `@typescript-eslint/*` | 6.19.0 | TypeScript ESLint |

### 4.4 Version Compatibility Matrix

| Component | Minimum | Recommended | Maximum Tested |
|-----------|---------|-------------|----------------|
| Python | 3.10 | 3.11 | 3.12 |
| Node.js | 16 | 18 LTS | 20 LTS |
| PostgreSQL | 14 | 16 | 16 |
| Redis | 6 | 7 | 7 |
| Docker | 20.10 | 24.0+ | Latest |
| Docker Compose | 2.0 | 2.20+ | Latest |

---

## 5. Third-Party Services

### 5.1 Required Services

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| **Mapbox** | Maps and geocoding | 50,000 map loads/month |
| **Resend** | Email delivery | 3000 mail / month |

### 5.3 API Keys Required

| Service | Environment Variable | Required |
|---------|---------------------|----------|
| Mapbox | `VITE_MAPBOX_TOKEN` | ✅ Yes |
| Resend | `RESEND_API_KEY` |  ✅ Yes |

---

## 6. Network Requirements

### 6.1 Ports Used

| Port | Service | Protocol | Exposure |
|------|---------|----------|----------|
| 80 | Nginx (HTTP) | TCP | Public |
| 443 | Nginx (HTTPS) | TCP | Public (production) |
| 8000 | Django/Daphne | TCP | Internal only |
| 5432 | PostgreSQL | TCP | Internal only |
| 6379 | Redis | TCP | Internal only |
| 9000 | MinIO API | TCP | Internal only |
| 9001 | MinIO Console | TCP | Dev only |

### 6.2 Firewall Rules (Production)

```
# Inbound
ALLOW TCP 80 (HTTP)
ALLOW TCP 443 (HTTPS)
DENY ALL other inbound

# Outbound
ALLOW TCP 443 (HTTPS - for external APIs)
ALLOW TCP 587/465 (SMTP - if using email)
```

### 6.3 WebSocket Requirements

- WebSocket connections on `/ws/*` paths
- Connection upgrade from HTTP to WS
- Long-lived connections (keep-alive)
- Supported by all modern reverse proxies

---

## 7. Browser Compatibility

### 7.1 Supported Browsers

| Browser | Minimum Version | Support Level |
|---------|-----------------|---------------|
| **Chrome** | 90+ | ✅ Full Support |
| **Firefox** | 88+ | ✅ Full Support |
| **Safari** | 14+ | ✅ Full Support |
| **Edge** | 90+ | ✅ Full Support |
| **Opera** | 76+ | ✅ Full Support |
| **Samsung Internet** | 14+ | ✅ Full Support |

### 7.2 Required Browser Features

| Feature | Usage |
|---------|-------|
| ES2020+ JavaScript | Core application |
| CSS Grid & Flexbox | Layout |
| WebSocket | Real-time updates |
| Geolocation API | Location-based features |
| LocalStorage | Token persistence |
| Fetch API | HTTP requests |

### 7.3 Mobile Browser Support

| Platform | Browser | Support |
|----------|---------|---------|
| iOS | Safari 14+ | ✅ Full |
| iOS | Chrome | ✅ Full |
| Android | Chrome | ✅ Full |
| Android | Samsung Internet | ✅ Full |
| Android | Firefox | ✅ Full |

### 7.4 Not Supported

| Browser | Reason |
|---------|--------|
| Internet Explorer | End of life, no ES6+ support |
| Legacy Edge (EdgeHTML) | Replaced by Chromium Edge |
| Opera Mini | Limited JavaScript support |

---


