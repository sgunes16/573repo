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

## Resend (Email)

Required for email verification and notifications. **Free tier: 3,000 emails/month + 1 custom domain.**

### Features
- 📧 Email verification for new users
- 🔔 Exchange notifications
- 🔐 Password reset emails

### Setup Steps

1. **Create Resend Account**
   - Go to [resend.com](https://resend.com/) and sign up
   - Free tier includes:
     - 3,000 emails/month
     - 1 custom domain
     - API access

2. **Get API Key**
   - Navigate to: [API Keys](https://resend.com/api-keys)
   - Click **"Create API Key"**
   - Name: `hive-backend`
   - Permission: **Sending access**
   - Click **"Add"**
   - Copy the API key (starts with `re_`)
   
   ```
   Example: re_123abc456def_XXXXXXXXXXXXXXXXXX
   ```

3. **Configure `.env`**
   ```env
   RESEND_API_KEY=re_your_api_key_here
   RESEND_FROM_EMAIL=onboarding@resend.dev
   ```

4. **Restart Backend**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build backend
   ```

### Custom Domain (Optional but Recommended)

Using a custom domain improves email deliverability and looks more professional.

1. **Add Domain in Resend**
   - Go to: [Domains](https://resend.com/domains)
   - Click **"Add Domain"**
   - Enter your domain (e.g., `yourdomain.com` or `hive.yourdomain.com`)

2. **Configure DNS Records**
   
   Resend will provide DNS records to add. Example for `hive.yourdomain.com`:
   
   | Type | Name | Content | Purpose |
   |------|------|---------|---------|
   | TXT | `resend._domainkey.hive` | `p=MIGfMA0GCS...` | DKIM (Domain Verification) |
   | MX | `send.hive` | `feedback-smtp.eu-west-1.amazonses.com` | SPF - Enable Sending |
   | TXT | `send.hive` | `v=spf1 include:amazonses.com ~all` | SPF - Enable Sending |
   | MX | `hive` | `inbound-smtp.eu-west-1...` | Enable Receiving (optional) |
   
   > **Note:** Record names are relative to your root domain. If your domain is `hive.selmangunes.com`, the full DNS name for `send.hive` would be `send.hive.selmangunes.com`.

3. **Verify Domain**
   - Wait for DNS propagation (5-30 minutes)
   - Click **"Verify"** in Resend dashboard

4. **Update `.env`**
   ```env
   RESEND_CUSTOM_DOMAIN=true
   # Email will be auto-generated: noreply@<your-frontend-domain>
   ```

### Test Email Configuration
```bash
docker compose -f docker-compose.prod.yml exec backend python manage.py shell
```
```python
import resend
import os
resend.api_key = os.getenv('RESEND_API_KEY')
r = resend.Emails.send({
    "from": "onboarding@resend.dev",
    "to": "your-email@example.com",
    "subject": "Test from Hive",
    "html": "<p>Email is working!</p>"
})
print(r)  # Should show {'id': '...'}
```

### Without Email
- ✅ Users can register
- ❌ No verification emails sent
- ❌ Unverified users may have limited access

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
| "API key invalid" | Check RESEND_API_KEY in .env |
| Email not received | Check spam folder |
| "Domain not verified" | Complete domain verification in Resend |
| Rate limit | Free tier: 3,000/month limit |

### Debug Email
```python
# In Django shell
import os
print(f"API Key: {os.getenv('RESEND_API_KEY', 'NOT SET')[:10]}...")
print(f"From Email: {os.getenv('RESEND_FROM_EMAIL', 'NOT SET')}")
```

---

## Environment Variables Summary

```env
# Mapbox (Frontend)
VITE_MAPBOX_TOKEN=pk.eyJ1IjoiLi4u

# Resend (Backend)
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=onboarding@resend.dev
```

---

## Related Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment
- **[DEMO_SETUP.md](./DEMO_SETUP.md)** - Demo configuration & test users
