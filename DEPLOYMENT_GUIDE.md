# FleetView Deployment Guide

This guide provides step-by-step instructions for deploying the FleetView dashboard to various hosting platforms.

## Prerequisites

- Node.js 20+ installed locally
- Git repository initialized
- npm or yarn package manager

## Option 1: Deploy to Vercel (Recommended)

Vercel is the optimal choice for Next.js applications with automatic deployments from Git.

### Steps:

1. **Create a Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub/GitLab/Bitbucket

2. **Import Project**
   - Click "New Project"
   - Select your repository
   - Vercel auto-detects Next.js configuration

3. **Configure Environment (Optional)**
   - Add any required environment variables
   - For this project, most features work without additional config

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (typically 3-5 minutes)
   - Your dashboard is live at `<project-name>.vercel.app`

### Automatic Deployments
- Push to main branch triggers automatic deployment
- Preview deployments for pull requests
- Easy rollback to previous versions

---

## Option 2: Deploy to Docker Container

### Prerequisites:
- Docker installed on your machine or server
- Docker Hub account (optional, for image hosting)

### Local Docker Deployment:

```bash
# Build Docker image
docker build -t fleetview:latest .

# Run container
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e NEXT_TELEMETRY_DISABLED=1 \
  fleetview:latest

# Access at http://localhost:3000
```

### Deploy to Docker Container Registry:

```bash
# Tag image for Docker Hub
docker tag fleetview:latest yourusername/fleetview:latest

# Push to Docker Hub
docker push yourusername/fleetview:latest

# Pull and run on any server
docker run -p 3000:3000 yourusername/fleetview:latest
```

---

## Option 3: Deploy to Cloud Platforms

### AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p "Node.js 20 running on 64bit Amazon Linux 2" fleetview

# Create environment
eb create fleetview-env

# Deploy
eb deploy

# Open in browser
eb open
```

### Google Cloud Run

```bash
# Set project
gcloud config set project YOUR_PROJECT_ID

# Build and push to Container Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/fleetview

# Deploy
gcloud run deploy fleetview \
  --image gcr.io/YOUR_PROJECT_ID/fleetview \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# Your service URL will be shown
```

### Azure App Service

```bash
# Login to Azure
az login

# Create resource group
az group create -n fleetview-rg -l eastus

# Create App Service plan
az appservice plan create \
  -n fleetview-plan \
  -g fleetview-rg \
  --is-linux \
  --sku B1

# Create web app
az webapp create \
  -n fleetview \
  -g fleetview-rg \
  -p fleetview-plan \
  --runtime "node|20-lts"

# Deploy from Git
az webapp up --name fleetview --resource-group fleetview-rg
```

### Railway.app

1. Connect your GitHub repository
2. Select the repository
3. Railway auto-detects Next.js
4. Click "Deploy" and wait for build
5. Your app is live at the provided URL

### Render

1. Go to [render.com](https://render.com)
2. Connect GitHub account
3. Click "New +" → "Web Service"
4. Select repository
5. Configure build and start commands:
   - Build: `npm install && npm run build`
   - Start: `npm start`
6. Deploy and your app is live

---

## Environment Configuration

### Required Environment Variables

For full functionality with AI features:

```env
NEXT_PUBLIC_GENKIT_API_KEY=your-google-genkit-key
```

### Optional Environment Variables

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_ENVIRONMENT=production
```

---

## Post-Deployment Checklist

- [ ] Test dashboard at deployed URL
- [ ] Verify all interactive features work (play, pause, reset)
- [ ] Check map visualization loads correctly
- [ ] Test AI summary generation
- [ ] Verify responsive design on mobile devices
- [ ] Monitor performance metrics
- [ ] Set up error tracking (Sentry, Rollbar)
- [ ] Configure custom domain (if applicable)
- [ ] Enable HTTPS (automatic on most platforms)
- [ ] Set up monitoring and alerts

---

## Performance Optimization

### For Production:

1. **Enable Compression**
   - Vercel: Automatic
   - Other platforms: Configure nginx/Apache

2. **Set Cache Headers**
   - Static assets: 1 year
   - HTML pages: no-cache

3. **CDN Configuration**
   - Images delivered via CDN
   - Vercel: Built-in
   - Others: Use Cloudflare, AWS CloudFront

4. **Database Optimization** (if using backend)
   - Index frequently queried fields
   - Connection pooling

---

## Troubleshooting

### Build Failures

**Issue**: "Cannot find module" errors
```bash
# Solution: Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Issue**: Build timeout
```bash
# Solution: Increase build timeout in vercel.json
{
  "buildCommand": "npm run build",
  "env": {
    "NODE_MEMORY": "3000"
  }
}
```

### Runtime Errors

**Issue**: Port already in use
```bash
# Use different port
PORT=3001 npm start
```

**Issue**: TypeScript compilation errors
```bash
# Check configuration
npm run typecheck

# Build with TS errors ignored (not recommended for production)
npm run build -- --no-lint
```

---

## Monitoring & Analytics

### Recommended Services:

1. **Error Tracking**: Sentry, Rollbar
2. **Performance**: Vercel Analytics, DataDog
3. **Uptime**: Statuspage, UptimeRobot
4. **Logs**: Loggly, Papertrail

---

## Security Considerations

- [ ] Enable HTTPS (automatic on major platforms)
- [ ] Set secure HTTP headers
- [ ] Implement rate limiting
- [ ] Validate all API inputs
- [ ] Rotate secrets regularly
- [ ] Enable CORS properly
- [ ] Use environment variables for secrets

---

## Rollback Procedures

### Vercel
- Go to Deployments tab
- Click the three dots on previous deployment
- Select "Redeploy"

### Docker
```bash
# Use tagged versions
docker run -p 3000:3000 fleetview:v1.0.0
```

### Manual Rollback
- Revert Git commit
- Redeploy from previous version

---

## Additional Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Docker Documentation](https://docs.docker.com/)
- [Cloud Platform Guides](https://cloud.google.com/docs)

---

For additional support or questions, contact the MapUp team.
