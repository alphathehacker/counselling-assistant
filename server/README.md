# Admission Predictor Backend

Backend server for the Admission Predictor application using Node.js, Express, and MongoDB.

## Setup Instructions

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Environment Variables

Create a `.env` file in the `server` directory with the following variables:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/admissionpredictor?retryWrites=true&w=majority

# JWT Secret (use a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Port
PORT=5000

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Google OAuth (Get from https://console.cloud.google.com/)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Facebook OAuth (Get from https://developers.facebook.com/)
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
```

### 3. MongoDB Atlas Setup

1. Create an account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create a database user
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get your connection string and update `MONGODB_URI` in `.env`

### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Set authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

### 5. Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Set Valid OAuth Redirect URIs: `http://localhost:5000/api/auth/facebook/callback`
5. Copy App ID and App Secret to `.env`

### 6. Create Admin User

To create an admin user, you can use MongoDB Compass or a script. Admin can only be created directly in the database:

```javascript
// In MongoDB shell or Compass
db.users.insertOne({
  name: "Admin",
  email: "admin@admissionpredictor.com",
  password: "$2a$10$hashedpassword", // Use bcrypt to hash
  userType: "admin",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

Or use this script after setting up:

```javascript
// createAdmin.js
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import connectDB from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();
connectDB();

const createAdmin = async () => {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await User.create({
    name: 'Admin',
    email: 'admin@admissionpredictor.com',
    password: hashedPassword,
    userType: 'admin',
  });
  console.log('Admin created:', admin);
  process.exit(0);
};

createAdmin();
```

### 7. Run the Server

Development mode (with nodemon):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will run on `http://localhost:5000` by default.

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/facebook` - Facebook OAuth login
- `GET /api/auth/facebook/callback` - Facebook OAuth callback

## User Types

- **admin**: Single admin user (must be created manually)
- **user**: Regular users (can register normally)

## Notes

- Only one admin user can exist in the system
- Regular users can only be of type 'user' (enforced in registration)
- All protected routes require JWT token in Authorization header
- OAuth users are automatically created or linked to existing accounts
