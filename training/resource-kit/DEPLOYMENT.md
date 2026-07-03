# 🚀 Training Resource Kit - Deployment Guide

## Quick Deploy to GitHub Pages (Recommended)

Your training resource kit is ready to go online! Here's how to deploy it in 3 steps:

### Step 1: Enable GitHub Pages

1. Go to your repository: https://github.com/3bsolutionsltd/transconnect-app
2. Click **Settings** → **Pages** (left sidebar)
3. Under "Build and deployment":
   - **Source**: Select "GitHub Actions"
4. Save the settings

### Step 2: Commit and Push

The GitHub Actions workflow is already configured in `.github/workflows/deploy-training.yml`

```powershell
# Commit the new files
git add training/resource-kit/ .github/workflows/deploy-training.yml
git commit -m "Add training resource kit with auto-deployment"
git push origin main
```

### Step 3: Access Your Site

After ~2 minutes, your training portal will be live at:

```
https://3bsolutionsltd.github.io/transconnect-app/resource-kit/
```

**Bookmark this URL** and share it with your team!

---

## 🔄 Auto-Updates

The site automatically redeploys whenever you:
- Push changes to any file in `training/` directory
- Add new training materials
- Update existing guides

**No manual deployment needed** - just commit and push!

---

## 🌐 Custom Domain (Optional)

### Option A: Subdomain (Recommended)
Set up: `training.transconnect.ug` or `learn.transconnect.ug`

1. Add DNS record:
   ```
   Type: CNAME
   Name: training
   Value: 3bsolutionsltd.github.io
   ```

2. In GitHub Settings → Pages → Custom domain:
   - Enter: `training.transconnect.ug`
   - Check "Enforce HTTPS"

### Option B: Subdirectory
Use your existing domain: `transconnect.ug/training/`

Requires web server configuration (not covered here)

---

## 🔒 Access Control Options

### Public (Current Setup)
- ✅ Anyone with the URL can access
- ✅ Good for company-wide training
- ✅ Easy to share and bookmark

### Private Options

#### Option 1: Private Repository
Make the entire repo private:
- Go to Settings → General → Danger Zone → Change visibility
- Only collaborators can access the GitHub Pages site
- Free for organizations with GitHub Team plan

#### Option 2: Password Protection
Add authentication layer:

```html
<!-- Add to index.html before </head> -->
<script>
(function() {
    const password = "TransConnect2026!";
    const entered = sessionStorage.getItem('training-auth');
    
    if (!entered) {
        const input = prompt('Enter training portal password:');
        if (input !== password) {
            alert('Incorrect password');
            window.location.href = 'about:blank';
        } else {
            sessionStorage.setItem('training-auth', 'true');
        }
    }
})();
</script>
```

**Note:** This is basic protection. For enterprise security, use Option 1 or host internally.

#### Option 3: Internal Network Only
Deploy to company intranet instead of GitHub Pages:
- Copy `training/` folder to internal web server
- Accessible only within company network
- No internet exposure

---

## 🎯 Alternative Hosting Options

### Netlify (Easiest Alternative)

1. Go to https://netlify.com
2. Drag and drop the `training/resource-kit/` folder
3. Get instant URL: `transconnect-training.netlify.app`
4. Connect to GitHub for auto-deploys

**Pros:**
- Simpler interface than GitHub
- Better analytics/logs
- Easy custom domain setup

**Cons:**
- Another service to manage
- Free tier limits (100GB bandwidth/month)

### Vercel

1. Install Vercel CLI: `npm install -g vercel`
2. Run: `vercel --cwd training/resource-kit`
3. Follow prompts

**Pros:**
- Excellent performance
- Great developer experience
- Auto-SSL certificates

**Cons:**
- Another service to manage
- Overkill for static sites

### Azure Static Web Apps

1. Go to Azure Portal
2. Create Static Web App
3. Connect to GitHub repository
4. Set build folder: `training/resource-kit`

**Pros:**
- Integration with Azure ecosystem
- Enterprise features
- SLA guarantees

**Cons:**
- More complex setup
- Costs for high traffic

### Company Shared Drive (Internal Only)

1. Copy `training/` folder to network drive
2. Share path: `\\fileserver\training\resource-kit\index.html`
3. Team opens directly in browser

**Pros:**
- No internet required
- Complete control
- No hosting costs

**Cons:**
- Only accessible on company network
- No mobile access
- Slower than web hosting

---

## 📊 Monitoring & Analytics

### GitHub Pages Traffic (Built-in)

View in repository:
- Settings → Insights → Traffic
- See visitors and page views

### Google Analytics (Optional)

Add before `</head>` in index.html:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

Replace `GA_MEASUREMENT_ID` with your tracking ID.

---

## 🔧 Troubleshooting

### "Page Not Found" (404)
- Wait 2-3 minutes after first deployment
- Check GitHub Actions tab for deployment status
- Verify GitHub Pages is enabled in Settings

### Markdown Files Not Loading
- Ensure entire `training/` folder is deployed (not just `resource-kit/`)
- Check relative paths in `app.js` are correct
- View browser console for errors (F12)

### PDF Download Not Working
- Check if browser blocks pop-ups
- Verify html2pdf.js CDN is accessible
- Try different browser

### Slow Loading
- GitHub Pages free tier is fast enough for most use cases
- If slow, consider Netlify or Vercel
- Check file sizes (should all be < 1MB)

---

## 🚀 Deployment Checklist

- [ ] GitHub Actions workflow created (`.github/workflows/deploy-training.yml`)
- [ ] GitHub Pages enabled in repository settings
- [ ] All training files committed to repository
- [ ] Pushed to main branch
- [ ] Waited 2-3 minutes for deployment
- [ ] Verified site is accessible
- [ ] Tested resource viewing
- [ ] Tested PDF download
- [ ] Bookmarked URL
- [ ] Shared with team

---

## 📱 Sharing with Team

Once deployed, share this info with your team:

```
🎓 TransConnect Training Portal

Access all training materials online:
🔗 https://3bsolutionsltd.github.io/transconnect-app/resource-kit/

✅ View guides in your browser
✅ Download PDFs for offline use
✅ Works on desktop and mobile

Questions? Contact [your-email@transconnect.ug]
```

---

## 🔄 Updating Content

To add new training materials:

1. Create markdown file in `training/` directory
2. Update `app.js` to register the resource
3. Commit and push:
   ```powershell
   git add training/
   git commit -m "Add new training resource: [resource-name]"
   git push origin main
   ```
4. Site updates automatically in 2 minutes

---

## 💡 Pro Tips

1. **Test Locally First**: Open `index.html` in browser before deploying
2. **Use Descriptive Commits**: Helps track what content was added
3. **Version PDFs**: Include dates in PDF filenames
4. **Mobile Test**: Check on phones before sharing widely
5. **Bookmark Important**: Add to browser favorites and company wiki

---

## 📞 Support

- **Repository**: https://github.com/3bsolutionsltd/transconnect-app
- **Deployment Status**: Check Actions tab in GitHub
- **Issues**: Create GitHub issue for bugs/improvements

---

**Ready to deploy? Run the commands in Step 2 above!** 🚀
