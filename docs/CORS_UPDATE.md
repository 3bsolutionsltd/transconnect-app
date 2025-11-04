# CORS Configuration Update

After both frontend applications are deployed, update your Render backend environment variables:

## Add Frontend Domains to CORS

In your `transconnect-app` service on Render, add this environment variable:

```bash
CORS_ORIGINS=https://your-web-app.vercel.app,https://your-admin-app.vercel.app,http://localhost:3000,http://localhost:3001
```

Replace with your actual Vercel URLs once deployed.

## Example CORS Origins
```bash
# Format: comma-separated URLs, no spaces
CORS_ORIGINS=https://transconnect-web-abc123.vercel.app,https://transconnect-admin-def456.vercel.app
```

## Backend CORS Code Location
File: `transconnect-backend/src/index.ts`
Current setting: `origin: '*'` (allows all origins)

For production security, restrict to specific domains after frontend deployment.