# Hive - Third-Party Services Setup

This guide covers configuration for external services used by Hive.

---

## Mapbox (Map & Geocoding)

Required for map features on the dashboard.

### Features
- 🗺️ Dashboard map view with offer locations
- 📍 Address autocomplete when creating offers
- 🔄 Reverse geocoding (coordinates → address)

### Setup Steps

1. **Create Mapbox Account**
   - Go to [mapbox.com](https://www.mapbox.com/) and sign up
   - Free tier: 50,000 map loads/month

2. **Create New Access Token** ⚠️ Don't use Default token!
   - Navigate to: Account → [Tokens](https://account.mapbox.com/access-tokens/)
   - Click **"Create a token"**
   - Name: `hive-frontend`
   - **URL Restrictions (Required!):**
     | Environment | URLs |
     |-------------|------|
     | Development | `http://localhost:3000`, `http://localhost` |
     | Production | `https://yourdomain.com` |
   - Click **"Create token"**

3. **Configure Token**
   
   Add to `frontend/.env`:
   ```env
   VITE_MAPBOX_TOKEN=pk.eyJ1IjoieW91ci10b2tlbi1oZXJlIi4uLg==
   ```

4. **Restart Frontend**
   ```bash
   docker-compose restart frontend
   ```

### Security Notes
| ⚠️ Warning | Description |
|-----------|-------------|
| No Default Token | Never use the "Default public token" |
| URL Restrictions | Always add URL restrictions to prevent abuse |
| Production | Restrict to your exact domain only |

### Without Mapbox
- ❌ Map won't display on dashboard
- ❌ Address autocomplete won't work
- ✅ All other features work normally

---

## Gmail SMTP (Email)

Required for email verification and notifications.

### Features
- 📧 Email verification for new users
- 🔔 Exchange notifications
- 🔐 Password reset emails

### Setup Steps

1. **Enable 2-Factor Authentication**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable **2-Step Verification**

2. **Generate App Password**
   - Go to: [App Passwords](https://myaccount.google.com/apppasswords)
   - Select app: **Mail**
   - Select device: **Other** → Enter "Hive"
   - Copy the 16-character password
   
   ```
   Example: abcd efgh ijkl mnop
   ```

3. **Configure `.env`**
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=465
   EMAIL_HOST_USER=your-email@gmail.com
   EMAIL_HOST_PASSWORD=abcdefghijklmnop
   ```
   
   ⚠️ **No spaces in password!** Remove spaces from copied password.

4. **Restart Backend**
   ```bash
   docker-compose restart backend
   ```

### Test Email Configuration
```bash
docker-compose exec backend python manage.py shell
```
```python
from django.core.mail import send_mail
send_mail('Test Subject', 'Test body', 'from@gmail.com', ['to@example.com'])
# Returns 1 if successful
```

### Without Email
- ✅ Users can register
- ❌ No verification emails sent
- ❌ Unverified users cannot create offers/exchanges

---

## Alternative Email Providers

| Provider | Host | Port | Auth |
|----------|------|------|------|
| **Gmail** | smtp.gmail.com | 465 (SSL) | App Password |
| **Outlook** | smtp.office365.com | 587 (TLS) | Account Password |
| **SendGrid** | smtp.sendgrid.net | 587 | API Key |
| **Mailgun** | smtp.mailgun.org | 587 | API Key |

### SendGrid Example
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=SG.your-api-key-here
```

### Outlook Example
```env
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@outlook.com
EMAIL_HOST_PASSWORD=your-password
```

---

## Troubleshooting

### Mapbox Issues

| Problem | Solution |
|---------|----------|
| Map not showing | Check browser console for errors |
| "Invalid token" | Verify token starts with `pk.` |
| "Unauthorized" | Check URL restrictions match your domain |
| Stale map | Clear browser cache |

### Email Issues

| Problem | Solution |
|---------|----------|
| "Authentication failed" | Regenerate App Password |
| "Less secure app" error | Enable 2FA and use App Password |
| Emails in spam | Add SPF/DKIM records (production) |
| Connection timeout | Check firewall allows port 465/587 |

### Debug Email
```python
# In Django shell
from django.conf import settings
print(f"Host: {settings.EMAIL_HOST}")
print(f"Port: {settings.EMAIL_PORT}")
print(f"User: {settings.EMAIL_HOST_USER}")
print(f"SSL: {settings.EMAIL_USE_SSL}")
```

---

## Environment Variables Summary

```env
# Mapbox (Frontend)
VITE_MAPBOX_TOKEN=pk.eyJ1IjoiLi4u

# Email (Backend)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

---

## Related Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment
- **[DEMO_SETUP.md](./DEMO_SETUP.md)** - Demo configuration & test users

