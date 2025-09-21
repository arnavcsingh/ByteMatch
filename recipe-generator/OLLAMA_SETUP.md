# Ollama + Mistral Nutrition Calculator Setup

This project now uses Ollama with the Mistral model to calculate nutrition information for recipes using AI.

## 🚀 Quick Setup

### 1. Install Ollama
```bash
# Download and install from https://ollama.ai/
# Or use package manager:
# macOS: brew install ollama
# Linux: curl -fsSL https://ollama.ai/install.sh | sh
```

### 2. Start Ollama Service
```bash
ollama serve
```

### 3. Pull Mistral Model
```bash
ollama pull mistral
```

### 4. Test the Setup
```bash
# Run the test script
node scripts/test-ollama.js

# Or visit the test page
# http://localhost:3000/test-ollama
```

## 🧪 Testing

### Test Script
```bash
node scripts/test-ollama.js
```

### Test Page
Visit `http://localhost:3000/test-ollama` to test the integration with a web interface.

### Manual Test
```bash
# Test Ollama directly
curl http://localhost:11434/api/generate -d '{
  "model": "mistral",
  "prompt": "What is 2+2?",
  "stream": false
}'
```

## 🔧 How It Works

### 1. API Route (`/api/ollama-nutrition`)
- Receives ingredient list and serving count
- Creates detailed prompt with nutrition database
- Sends request to local Ollama instance
- Parses JSON response from Mistral
- Returns structured nutrition data

### 2. React Hook (`useOllamaNutrition`)
- Provides `calculateNutrition` function
- Handles loading states and errors
- Returns structured nutrition results

### 3. Components Updated
- **RecipeCard**: Shows AI-calculated nutrition with reasoning
- **RecipeModal**: Detailed nutrition tab with AI analysis
- **Test Component**: Standalone testing interface

## 📊 Features

### AI-Powered Calculations
- **Smart ingredient parsing**: Handles "2 cups flour", "1 tbsp olive oil", etc.
- **Unit conversions**: Converts cups, tbsp, oz, lb to grams
- **Nutrition database**: 100+ ingredients with accurate per-100g data
- **Per-serving calculations**: Divides by recipe servings
- **Missing ingredient handling**: Identifies unmatched ingredients

### Enhanced UI
- **AI reasoning display**: Shows how Mistral calculated the nutrition
- **Ingredient matching info**: Lists matched and unmatched ingredients
- **Loading states**: Proper loading indicators
- **Error handling**: Graceful error messages

## 🎯 Example Usage

```typescript
import { useOllamaNutrition } from '@/app/hooks/useOllamaNutrition';

function MyComponent() {
  const { calculateNutrition, isLoading, error } = useOllamaNutrition();
  
  const handleCalculate = async () => {
    const ingredients = ['2 cups flour', '1 tbsp olive oil', '1 lb ground beef'];
    const result = await calculateNutrition(ingredients, 4);
    
    if (result) {
      console.log('Nutrition per serving:', result.nutrition);
      console.log('Matched ingredients:', result.matchedIngredients);
      console.log('AI reasoning:', result.reasoning);
    }
  };
}
```

## 🔍 Troubleshooting

### Ollama Not Running
```bash
# Start Ollama service
ollama serve

# Check if running
curl http://localhost:11434/api/tags
```

### Mistral Model Missing
```bash
# Pull the model
ollama pull mistral

# List available models
ollama list
```

### Connection Issues
- Ensure Ollama is running on `http://localhost:11434`
- Check firewall settings
- Verify no other service is using port 11434

### Model Performance
- Mistral is a 7B parameter model (~4GB)
- First request may be slower (model loading)
- Subsequent requests should be faster
- Consider using smaller models for faster responses

## 📈 Performance Tips

### Model Selection
```bash
# For faster responses (smaller model)
ollama pull llama3.2:1b

# For better accuracy (larger model)
ollama pull mistral:7b
```

### Optimization
- Use low temperature (0.1) for consistent results
- Limit prompt length for faster processing
- Cache results for repeated calculations

## 🛠️ Development

### API Endpoint
- **URL**: `/api/ollama-nutrition`
- **Method**: POST
- **Body**: `{ ingredients: string[], servings: number }`
- **Response**: `{ nutrition, matchedIngredients, unmatchedIngredients, reasoning }`

### Customization
- Modify nutrition database in the API route
- Adjust prompt for different calculation styles
- Add more ingredient types and conversions
- Implement caching for better performance

## 📝 Notes

- **Local Processing**: All calculations happen locally (no external API calls)
- **Privacy**: Ingredient data stays on your machine
- **Offline**: Works without internet connection (after model download)
- **Customizable**: Easy to modify prompts and nutrition database
- **Extensible**: Can add more models or calculation methods

## 🎉 Benefits

1. **AI-Powered**: Uses advanced language model for intelligent calculations
2. **Local**: No external API dependencies or costs
3. **Accurate**: Comprehensive nutrition database with proper unit conversions
4. **Transparent**: Shows AI reasoning for calculations
5. **Flexible**: Easy to customize and extend
6. **Fast**: Local processing for quick responses
