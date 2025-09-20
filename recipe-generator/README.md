# Recipe Generator

A Next.js web application that allows users to upload food images, classify dishes using AI, and get personalized recipe recommendations with filtering capabilities.

## Features

- 📸 **Image Upload**: Drag & drop or click to upload food images
- 🤖 **AI Classification**: Stub ML model to identify dish type, cuisine, and ingredients
- 🍳 **Recipe Recommendations**: Get personalized recipes based on uploaded images
- 🔍 **Advanced Filtering**: Filter recipes by available ingredients, prep time, difficulty, and cuisine
- ❤️ **Favorites**: Save favorite recipes for easy access
- 📚 **History**: Track recently viewed recipes
- 💾 **Local Storage**: Persistent favorites and history using localStorage
- 📱 **Responsive Design**: Mobile-friendly interface with Tailwind CSS

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Radix UI primitives
- **Icons**: Lucide React
- **Storage**: localStorage for persistence

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd recipe-generator
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
recipe-generator/
├── app/
│   ├── api/
│   │   ├── classify/          # Image classification endpoint
│   │   └── recipes/           # Recipe fetching endpoint
│   ├── components/
│   │   ├── image-upload/      # Image upload component
│   │   ├── recipe-card/       # Recipe display component
│   │   └── ingredient-filter/ # Recipe filtering component
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Main page
├── helpers/
│   └── storage.ts             # localStorage utilities
├── types/
│   └── index.ts               # TypeScript type definitions
└── package.json
```

## API Endpoints

### POST /api/classify
Classifies uploaded food images and returns dish information.

**Request**: FormData with image file
**Response**: 
```json
{
  "dish": "Pizza",
  "confidence": 0.95,
  "cuisine": "Italian",
  "tags": ["cheese", "tomato", "dough"]
}
```

### GET /api/recipes
Fetches recipes based on classification and filters.

**Query Parameters**:
- `dish`: Dish type to search for
- `cuisine`: Cuisine type filter
- `ingredients`: Comma-separated list of available ingredients
- `maxPrepTime`: Maximum preparation time in minutes
- `maxCookTime`: Maximum cooking time in minutes
- `difficulty`: Difficulty level filter

**Response**:
```json
{
  "recipes": [...],
  "total": 6
}
```

## Usage

1. **Upload Image**: Click or drag & drop a food image
2. **Classify**: Click "Find Recipes" to analyze the image
3. **Filter**: Use the ingredient filter to customize recommendations
4. **Save**: Add recipes to favorites or view details
5. **Browse**: Access favorites and history from the navigation tabs

## Features in Detail

### Image Upload
- Supports drag & drop and file selection
- Image preview with file information
- File type validation (images only)
- Processing state indicators

### Recipe Filtering
- Filter by available ingredients
- Time-based filtering (prep/cook time)
- Difficulty level selection
- Cuisine type filtering
- Real-time filter updates

### Data Persistence
- Favorites stored in localStorage
- Recipe viewing history
- User preferences
- Storage usage monitoring

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Features

1. **New Recipe Sources**: Extend the `/api/recipes` endpoint
2. **ML Integration**: Replace stub classification with real ML model
3. **User Accounts**: Add authentication and cloud storage
4. **Recipe Details**: Create detailed recipe view pages
5. **Social Features**: Add sharing and rating capabilities

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Future Enhancements

- [ ] Real ML model integration for image classification
- [ ] User authentication and cloud storage
- [ ] Recipe rating and review system
- [ ] Social sharing features
- [ ] Nutritional information
- [ ] Shopping list generation
- [ ] Meal planning features
- [ ] Voice search capabilities
