# Admission Predictor - Complete Setup Guide

This guide will help you set up the complete authentication system with MongoDB, registration, login, and OAuth integration.

## Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account (free tier available)
- Google Cloud Console account (for Google OAuth)
- Facebook Developer account (for Facebook OAuth)

## Step 1: Backend Setup

### 1.1 Install Backend Dependencies

```bash
cd server
npm install
```

### 1.2 Configure MongoDB Atlas

1. Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user:
   - Go to "Database Access"
   - Click "Add New Database User"
   - Set username and password
   - Set privileges to "Atlas admin" (or custom with read/write)
4. Whitelist your IP:
   - Go to "Network Access"
   - Click "Add IP Address"
   - For development, use "0.0.0.0/0" (allows all IPs)
5. Get connection string:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `admissionpredictor`

### 1.3 Create Backend .env File

Create `server/.env` file:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/admissionpredictor?retryWrites=true&w=majority

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-123456789

# Server Port
PORT=5000

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Google OAuth (see Step 1.4)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Facebook OAuth (see Step 1.5)
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
```

### 1.4 Setup Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable Google+ API:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"
4. Create OAuth Credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Configure consent screen (if not done):
     - User Type: External
     - App name: Admission Predictor
     - User support email: your email
     - Developer contact: your email
   - Create OAuth 2.0 Client ID:
     - Application type: Web application
     - Name: Admission Predictor Web Client
     - Authorized redirect URIs:
       - `http://localhost:5000/api/auth/google/callback`
       - For production: `https://yourdomain.com/api/auth/google/callback`
5. Copy Client ID and Client Secret to `server/.env`

### 1.5 Setup Facebook OAuth

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app:
   - Click "My Apps" → "Create App"
   - Choose "Consumer" app type
   - Fill in app details
3. Add Facebook Login:
   - In dashboard, click "Add Product"
   - Find "Facebook Login" and click "Set Up"
4. Configure OAuth Redirect URIs:
   - Go to "Settings" → "Basic"
   - Add "Valid OAuth Redirect URIs":
     - `http://localhost:5000/api/auth/facebook/callback`
     - For production: `https://yourdomain.com/api/auth/facebook/callback`
5. Copy App ID and App Secret to `server/.env`

### 1.6 Create Admin User (Optional)

After starting the server, you can create an admin user using MongoDB Compass or a script:

```javascript
// Use MongoDB Compass or create a script
// The admin password should be hashed using bcrypt
// For testing, you can use this approach:

// In MongoDB Compass or shell:
db.users.insertOne({
  name: "Admin",
  email: "admin@admissionpredictor.com",
  password: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy", // This is "admin123" hashed
  userType: "admin",
  isActive: true,
  profileCompletion: 0,
  statistics: {
    totalPredictions: 0,
    bookmarkedColleges: 0,
    reportsDownloaded: 0,
    profileViews: 0
  },
  createdAt: new Date(),
  updatedAt: new Date()
})
```

Or use this Node.js script:

```javascript
// server/scripts/createAdmin.js
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config({ path: './.env' });

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existingAdmin = await User.findOne({ userType: 'admin' });
    if (existingAdmin) {
      console.log('Admin already exists');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@admissionpredictor.com',
      password: hashedPassword,
      userType: 'admin',
    });

    console.log('Admin created successfully:', admin.email);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createAdmin();
```

Run it with:
```bash
node server/scripts/createAdmin.js
```

### 1.7 Start Backend Server

```bash
cd server
npm run dev  # Development mode with nodemon
# or
npm start    # Production mode
```

The server should start on `http://localhost:5000`

## Step 2: Frontend Setup

### 2.1 Install Frontend Dependencies (if not already done)

```bash
npm install
```

### 2.2 Create Frontend .env File

Create `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:5000/api
```

For production, update to your backend URL:
```env
VITE_API_URL=https://your-backend-domain.com/api
```

### 2.3 Start Frontend Development Server

```bash
npm start
```

The frontend should start on `http://localhost:5173` (or port 4028 if using the configured port)

## Step 3: Testing

### 3.1 Test Registration

1. Go to `http://localhost:5173`
2. Click "Get Started" or go to `/register`
3. Fill in the registration form
4. Submit and verify you're redirected to dashboard

### 3.2 Test Login

1. Go to `/login`
2. Enter your registered email and password
3. Verify login works

### 3.3 Test OAuth

1. Click "Google" or "Facebook" button on login/register page
2. Complete OAuth flow
3. Verify you're redirected back and logged in

### 3.4 Test Protected Routes

1. Try accessing `/student-dashboard` without logging in
2. Verify you're redirected to `/login`
3. After login, verify you can access protected routes

## Step 4: User Types

### Regular Users

- Can register normally via `/register`
- Automatically assigned `userType: 'user'`
- Can access all user features

### Admin Users

- Must be created manually in database
- Only one admin can exist
- Has `userType: 'admin'`
- Can be used for admin-only features (to be implemented)

## Troubleshooting

### MongoDB Connection Issues

- Verify your IP is whitelisted in MongoDB Atlas
- Check connection string format
- Ensure password doesn't contain special characters (URL encode if needed)

### OAuth Not Working

- Verify redirect URIs match exactly (including http/https, port, path)
- Check client IDs and secrets are correct
- Ensure OAuth apps are in "Live" mode for production

### CORS Errors

- Verify `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check CORS middleware in `server.js`

### JWT Errors

- Verify `JWT_SECRET` is set
- Clear localStorage and login again
- Check token expiration (default 30 days)

## Production Deployment

1. Update all environment variables for production URLs
2. Use strong `JWT_SECRET`
3. Enable HTTPS for OAuth redirects
4. Update CORS settings
5. Set appropriate MongoDB IP whitelist
6. Use environment-specific `.env` files

## Support

For issues, check:
- Backend logs in console
- Browser console for frontend errors
- Network tab for API call failures
- MongoDB Atlas logs for database issues
