# Hive - Demo Setup Guide

This guide covers demo data, test users, and testing.

---

## Seed Database

### Run Seed Script
```bash
# Docker
docker-compose exec backend python manage.py seed_offers

# Local
cd backend && source myvenv/bin/activate
python manage.py seed_offers

# Production
docker-compose -f docker-compose.prod.yml exec backend python manage.py seed_offers
```

### Demo Users

All demo users have password: `password123`

| Email | Name | Location | Role |
|-------|------|----------|------|
| `admin@hive.com` | Admin User | - | Admin |
| `ahmet.yilmaz@example.com` | Ahmet Yılmaz | Ümraniye | User |
| `zeynep.kaya@example.com` | Zeynep Kaya | Bebek | User |
| `mehmet.demir@example.com` | Mehmet Demir | Hisarüstü | User |
| `ayse.sahin@example.com` | Ayşe Şahin | Sarıyer | User |
| `can.ozturk@example.com` | Can Öztürk | Kadıköy | User |
| `elif.arslan@example.com` | Elif Arslan | Ortaköy | User |
| `burak.celik@example.com` | Burak Çelik | Moda | User |
| `deniz.yildiz@example.com` | Deniz Yıldız | Beşiktaş | User |
| `seda.kara@example.com` | Seda Kara | Maltepe | User |
| `emre.bulut@example.com` | Emre Bulut | Üsküdar | User |

### Demo Content

**Sample Offers (Community-focused):**
- 📚 Free Tutoring for Kids (Ümraniye)
- 🐱 Feeding Stray Cats Together (Bebek)
- 📱 Tech Help for Seniors (Hisarüstü)
- 📖 Neighborhood Book Club (Sarıyer)
- 🔧 Free Minor Home Repairs (Kadıköy)
- 🧘 Free Yoga in the Park (Ortaköy)
- 💻 Coding for Beginners (Online)
- 📸 Photography Walk (Beşiktaş)
- 🎨 Kids Craft Workshop (Maltepe)
- 🚲 Free Bike Checkup (Üsküdar)

**Sample Wants:**
- 🤝 Help Organizing Charity Bazaar (Sarıyer)
- 🇩🇪 Language Tandem Partner - German (Hisarüstü)
- 🎸 Guitar Lessons Wanted (Beşiktaş)
- 🏃 Jogging Buddy Needed (Maltepe)
- 🍞 Learn to Bake Bread (Kadıköy)

### Reset & Re-seed
```bash
# Delete all offers
docker-compose exec backend python manage.py shell -c "from rest_api.models import Offer; Offer.objects.all().delete()"

# Re-seed
docker-compose exec backend python manage.py seed_offers
```

---

## Running Tests

### All Tests
```bash
# Docker
docker-compose exec backend python -m pytest tests/ -v

# Local
cd backend && source myvenv/bin/activate
python -m pytest tests/ -v
```

### Specific Test File
```bash
docker-compose exec backend python -m pytest tests/test_views/test_offer_views.py -v
```

### With Coverage Report
```bash
docker-compose exec backend python -m pytest tests/ --cov=rest_api --cov-report=html
# Open backend/htmlcov/index.html
```

### Test Categories
```bash
# Unit tests only
python -m pytest tests/test_views/ -v

# Integration tests only
python -m pytest tests/integration/ -v
```

---

## Troubleshooting

### WebSocket Connection Failed
```bash
# Check Daphne is running
docker-compose logs backend | grep -i daphne

# Verify WebSocket endpoint
curl -i http://localhost/ws/
```

### Database Connection Error
```bash
# Check PostgreSQL
docker-compose ps db

# Full reset
docker-compose down -v
docker-compose up -d
```

### Static Files Not Loading (Production)
```bash
docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
docker-compose -f docker-compose.prod.yml restart nginx
```

### Media Upload Permission Denied
```bash
docker-compose exec backend chmod -R 755 /app/media
```

---

## Related Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide
- **[THIRD_PARTY_SETUP.md](./THIRD_PARTY_SETUP.md)** - Gmail, Mapbox configuration
- **[TEST_TRACEABILITY_MATRIX.md](./backend/TEST_TRACEABILITY_MATRIX.md)** - Test coverage matrix
