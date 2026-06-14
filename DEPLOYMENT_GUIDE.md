# BrightStore Production Deployment Guide

This guide describes the configuration and deployment procedures for taking the BrightStore full-stack bidding marketplace to production environments.

---

## 🏗️ Architecture Summary

- **Frontend**: React + TypeScript + Vite + Tailwind CSS. Compiled assets are static and hosted on CDNs (e.g. Vercel, Netlify).
- **Backend**: Express + Mongoose + Socket.io. Deployed to dynamic server nodes (e.g. Render, Railway, AWS ECS).
- **Database**: MongoDB (Atlas) cluster.
- **Image CDN**: Cloudinary.

---

## 📦 Environment Variables Configuration

### Backend Setup (`.env`)

Configure the following environment variables on the backend hosting platform:

```ini
# Core Configuration
PORT=5001
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/brightstore?retryWrites=true&w=majority

# Security Keys
JWT_SECRET=your_production_jwt_signing_key_secret

# Cloudinary CDN Storage
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Frontend Setup (`.env.production`)

Configure the VTE env variables on the static hosting client:

```ini
VITE_API_URL=https://your-backend-domain.onrender.com/api
```

---

## 🚀 Step-by-Step Deployment Steps

### 1. Database Provisioning (MongoDB Atlas)
1. Sign up on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Provision a free tier cluster and create a database user with read/write credentials.
3. Whitelist access from all IPs (`0.0.0.0/0`) or map it to your backend host's server IP addresses.
4. Copy the MONGODB URI string.

### 2. Backend API Service Deployment (e.g. Render)
1. Register on [Render.com](https://render.com).
2. Connect your repository and select **New Web Service**.
3. Choose the root folder or set the base path to `backend/`.
4. Configure Build Command: `npm install && npm run build`
5. Configure Start Command: `npm start`
6. Add the environment variables from the Backend Setup section.

### 3. Frontend Static Client Deployment (e.g. Vercel)
1. Register on [Vercel.com](https://vercel.com).
2. Link your repo and create a project pointing to `frontend/` directory.
3. Configure the environment variables (e.g. `VITE_API_URL`).
4. Trigger the build and deploy.

---

## ⚡ Production Optimizations & Maintenance

- **DB Indexes**: Mongoose schema indices are automatically built on startup. Ensure write lock-out matches during primary indexing by inspecting MongoDB Atlas collections.
- **Central Logs**: Stream Express HTTP and system errors to external log services (e.g. Papertrail, Datadog) using winston or Morgan transports.
- **WebSocket Rooms**: Socket.io leverages internal memory adapter. For multi-node scaling, use `@socket.io/redis-adapter` to sync events across cluster worker processes.
