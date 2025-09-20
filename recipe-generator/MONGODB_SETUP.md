# MongoDB Setup Instructions

## 1. Install MongoDB

### Option A: Local MongoDB
1. Download and install MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Start MongoDB service
3. Default connection: `mongodb://localhost:27017`

### Option B: MongoDB Atlas (Cloud)
1. Go to https://www.mongodb.com/atlas
2. Create a free account
3. Create a new cluster
4. Get your connection string

## 2. Environment Variables

Create a `.env.local` file in the recipe-generator directory with:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/recipe-generator
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/recipe-generator

# JWT Secret (change this in production)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Hugging Face API Key
HF_API_KEY=your-hugging-face-api-key

# Spoonacular API Key (via RapidAPI)
SPOONACULAR_API_KEY=your-spoonacular-api-key
```

## 3. Install Dependencies

```bash
npm install
```

## 4. Start the Application

```bash
npm run dev
```

## 5. Database Collections

The application will automatically create these collections:
- `users` - User accounts and profiles
- `recipes` - Recipe data
- `userrecipes` - User-specific data (favorites, history)

## 6. Features

✅ **User Authentication**
- Registration with email/password
- Secure login with JWT tokens
- Password hashing with bcrypt

✅ **Data Persistence**
- Favorites persist across sessions
- History persists across sessions
- Recipe data stored in MongoDB

✅ **Security**
- HTTP-only cookies for JWT storage
- Password hashing with bcrypt
- Input validation and sanitization

## 7. Testing

1. Go to `http://localhost:3000`
2. Click "Sign In" to register/login
3. Upload a food image
4. Favorite some recipes
5. Reload the page - your data will persist!

## 8. Production Deployment

For production:
1. Use MongoDB Atlas or a production MongoDB instance
2. Set a strong JWT_SECRET
3. Use environment variables for all secrets
4. Enable HTTPS
5. Consider using a reverse proxy (nginx)
