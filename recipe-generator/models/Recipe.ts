import mongoose, { Document, Schema } from 'mongoose';

export interface IRecipe extends Document {
  id: string;
  title: string;
  image: string;
  ingredients: string[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cuisine: string;
  tags: string[];
  sourceUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RecipeSchema = new Schema<IRecipe>({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: [true, 'Recipe title is required'],
    trim: true,
  },
  image: {
    type: String,
    required: [true, 'Recipe image is required'],
  },
  ingredients: [{
    type: String,
    required: true,
  }],
  instructions: [{
    type: String,
    required: true,
  }],
  prepTime: {
    type: Number,
    required: [true, 'Prep time is required'],
    min: [0, 'Prep time cannot be negative'],
  },
  cookTime: {
    type: Number,
    required: [true, 'Cook time is required'],
    min: [0, 'Cook time cannot be negative'],
  },
  servings: {
    type: Number,
    required: [true, 'Servings is required'],
    min: [1, 'Servings must be at least 1'],
  },
  difficulty: {
    type: String,
    required: [true, 'Difficulty is required'],
    enum: ['easy', 'medium', 'hard'],
  },
  cuisine: {
    type: String,
    required: [true, 'Cuisine is required'],
    trim: true,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  sourceUrl: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Index for faster queries
RecipeSchema.index({ id: 1 });
RecipeSchema.index({ title: 'text', cuisine: 'text', tags: 'text' });

export default mongoose.models.Recipe || mongoose.model<IRecipe>('Recipe', RecipeSchema);
