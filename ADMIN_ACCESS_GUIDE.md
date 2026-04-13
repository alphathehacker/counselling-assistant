# Admin Portal Access Guide

## Step 1: Create Admin User

Admin users are stored in a separate `admins` collection in MongoDB. You need to create an admin user using the script:

### Method 1: Using the Script (Recommended)

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Run the admin creation script:**
   ```bash
   node scripts/createAdmin.js
   ```

3. **Default credentials will be created in `admins` collection:**
   - Email: `admin@admissionpredictor.com`
   - Password: `admin123`
   - Collection: `admins` (separate from `users` collection)

4. **Customize credentials (optional):**
   You can set environment variables before running the script:
   ```bash
   # Windows PowerShell
   $env:ADMIN_EMAIL="your-admin@email.com"
   $env:ADMIN_PASSWORD="your-secure-password"
   $env:ADMIN_NAME="Admin Name"
   node scripts/createAdmin.js
   
   # Or add to server/.env file:
   ADMIN_EMAIL=your-admin@email.com
   ADMIN_PASSWORD=your-secure-password
   ADMIN_NAME=Admin Name
   ```

### Method 2: Using MongoDB Compass/Shell

1. **Connect to your MongoDB database**

2. **Run this command in the `admins` collection:**
   ```javascript
   // Note: You need to hash the password using bcrypt
   // Use this Node.js code or an online bcrypt generator:
   
   db.admins.insertOne({
     name: "Admin",
     email: "admin@admissionpredictor.com",
     password: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy", // This is "admin123" hashed
     role: "admin",
     isActive: true,
     permissions: {
       manageColleges: true,
       manageUsers: true,
       manageDatasets: true,
       viewAnalytics: true
     },
     createdAt: new Date(),
     updatedAt: new Date()
   })
   ```

   **To hash a custom password:**
   - Use an online bcrypt generator: https://bcrypt-generator.com/
   - Or use Node.js:
     ```javascript
     const bcrypt = require('bcryptjs');
     const hash = bcrypt.hashSync('your-password', 10);
     console.log(hash);
     ```

## Step 2: Access Admin Portal

1. **Start the application:**
   ```bash
   # Terminal 1: Start backend
   cd server
   npm run dev
   
   # Terminal 2: Start frontend
   npm start
   ```

2. **Login as Admin:**
   - Go to `http://localhost:4028/login` (or your frontend URL)
   - Enter your admin email and password
   - Click "Sign in"

3. **Navigate to Admin Panel:**
   - **Option 1:** Click "Admin" in the header navigation (visible only for admin users)
   - **Option 2:** Go directly to `http://localhost:4028/admin`

## Step 3: Using the Admin Portal

### Upload CSV Files

1. **Click on "Upload CSV" tab**

2. **Prepare your CSV file:**
   - Use the format specified in `server/CSV_IMPORT_TEMPLATE.md`
   - Required columns: College Name, College Code, City, State, College Type, Exam Type, Branch, Category, Year, Closing Rank
   - See the template for optional columns (fees, placements, rankings, etc.)

3. **Upload:**
   - Click "Select CSV File"
   - Choose your CSV file
   - Click "Upload CSV"
   - Wait for upload to complete
   - Check the results (colleges created/updated)

### Manage Colleges

1. **Click on "Manage Colleges" tab**

2. **View all colleges:**
   - See list of all colleges in the database
   - Search by name or code
   - View college details (location, type, exam types)

3. **Delete colleges:**
   - Click "Delete" button next to any college
   - Confirm deletion

## Troubleshooting

### "Access Denied" or Redirected to Dashboard

- **Check if you're logged in as admin:**
  - Look at the header - you should see an "Admin" link
  - If you don't see it, you're not logged in as admin
  - Check your user type in the database: `db.users.findOne({email: "your-email"})`

### "Admin Already Exists" Error

- Only one admin user is allowed
- Delete the existing admin first, or use the existing admin credentials
- To delete: `db.users.deleteOne({userType: "admin"})`

### Can't Create Admin via Script

- Make sure MongoDB is running and connected
- Check your `.env` file has `MONGODB_URI` set correctly
- Ensure you're in the `server` directory when running the script

### CSV Upload Fails

- Check CSV format matches the template
- Ensure file size is under 10MB
- Check backend console for detailed error messages
- Verify column names match exactly (case-sensitive)

## Security Notes

⚠️ **Important Security Reminders:**

1. **Change default password immediately** after first login
2. **Don't commit admin credentials** to version control
3. **Use strong passwords** for admin accounts
4. **Limit admin access** to trusted personnel only
5. **Regularly backup** your database

## Quick Reference

- **Admin Portal URL:** `http://localhost:4028/admin`
- **Create Admin Script:** `node server/scripts/createAdmin.js`
- **Default Admin Email:** `admin@admissionpredictor.com`
- **Default Admin Password:** `admin123` (change this!)
