# ByteMatch  

ByteMatch is an AI-powered recipe discovery and nutrition platform that combines image recognition, recipe search, and intelligent user experience. Users can upload a food photo to find recipes, filter by cuisine or ingredients, and get accurate nutrition information. The platform enhances results with high-quality food photography and supports both guest and authenticated user states.  

## Overview  

ByteMatch was built with a modern full-stack TypeScript architecture. The frontend uses Next.js 14 with React 18 and TypeScript 5, styled with Tailwind CSS and Radix UI components. The backend runs on Next.js API Routes with MongoDB and Mongoose for persistence, secured with JWT authentication and bcrypt-hashed passwords. External APIs power the core functionality: Spoonacular for recipes, Clarifai for food recognition, and Pexels for food photography, with an experimental Ollama/Mistral integration for AI nutrition analysis.  

## Tech Stack  

- Frontend: Next.js 14 (App Router), React 18, TypeScript 5, Tailwind CSS, Radix UI, Lucide React, Framer Motion  
- Backend: Next.js API Routes, MongoDB, Mongoose  
- Authentication: JWT, bcryptjs, HTTP-only cookies  
- APIs & Services: Spoonacular API, Clarifai API, Pexels API, Ollama/Mistral (experimental)  
- Development Tools: ESLint, Prettier, PostCSS, Autoprefixer  

## Features  

- Image-based recipe discovery with Clarifai + Spoonacular integration  
- Advanced recipe search with filtering by cuisine, ingredients, cook time, and difficulty  
- Nutrition engine with ingredient database, unit conversions, and fuzzy matching  
- Flexible user experience:  
  - Guest users → session-based storage  
  - Authenticated users → MongoDB persistence  
- Image enhancement pipeline with Pexels for high-quality recipe images  
- Performance optimizations including caching, lazy loading, and API rate limiting  

## Data Flow  

1. User uploads an image → Clarifai classifies the food  
2. Food type → Spoonacular API → Recipe search with filters  
3. Recipe data → Local nutrition calculation → Per-serving breakdown  
4. User interactions → Stored in MongoDB (authenticated) or session storage (guest)  
5. Images → Enhanced with Pexels API for best matches  

## Security  

- JWT-based authentication  
- Bcrypt password hashing with 12 salt rounds  
- Input validation and sanitization  
- Rate limiting on authentication endpoints  

## Performance  

- Recipe caching with intelligent invalidation  
- Batched API requests to minimize rate limits  
- Lazy loading of recipe images  
- Component memoization for expensive operations  

## Setup & Installation  

```bash
# Clone the repository
git clone https://github.com/arnavcsingh/bytematch.git
cd bytematch

# Install dependencies
npm install

# Create environment variables
cp .env.example .env.local

# Start the development server
npm run dev
