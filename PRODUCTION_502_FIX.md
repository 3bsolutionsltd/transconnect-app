# 🔧 Production 502 Bad Gateway - Quick Fix Guide

## Issue: transconnect.app showing 502 Bad Gateway (nginx)

**Root Cause**: Backend Node.js service on VPS is not running or crashed

**Impact**: API and web services unavailable

---

## 🚑 IMMEDIATE FIX (SSH to VPS)

### Step 1: Check Service Status

```bash
# SSH to your VPS first
ssh user@transconnect.app

# Check if Node.js backend is running
pm2 status
# OR if using systemd:
sudo systemctl status transconnect-backend

# Check nginx status
sudo systemctl status nginx
```

### Step 2: Restart Backend Service

```bash
# If using PM2 (most common):
pm2 restart transconnect-backend
# OR restart all:
pm2 restart all

# If using systemd:
sudo systemctl restart transconnect-backend

# If manual process:
cd /path/to/transconnect-backend
npm run start
```

### Step 3: Check Logs for Errors

```bash
# PM2 logs:
pm2 logs transconnect-backend --lines 50

# Systemd logs:
sudo journalctl -u transconnect-backend -n 50 --no-pager

# Direct logs:
tail -f /path/to/transconnect-backend/logs/error.log
```

### Step 4: Verify Backend is Running

```bash
# Check if Node.js is listening on expected port (usually 5000 or 8080)
sudo netstat -tulpn | grep node
# OR
curl http://localhost:5000/api/health  # Replace with your actual port and health endpoint
```

### Step 5: Restart Nginx (if needed)

```bash
sudo systemctl restart nginx
# OR reload without downtime:
sudo nginx -t && sudo nginx -s reload
```

---

## 🔍 COMMON CAUSES

### 1. Server Ran Out of Memory
```bash
# Check memory usage
free -h
# If low, restart services and consider upgrading
```

### 2. Process Crashed
```bash
# Check PM2/systemd for crash reports
pm2 logs --err --lines 100
```

### 3. Database Connection Issue
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql
# Check database connectivity
psql -U transconnect -d transconnect_prod -c "SELECT 1;"
```

### 4. Port Already in Use
```bash
# Kill process on port (e.g., 5000)
sudo lsof -ti:5000 | xargs kill -9
# Then restart your backend
```

### 5. Environment Variables Missing
```bash
# Verify .env file exists
cat /path/to/transconnect-backend/.env
# Check critical vars are set
echo $DATABASE_URL
echo $PORT
```

---

## ⚡ QUICK RESTART COMMANDS

### If you have PM2 ecosystem file:
```bash
cd /path/to/transconnect-backend
pm2 delete all
pm2 start ecosystem.config.js
pm2 save
```

### If you have Docker:
```bash
docker-compose restart
# OR
docker restart transconnect-backend
```

### Full Stack Restart:
```bash
# Restart everything in order
sudo systemctl restart postgresql
pm2 restart all
sudo systemctl reload nginx
```

---

## 🔐 ACCESS CHECKS

If you **can't SSH** to the VPS:

1. **Check VPS Provider Dashboard** (DigitalOcean/AWS/Linode)
   - Is the server running?
   - CPU/Memory usage normal?
   - Any alerts?

2. **Reboot from Control Panel** (last resort)
   - This will restart all services
   - Usually fixes temporary issues

3. **Check DNS Records** (unlikely but possible)
   ```bash
   nslookup transconnect.app
   # Should point to your VPS IP
   ```

---

## 📊 MONITORING SETUP (After Fix)

To prevent this in future:

### 1. Setup PM2 Auto-Restart
```bash
pm2 startup
pm2 save
# Now PM2 restarts automatically after server reboot
```

### 2. Add Health Check Monitoring
Use services like:
- UptimeRobot (free)
- Pingdom
- Better Stack (formerly Better Uptime)

Point them to: `https://transconnect.app/api/health`

### 3. Setup Log Rotation
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 7
```

---

## 🎯 PREVENTION CHECKLIST

- [ ] PM2 configured with auto-restart
- [ ] Server monitoring alerts set up
- [ ] Database backups automated
- [ ] Log rotation configured
- [ ] Server has adequate RAM/CPU
- [ ] Swap space configured (if low RAM)
- [ ] Regular security updates applied

---

## 📞 EMERGENCY CONTACTS

**If you can't fix it quickly:**

1. Check VPS provider status page
2. Reach out to hosting support
3. Consider temporary fallback: Enable maintenance page

### Quick Maintenance Page (nginx):

```bash
# Create maintenance.html
sudo nano /var/www/html/maintenance.html
```

```html
<!DOCTYPE html>
<html>
<head>
    <title>TransConnect - Maintenance</title>
    <style>
        body { font-family: Arial; text-align: center; padding: 50px; }
        h1 { color: #2563EB; }
    </style>
</head>
<body>
    <h1>🔧 Scheduled Maintenance</h1>
    <p>TransConnect is currently undergoing maintenance.</p>
    <p>We'll be back shortly!</p>
    <p>For urgent bookings, please call: +256 39451710</p>
</body>
</html>
```

```bash
# Update nginx to serve maintenance page
sudo nano /etc/nginx/sites-available/transconnect
```

Add at top of server block:
```nginx
location / {
    return 503;
}

error_page 503 @maintenance;
location @maintenance {
    root /var/www/html;
    rewrite ^(.*)$ /maintenance.html break;
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 🚀 POST-FIX VERIFICATION

After fixing, verify these URLs work:

- [ ] https://transconnect.app - Web portal loads
- [ ] https://api.transconnect.app/api/health - Returns 200 OK
- [ ] https://admin.transconnect.app - Admin dashboard loads
- [ ] Test booking flow end-to-end
- [ ] Check mobile app connectivity

---

**Need More Help?**

Run these diagnostics and share output:
```bash
pm2 status
pm2 logs --err --lines 50
free -h
df -h
sudo systemctl status nginx
sudo netstat -tulpn | grep node
```
